-- ============================================================================
-- 0001 — Tabellen
--
-- Grundsatz: Der Server sieht nur Chiffrat. Im Klartext steht hier nur, was
-- die Datenbank zum Sortieren, Zählen und Prüfen der Zugriffsrechte braucht.
--
-- Was NIE im Klartext gespeichert wird: Inhalte, Titel, Namen von Einträgen,
-- private Schlüssel, Passwörter.
--
-- Diese Datei legt nur Strukturen an. Die Zugriffsregeln stehen in 0002 —
-- getrennt, weil sie die eigentliche Sicherheitsschicht sind und für sich
-- lesbar bleiben sollen.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profile — ein Eintrag je Nutzer
--
-- Hängt an auth.users, der Tabelle von Supabase Auth. Das Passwort selbst
-- liegt dort, nicht hier — und dort auch nur als Hash. Der Generalschlüssel
-- kommt in keiner der beiden Tabellen vor.
-- ----------------------------------------------------------------------------
create table public.profile (
  id uuid primary key references auth.users (id) on delete cascade,

  -- X25519-Schlüsselpaar dieses Nutzers.
  -- Der öffentliche Teil ist Klartext: Andere brauchen ihn, um für diese
  -- Person Umschläge zu packen. Der private Teil nur als Chiffrat,
  -- geschützt durch den Generalschlüssel.
  public_key text not null,
  private_key_chiffre text not null,
  private_key_nonce text not null,

  -- Parameter der Schlüsselableitung aus dem Passwort.
  -- Pro Nutzer gespeichert, damit die Kosten später erhöht werden können,
  -- ohne bestehende Konten auszusperren.
  kdf_salt text not null,
  kdf_n integer not null,
  kdf_r integer not null,
  kdf_p integer not null,

  -- Markt, nicht Sprache. Bestimmt, welche Rechtsinhalte gelten.
  markt text not null check (markt in ('at', 'de')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profile is
  'Ein Eintrag je Nutzer. Enthält niemals den Generalschlüssel im Klartext.';

-- ----------------------------------------------------------------------------
-- key_wrappings — die Kisten
--
-- Derselbe Generalschlüssel, mehrfach verpackt. Eine Zeile je Weg hinein.
-- Eigene Tabelle statt Spalten in profile, weil die Anzahl variabel ist:
-- mehrere Geräte, später vielleicht weitere Wege.
--
-- Ein Passwortwechsel ersetzt genau eine Zeile hier. Sonst ändert sich nichts.
-- ----------------------------------------------------------------------------
create table public.key_wrappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profile (id) on delete cascade,

  -- Welcher Weg: 'password', 'recovery_key' oder 'device'.
  art text not null check (art in ('password', 'recovery_key', 'device')),

  -- Der verpackte Generalschlüssel.
  chiffre text not null,
  nonce text not null,

  -- Nur bei art = 'device': zur Unterscheidung mehrerer Geräte.
  -- Bewusst kein Gerätename, der auf eine Person schließen ließe.
  device_label text,

  created_at timestamptz not null default now(),
  last_used_at timestamptz,

  -- Passwort und Sicherheitsschlüssel gibt es je einmal, Geräte mehrfach.
  constraint eindeutig_je_art
    exclude (user_id with =, art with =)
    where (art in ('password', 'recovery_key'))
);

comment on table public.key_wrappings is
  'Verpackungen des Generalschlüssels. Alle führen zum selben Schlüssel.';

-- ----------------------------------------------------------------------------
-- entries — die Einträge
--
-- Die Kategorie bleibt im Klartext, damit die App zählen und sortieren kann,
-- ohne alles zu entschlüsseln. Das ist eine bewusste Abwägung: Der Server
-- erfährt dadurch, DASS jemand drei Bankverbindungen hat, aber nicht welche.
-- ----------------------------------------------------------------------------
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profile (id) on delete cascade,

  -- Technische Kategorie-ID aus src/domain/kategorien.ts.
  -- Bewusst ohne Fremdschlüssel auf eine Kategorientabelle: Kategorien sind
  -- Programmbestandteil, kein Inhalt.
  kategorie text not null,

  -- Der verschlüsselte Inhalt. Enthält im Klartext-Inneren ein Feld
  -- schemaVersion; die Eintrags-ID ist mitsigniert, damit das Chiffrat
  -- nicht in eine andere Zeile verschoben werden kann.
  inhalt_chiffre text not null,
  inhalt_nonce text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_owner_kategorie_idx
  on public.entries (owner_id, kategorie);

comment on table public.entries is
  'Einträge. Inhalt ausschließlich als Chiffrat, Kategorie im Klartext.';

-- ----------------------------------------------------------------------------
-- entry_grants — die Umschläge
--
-- Pro Eintrag und berechtigter Person eine Zeile mit dem verpackten
-- Datenschlüssel. Auch der Besitzer hat für seinen eigenen Eintrag eine
-- Zeile — dann ist der Lesepfad einheitlich, ohne Sonderfall.
--
-- Ein Entzug löscht Zeilen hier. Nur im Frontend auszublenden genügt nicht:
-- Wer den Datenschlüssel schon geladen hat, braucht die App nicht mehr.
-- ----------------------------------------------------------------------------
create table public.entry_grants (
  entry_id uuid not null references public.entries (id) on delete cascade,
  grantee_id uuid not null references public.profile (id) on delete cascade,

  -- Der Datenschlüssel dieses Eintrags, verpackt für diese Person.
  umschlag text not null,

  created_at timestamptz not null default now(),

  primary key (entry_id, grantee_id)
);

create index entry_grants_grantee_idx
  on public.entry_grants (grantee_id);

comment on table public.entry_grants is
  'Verpackte Datenschlüssel je Eintrag und Person. Entzug = Zeile löschen.';

-- ----------------------------------------------------------------------------
-- connections — Verbindungen zwischen Menschen
--
-- Hier steht, wer mit wem verknüpft ist und mit welcher Stufe. Der
-- Zwischenzustand 'eingeladen' deckt den Fall ab, dass jemand eingeladen
-- wurde, aber noch kein Konto hat: Dann kann noch kein Umschlag entstehen,
-- weil sein öffentlicher Schlüssel fehlt.
-- ----------------------------------------------------------------------------
create table public.connections (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null references public.profile (id) on delete cascade,

  -- Null, solange die eingeladene Person noch kein Konto hat.
  connected_id uuid references public.profile (id) on delete cascade,

  -- Für die Einladung, bis das Konto existiert.
  einladung_email text,

  -- 'voll' = sieht alles, auch künftige Einträge.
  -- 'abgestuft' = sieht nur, was einzeln freigegeben wurde.
  stufe text not null check (stufe in ('voll', 'abgestuft')),

  status text not null
    check (status in ('eingeladen', 'aktiv', 'entzogen')),

  -- Vom Nutzer vergebene Bezeichnung, verschlüsselt: "Anna", "meine
  -- Schwester". Der Server erfährt keine Namen.
  bezeichnung_chiffre text,
  bezeichnung_nonce text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint eindeutige_verbindung unique (owner_id, connected_id)
);

create index connections_connected_idx
  on public.connections (connected_id);

comment on table public.connections is
  'Wer ist mit wem verknüpft und mit welcher Stufe.';

-- ----------------------------------------------------------------------------
-- emergency_vault — die doppelt verschlossene Kiste
--
-- Enthält den Generalschlüssel, zweifach verpackt: erst für die benannte
-- Person, das Ergebnis noch einmal für den Server. Getrennt ist beides
-- wertlos. Der Anbieter allein kann nicht öffnen, die benannte Person
-- allein kommt nicht an die Kiste heran.
--
-- Freigabe nur nach geprüfter Sterbeurkunde, ohne Wartefrist.
-- ----------------------------------------------------------------------------
create table public.emergency_vault (
  user_id uuid primary key references public.profile (id) on delete cascade,

  -- Wer im Ernstfall Zugriff bekommen soll.
  beneficiary_id uuid not null references public.profile (id) on delete restrict,

  -- Doppelt verpackter Generalschlüssel.
  kiste text not null,

  -- Die Einwilligung zu Lebzeiten. Ohne sie darf nichts freigegeben werden.
  einwilligung_at timestamptz not null,
  einwilligung_version text not null,

  -- Wird gesetzt, wenn die Sterbeurkunde geprüft und die Kiste freigegeben
  -- wurde. Solange null, ist die Kiste verschlossen.
  freigegeben_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.emergency_vault is
  'Doppelt verschlossene Kiste für den Ernstfall. Anbieter allein kann nicht öffnen.';

-- ----------------------------------------------------------------------------
-- updated_at automatisch pflegen
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profile_updated_at
  before update on public.profile
  for each row execute function public.set_updated_at();

create trigger entries_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

create trigger connections_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

create trigger emergency_vault_updated_at
  before update on public.emergency_vault
  for each row execute function public.set_updated_at();