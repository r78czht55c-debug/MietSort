# Datenbankgrundlage

Stand: 22.11.2026. Vorbereitet für Supabase/PostgreSQL; noch nicht mit der Demo verbunden oder in ein Cloud-Projekt eingespielt.

## Datenmodell

```text
auth.users (Supabase-Anmeldung)
    └── properties (Wohnungen, owner_id)
            └── applications (Bewerbungen, property_id)
```

Ein Vermieterkonto kann mehrere Wohnungen besitzen. Jede Bewerbung gehört genau einer Wohnung. Wir speichern kein zusätzliches Vermieterprofil und keine zweite Kopie des Passworts: Konten verwaltet Supabase Auth.

`properties` enthält Titel, Adresse, optionale Warmmiete in Cent und Verfügbarkeit, einen Schalter für die Bewerbungsphase und eine zufällige öffentliche Referenz (`public_slug`). Neue Wohnungen nehmen standardmäßig noch keine Bewerbungen an.

`applications` enthält zunächst Name, E-Mail, Personenzahl, Einzugswunsch und Nachricht. Diese Felder orientieren sich am Prototyp und sind vorläufig. Einkommen, Haustiere, eigene Auswahlkriterien und Dokumente ergänzen wir erst nach Klärung des tatsächlichen Ablaufs. Es gibt keine Punktzahl und keine automatische Auswahl.

`review_status` (`new`/`reviewed`) und `shortlisted` sind getrennt: Prüfen entfernt keine Vormerkung. `submitted_at` dokumentiert den Eingang. `privacy_notice_version` hält fest, welcher Hinweis bei der Abgabe angezeigt wurde; das ersetzt weder die Festlegung einer Rechtsgrundlage noch einen Einwilligungsnachweis. `delete_after` muss vom späteren Server anhand der vereinbarten Aufbewahrungsregel gesetzt werden. Es wird keine pauschale Dauer vorgegeben.

## Zugriffe

| Rolle | Wohnungen | Bewerbungen |
| --- | --- | --- |
| Öffentlich (`anon`) | Kein direkter Tabellenzugriff | Kein direkter Tabellenzugriff |
| Angemeldeter Vermieter | Eigene anlegen, lesen, bearbeiten, löschen | Eigene lesen, Prüfstatus/Vormerkung ändern, löschen |
| Vertrauenswürdiger Server (`service_role`) | Verwaltungszugriff | Einfügen und Verwaltungszugriff |

Die Migration aktiviert Row Level Security und setzt explizite Tabellen- und Spaltenrechte. Ein Vermieter darf weder Eigentümer und öffentliche Referenzen überschreiben noch Bewerberangaben ändern oder Bewerbungen einer anderen Wohnung zuordnen. Ein fremder Datensatz bleibt auch bei bekannter ID unsichtbar. Tabellenrechte werden ausdrücklich von `PUBLIC`, `anon` und `authenticated` zurückgenommen, bevor nur die benötigten Rechte vergeben werden.

Das Löschen einer Wohnung löscht auch ihre Bewerbungen. Das Löschen eines Kontos in `auth.users` löscht seine Wohnungen einschließlich der Bewerbungen. Diese Vorgänge müssen in der späteren Oberfläche klar bestätigt werden. Eine zeitgesteuerte Löschung ist noch nicht implementiert; das Feld `delete_after` allein löscht keine Daten.

## Geplanter öffentlicher Bewerbungsweg

Der öffentliche Link soll eine zufällige `public_slug` enthalten. Diese Referenz ist keine Berechtigung, Bewerbungen zu lesen. Ein späterer Server-Endpunkt muss:

1. Die Referenz auflösen und nur zur Veröffentlichung bestimmte Wohnungsangaben zurückgeben.
2. Bei jeder Abgabe prüfen, ob die Wohnung noch Bewerbungen annimmt.
3. Eingaben prüfen, erlaubte Felder explizit auswählen und Größenlimits durchsetzen.
4. Missbrauchsschutz und Anfragelimits anwenden.
5. Wohnungs-ID, Eingangszeit, Anfangsstatus, Hinweisversion und Löschfrist selbst bestimmen.
6. Die Bewerbung speichern und nur eine Bestätigung zurückgeben, keine Bewerberliste.

Die Prüfung der geöffneten Bewerbungsphase und das Einfügen sollten transaktional erfolgen, damit zwischenzeitliches Schließen berücksichtigt wird. Die Datenbankmigration allein implementiert diesen Endpunkt noch nicht. Auch `service_role` muss mit den erlaubten Vorgängen sorgfältig umgehen: Diese Rolle umgeht RLS.

Die im Browser verwendete Supabase-Projektadresse und der Publishable Key sind von einem geheimen Server-Schlüssel zu unterscheiden. Ein Secret-/Service-Role-Schlüssel darf niemals in `dist/`, eine Browser-Konfiguration oder Git gelangen. Die bestehende Demo liest keine `.env`-Dateien.

## Tests ohne Supabase-Konto

Voraussetzung: Node.js 22 oder neuer.

```sh
npm ci
npm test
npm run check
```

Die Tests starten eine flüchtige PostgreSQL-Engine mit PGlite, spielen die echte Migration ein und wechseln zwischen zwei Vermietern, einer anonymen Anfrage und der Serverrolle. Es werden nur künstliche Testdaten verwendet. Rollen und `auth.uid()` werden für die Tests minimal nachgebildet. Auch großzügige Tabellen-Standardrechte werden vorab simuliert, um deren Rücknahme zu prüfen.

Damit prüfen wir SQL, RLS, Spaltenrechte, Validierung und Löschbeziehungen. Das ersetzt keinen Integrationstest mit echtem Supabase Auth, JWTs, PostgREST und Browser-Sitzungen. Insbesondere werden Registrierung, E-Mail-Bestätigung, Passwortzurücksetzung und der öffentliche Bewerbungsendpunkt hier nicht getestet.

## Späteres Supabase-Projekt einrichten

1. Ein neues Entwicklungsprojekt im eigenen Supabase-Konto mit einer europäischen Region anlegen.
2. In diesem leeren Projekt die Datei `supabase/migrations/20261122000100_initial_schema.sql` im SQL Editor ausführen. Die Migration wird einmal ausgeführt und setzt die vorhandenen Supabase-Rollen sowie `auth.users` und `auth.uid()` voraus.
3. Registrierung, E-Mail-Bestätigung, erlaubte Weiterleitungsadressen und Passwortzurücksetzung konfigurieren. Anonyme Auth-Anmeldungen zunächst deaktiviert lassen.
4. Zwei Testkonten anlegen und die Zugriffsgrenzen zusätzlich über die Supabase-API prüfen.
5. Erst danach Anmeldung, Dashboard und den geschützten öffentlichen Bewerbungsendpunkt anbinden.

Die Datei ist für ein frisches Projekt gedacht. Nicht ungeprüft auf eine bestehende Datenbank anwenden. Weitere Änderungen werden als zusätzliche Migrationen gespeichert; die bereits angewendete Datei wird nicht nachträglich verändert.

## Offene Entscheidungen

- Welche Bewerbungsfelder werden tatsächlich benötigt und welche sind freiwillig?
- Welche Wohnungsdaten dürfen öffentlich angezeigt werden?
- Wann beginnt die Aufbewahrungsfrist, wie lang ist sie und wie läuft die Löschung ab?
- Welche rechtlichen Hinweise werden für den realen Einsatz benötigt?
- Wie werden Link-Erneuerung, Spam-Schutz und E-Mail-Zustellung umgesetzt?

Referenzen: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Spaltenrechte](https://supabase.com/docs/guides/database/postgres/column-level-security), [Supabase-Zugriffstests](https://supabase.com/docs/guides/database/postgres/testing-row-level-security).
