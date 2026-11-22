import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const landlordA = '00000000-0000-4000-8000-000000000001';
const landlordB = '00000000-0000-4000-8000-000000000002';
const propertyA = '10000000-0000-4000-8000-000000000001';
const propertyB = '10000000-0000-4000-8000-000000000002';
const applicationA = '20000000-0000-4000-8000-000000000001';
const applicationB = '20000000-0000-4000-8000-000000000002';

before(async () => {
  // Minimal stand-in for Supabase Auth. These tests exercise PostgreSQL permissions
  // and RLS, not the real Auth service, HTTP API, email or browser sessions.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/20261122000100_initial_schema.sql', import.meta.url), 'utf8'));
  await db.query('insert into auth.users(id) values ($1), ($2)', [landlordA, landlordB]);
  await db.query(`
    insert into public.properties (id, owner_id, title, address)
    values ($1, $2, 'Wohnung A', 'Testadresse A'), ($3, $4, 'Wohnung B', 'Testadresse B')
  `, [propertyA, landlordA, propertyB, landlordB]);
  await db.query(`
    insert into public.applications (id, property_id, name, email, people, move_in, privacy_notice_version, delete_after)
    values ($1, $2, 'Test A', 'a@example.invalid', 1, '2027-01-01', 'test-v1', now() + interval '30 days'),
           ($3, $4, 'Test B', 'b@example.invalid', 2, '2027-01-01', 'test-v1', now() + interval '30 days')
  `, [applicationA, propertyA, applicationB, propertyB]);
});

after(async () => { await db.close(); });

async function asRole(role, uid, action) {
  await db.exec('begin');
  try {
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [uid ?? '']);
    // role is a fixed test constant, never user input.
    assert.ok(['anon', 'authenticated', 'service_role'].includes(role));
    await db.exec(`set local role ${role}`);
    return await action();
  } finally {
    await db.exec('rollback');
  }
}

async function denied(action, code = '42501') {
  await assert.rejects(action, error => error.code === code);
}

test('anonymous visitors cannot read either table', async () => {
  for (const table of ['properties', 'applications']) {
    await asRole('anon', null, () => denied(() => db.query(`select * from public.${table}`)));
  }
});

test('anonymous visitors cannot submit directly', async () => {
  await asRole('anon', null, () => denied(() => db.query('insert into public.applications default values')));
});

test('an authenticated request without a user sees no rows', async () => {
  await asRole('authenticated', null, async () => {
    assert.equal((await db.query('select * from public.properties')).rows.length, 0);
    assert.equal((await db.query('select * from public.applications')).rows.length, 0);
  });
});

test('both landlords see only their own property and application', async () => {
  for (const [user, property, application] of [
    [landlordA, propertyA, applicationA], [landlordB, propertyB, applicationB]
  ]) {
    await asRole('authenticated', user, async () => {
      assert.deepEqual((await db.query('select id from public.properties')).rows, [{ id: property }]);
      assert.deepEqual((await db.query('select id from public.applications')).rows, [{ id: application }]);
    });
  }
});

test('landlord can create and edit an own property with a server-generated owner and link', async () => {
  await asRole('authenticated', landlordA, async () => {
    const { rows: [created] } = await db.query(`
      insert into public.properties (title, address, warm_rent_cents)
      values ('Neue Wohnung', 'Testadresse', 115000) returning *
    `);
    assert.equal(created.owner_id, landlordA);
    assert.ok(created.public_slug);
    assert.equal(created.accepting_applications, false);
    assert.equal((await db.query('update public.properties set title = $1 where id = $2 returning title',
      ['Geändert', created.id])).rows[0].title, 'Geändert');
  });
});

test('landlord cannot assign or transfer ownership', async () => {
  await asRole('authenticated', landlordA, () => denied(() => db.query(
    'insert into public.properties (owner_id, title, address) values ($1, $2, $3)',
    [landlordB, 'Fremd', 'Testadresse'])));
  await asRole('authenticated', landlordA, () => denied(() => db.query(
    'update public.properties set owner_id = $1 where id = $2', [landlordB, propertyA])));
});

test('landlord cannot change link references or creation timestamps', async () => {
  await asRole('authenticated', landlordA, () => denied(() => db.query(
    'update public.properties set public_slug = gen_random_uuid() where id = $1', [propertyA])));
  await asRole('authenticated', landlordA, () => denied(() => db.query(
    'update public.properties set created_at = now() where id = $1', [propertyA])));
});

test('landlord cannot update or delete foreign properties', async () => {
  await asRole('authenticated', landlordA, async () => {
    assert.equal((await db.query('update public.properties set title = $1 where id = $2 returning id', ['Fremd', propertyB])).rows.length, 0);
    assert.equal((await db.query('delete from public.properties where id = $1 returning id', [propertyB])).rows.length, 0);
  });
});

test('review status and shortlist remain independent', async () => {
  await asRole('authenticated', landlordA, async () => {
    await db.query('update public.applications set shortlisted = true where id = $1', [applicationA]);
    await db.query("update public.applications set review_status = 'reviewed' where id = $1", [applicationA]);
    assert.deepEqual((await db.query('select review_status, shortlisted from public.applications where id = $1',
      [applicationA])).rows, [{ review_status: 'reviewed', shortlisted: true }]);
  });
});

test('landlord cannot modify applicant data or reassign an application', async () => {
  for (const [field, value] of [['name', 'Verändert'], ['email', 'changed@example.invalid'],
    ['property_id', propertyB], ['delete_after', '2099-01-01']]) {
    await asRole('authenticated', landlordA, () => denied(() => db.query(
      `update public.applications set ${field} = $1 where id = $2`, [value, applicationA])));
  }
});

test('landlord cannot create applications through the table API', async () => {
  await asRole('authenticated', landlordA, () => denied(() => db.query('insert into public.applications default values')));
});

test('landlord cannot update or delete a foreign application', async () => {
  await asRole('authenticated', landlordA, async () => {
    assert.equal((await db.query('update public.applications set shortlisted = true where id = $1 returning id', [applicationB])).rows.length, 0);
    assert.equal((await db.query('delete from public.applications where id = $1 returning id', [applicationB])).rows.length, 0);
  });
});

test('landlord can delete an own application', async () => {
  await asRole('authenticated', landlordA, async () => {
    assert.deepEqual((await db.query('delete from public.applications where id = $1 returning id', [applicationA])).rows,
      [{ id: applicationA }]);
  });
});

test('deleting an own property removes its applications but preserves the other landlord data', async () => {
  await asRole('authenticated', landlordA, async () => {
    await db.query('delete from public.properties where id = $1', [propertyA]);
    await db.exec('reset role');
    assert.deepEqual((await db.query('select id from public.applications')).rows, [{ id: applicationB }]);
    assert.deepEqual((await db.query('select id from public.properties')).rows, [{ id: propertyB }]);
  });
});

test('trusted backend can insert an application', async () => {
  await asRole('service_role', null, async () => {
    const { rows: [created] } = await db.query(`
      insert into public.applications (property_id, name, email, people, move_in, privacy_notice_version, delete_after)
      values ($1, 'Server-Test', 'server@example.invalid', 1, '2027-01-01', 'test-v1', now() + interval '30 days')
      returning review_status, shortlisted
    `, [propertyA]);
    assert.deepEqual(created, { review_status: 'new', shortlisted: false });
  });
});

test('invalid applicant values, missing deletion deadlines and orphan submissions are rejected', async () => {
  for (const [people, email, deadline, property, code] of [
    [0, 'a@example.invalid', '2099-01-01', propertyA, '23514'],
    [1, 'invalid', '2099-01-01', propertyA, '23514'],
    [1, 'a@example.invalid', null, propertyA, '23502'],
    [1, 'a@example.invalid', '2000-01-01', propertyA, '23514'],
    [1, 'a@example.invalid', '2099-01-01', '10000000-0000-4000-8000-000000000099', '23503']
  ]) {
    await asRole('service_role', null, () => denied(() => db.query(`
      insert into public.applications (property_id, name, email, people, move_in, privacy_notice_version, delete_after)
      values ($1, 'Test', $2, $3, '2027-01-01', 'test-v1', $4)
    `, [property, email, people, deadline]), code));
  }
});

test('unknown review statuses are rejected', async () => {
  await asRole('authenticated', landlordA, () => denied(() => db.query(
    "update public.applications set review_status = 'accepted' where id = $1", [applicationA]), '23514'));
});

test('account deletion cascades to owned properties and applications only', async () => {
  await db.exec('begin');
  try {
    await db.query('delete from auth.users where id = $1', [landlordA]);
    assert.deepEqual((await db.query('select id from public.properties')).rows, [{ id: propertyB }]);
    assert.deepEqual((await db.query('select id from public.applications')).rows, [{ id: applicationB }]);
  } finally { await db.exec('rollback'); }
});
