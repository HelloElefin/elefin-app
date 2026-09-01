-- ============================================================================
-- 0002 — Row Level Security
--
-- Die zweite Verteidigungslinie hinter der Verschlüsselung. Selbst wenn
-- jemand mit dem anon key direkt gegen die Datenbank arbeitet, bekommt er
-- nur Zeilen, die ihm zustehen.
--
-- Grundsatz: Erst alles verbieten, dann einzeln erlauben. Jede Regel hat
-- einen sprechenden Namen und macht genau eine Sache — großzügige
-- Sammelregeln sind der häufigste Fehler an dieser Stelle.
--
-- Zur Erinnerung: RLS schützt vor unberechtigtem ZUGRIFF, nicht vor
-- Lesbarkeit. Selbst wer eine Zeile bekäme, hielte Chiffrat in der Hand.
-- ============================================================================

alter table public.profile enable row level security;
alter table public.key_wrappings enable row level security;
alter table public.entries enable row level security;
alter table public.entry_grants enable row level security;
alter table public.connections enable row level security;
alter table public.emergency_vault enable row level security;

-- ----------------------------------------------------------------------------
-- profile
--
-- Besonderheit: Der öffentliche Schlüssel anderer Nutzer muss lesbar sein,
-- sonst kann niemand einen Umschlag für sie packen. Deshalb zwei getrennte
-- Regeln — die eigene Zeile ganz, fremde Zeilen nur über eine Ansicht, die
-- ausschließlich id und public_key enthält.
-- ----------------------------------------------------------------------------

create policy "profil_eigenes_lesen"
  on public.profile for select
  using (id = (select auth.uid()));

create policy "profil_eigenes_anlegen"
  on public.profile for insert
  with check (id = (select auth.uid()));

create policy "profil_eigenes_aendern"
  on public.profile for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Ansicht für die öffentlichen Schlüssel anderer.
-- Nur wer mit jemandem verbunden ist, sieht dessen Schlüssel — nicht jeder
-- jeden. Damit gibt es kein Verzeichnis aller Nutzerkonten.
create view public.verbundene_schluessel
with (security_invoker = true)
as
  select p.id, p.public_key
  from public.profile p
  where p.id in (
    select c.connected_id from public.connections c
    where c.owner_id = (select auth.uid())
      and c.connected_id is not null
    union
    select c.owner_id from public.connections c
    where c.connected_id = (select auth.uid())
  );

comment on view public.verbundene_schluessel is
  'Öffentliche Schlüssel verbundener Personen. Kein Verzeichnis aller Nutzer.';

-- ----------------------------------------------------------------------------
-- key_wrappings
--
-- Streng: ausschließlich die eigenen Zeilen. Niemand hat je einen Grund,
-- die Verpackungen eines anderen zu sehen.
-- ----------------------------------------------------------------------------

create policy "kisten_eigene_lesen"
  on public.key_wrappings for select
  using (user_id = (select auth.uid()));

create policy "kisten_eigene_anlegen"
  on public.key_wrappings for insert
  with check (user_id = (select auth.uid()));

create policy "kisten_eigene_aendern"
  on public.key_wrappings for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "kisten_eigene_loeschen"
  on public.key_wrappings for delete
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- entries
--
-- Lesen darf, wer einen Umschlag für den Eintrag besitzt. Der Besitzer hat
-- immer einen — deshalb braucht es hier keine Sonderregel für ihn.
--
-- Schreiben darf nur der Besitzer. Freigegebene Personen haben Lesezugriff,
-- niemals Schreibzugriff.
-- ----------------------------------------------------------------------------

create policy "eintraege_lesen_wenn_freigegeben"
  on public.entries for select
  using (
    exists (
      select 1 from public.entry_grants g
      where g.entry_id = entries.id
        and g.grantee_id = (select auth.uid())
    )
  );

create policy "eintraege_eigene_anlegen"
  on public.entries for insert
  with check (owner_id = (select auth.uid()));

create policy "eintraege_eigene_aendern"
  on public.entries for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "eintraege_eigene_loeschen"
  on public.entries for delete
  using (owner_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- entry_grants
--
-- Die heikelste Tabelle. Hier entscheidet sich, wer was sehen kann.
--
-- Lesen: die eigene Zeile, plus der Besitzer des Eintrags — er muss sehen
-- können, für wen er freigegeben hat.
--
-- Anlegen und Löschen: NUR der Besitzer des Eintrags. Niemand darf sich
-- selbst eine Freigabe ausstellen.
--
-- Ändern: gar nicht. Eine Freigabe wird gelöscht und neu angelegt, nie
-- verändert — das hält den Weg zum Entzug eindeutig.
-- ----------------------------------------------------------------------------

create policy "umschlaege_eigene_lesen"
  on public.entry_grants for select
  using (grantee_id = (select auth.uid()));

create policy "umschlaege_als_besitzer_lesen"
  on public.entry_grants for select
  using (
    exists (
      select 1 from public.entries e
      where e.id = entry_grants.entry_id
        and e.owner_id = (select auth.uid())
    )
  );

create policy "umschlaege_als_besitzer_anlegen"
  on public.entry_grants for insert
  with check (
    exists (
      select 1 from public.entries e
      where e.id = entry_grants.entry_id
        and e.owner_id = (select auth.uid())
    )
  );

create policy "umschlaege_als_besitzer_loeschen"
  on public.entry_grants for delete
  using (
    exists (
      select 1 from public.entries e
      where e.id = entry_grants.entry_id
        and e.owner_id = (select auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- connections
--
-- Beide Seiten dürfen die Verbindung sehen. Verwalten darf nur, wer sie
-- angelegt hat — die andere Seite kann sich nicht selbst hochstufen.
-- ----------------------------------------------------------------------------

create policy "verbindungen_lesen"
  on public.connections for select
  using (
    owner_id = (select auth.uid())
    or connected_id = (select auth.uid())
  );

create policy "verbindungen_eigene_anlegen"
  on public.connections for insert
  with check (owner_id = (select auth.uid()));

create policy "verbindungen_eigene_aendern"
  on public.connections for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "verbindungen_eigene_loeschen"
  on public.connections for delete
  using (owner_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- emergency_vault
--
-- Der Nutzer verwaltet seine eigene Kiste.
--
-- Die benannte Person darf sie NICHT lesen, solange sie verschlossen ist.
-- Erst wenn freigegeben_at gesetzt wurde — nach geprüfter Sterbeurkunde —
-- kommt sie heran. Genau das ist der Grund, warum eine Trennung zwischen
-- Server-Anteil und Personen-Anteil überhaupt Sinn ergibt.
--
-- Gesetzt wird freigegeben_at ausschließlich serverseitig mit dem
-- service_role-Schlüssel, der RLS umgeht. Aus der App heraus ist das
-- unmöglich — es gibt keine Update-Regel, die es erlaubt.
-- ----------------------------------------------------------------------------

create policy "kiste_eigene_lesen"
  on public.emergency_vault for select
  using (user_id = (select auth.uid()));

create policy "kiste_als_beguenstigter_lesen_wenn_freigegeben"
  on public.emergency_vault for select
  using (
    beneficiary_id = (select auth.uid())
    and freigegeben_at is not null
  );

create policy "kiste_eigene_anlegen"
  on public.emergency_vault for insert
  with check (user_id = (select auth.uid()));

create policy "kiste_eigene_loeschen"
  on public.emergency_vault for delete
  using (user_id = (select auth.uid()));

-- Bewusst KEINE Update-Regel für emergency_vault.
-- Ändern heißt: löschen und neu anlegen. So kann niemand aus der App heraus
-- freigegeben_at setzen — auch nicht der Kontoinhaber selbst.