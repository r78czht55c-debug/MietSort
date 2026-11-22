-- Apply to a fresh Supabase project. auth.users/auth.uid() are supplied by Supabase.
begin;

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  public_slug uuid not null unique default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  address text not null check (char_length(btrim(address)) between 1 and 500),
  warm_rent_cents integer check (warm_rent_cents >= 0),
  available_from date,
  accepting_applications boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  email text not null check (
    char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  people smallint not null check (people between 1 and 20),
  move_in date not null,
  message text not null default '' check (char_length(message) <= 5000),
  review_status text not null default 'new' check (review_status in ('new', 'reviewed')),
  shortlisted boolean not null default false,
  privacy_notice_version text not null check (
    char_length(btrim(privacy_notice_version)) between 1 and 100
  ),
  submitted_at timestamptz not null default now(),
  -- The submission backend must calculate this from the agreed retention policy.
  delete_after timestamptz not null,
  constraint applications_deletion_after_submission check (delete_after > submitted_at)
);

create index properties_owner_idx on public.properties(owner_id);
create index applications_property_submitted_idx on public.applications(property_id, submitted_at desc);
create index applications_delete_after_idx on public.applications(delete_after);

alter table public.properties enable row level security;
alter table public.applications enable row level security;

-- Explicit privileges also remove permissive Supabase default table grants.
-- Row policies alone cannot prevent changing applicant data or transferring ownership.
revoke all on public.properties, public.applications from public, anon, authenticated;
grant select, delete on public.properties to authenticated;
grant insert (title, address, warm_rent_cents, available_from, accepting_applications)
  on public.properties to authenticated;
grant update (title, address, warm_rent_cents, available_from, accepting_applications)
  on public.properties to authenticated;
grant select, delete on public.applications to authenticated;
grant update (review_status, shortlisted) on public.applications to authenticated;

-- Only a trusted server may insert submissions. Never put this key in the browser.
grant select, insert, update, delete on public.properties, public.applications to service_role;

create policy properties_select_own on public.properties for select to authenticated
  using (owner_id = (select auth.uid()));
create policy properties_insert_own on public.properties for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy properties_update_own on public.properties for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy properties_delete_own on public.properties for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy applications_select_own on public.applications for select to authenticated
  using (exists (
    select 1 from public.properties p
    where p.id = applications.property_id and p.owner_id = (select auth.uid())
  ));
create policy applications_update_own on public.applications for update to authenticated
  using (exists (
    select 1 from public.properties p
    where p.id = applications.property_id and p.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.properties p
    where p.id = applications.property_id and p.owner_id = (select auth.uid())
  ));
create policy applications_delete_own on public.applications for delete to authenticated
  using (exists (
    select 1 from public.properties p
    where p.id = applications.property_id and p.owner_id = (select auth.uid())
  ));

comment on column public.properties.public_slug is
  'Opaque reference for a future public form endpoint. Grants no database access.';
comment on column public.applications.privacy_notice_version is
  'Version of the notice displayed at submission; not proof of a legal basis or consent.';
comment on column public.applications.delete_after is
  'Required deletion deadline. A scheduled deletion job is not installed yet.';

commit;
