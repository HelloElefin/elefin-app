/**
 * Ablage im lokalen Modus: expo-sqlite auf dem Gerät.
 *
 * Wird benutzt, solange kein Konto besteht. Die App ist damit von der ersten
 * Sekunde an voll nutzbar — ohne Anmeldung, ohne Server, ohne dass
 * personenbezogene Daten irgendwohin gelangen.
 *
 * Die Tabellenstruktur bildet die Servertabellen nach, so weit es lokal
 * sinnvoll ist. Grund: Der spätere Umzug ins Konto wird damit ein
 * Kopiervorgang. Die Inhalte bleiben unverändert verschlüsselt, nur die
 * Verpackungen der Datenschlüssel werden neu gemacht.
 *
 * Zweistufig auch hier: Jeder Eintrag hat einen eigenen Datenschlüssel, der
 * mit dem Geräteschlüssel verpackt wird. Lokal streng genommen unnötig — aber
 * beim Umzug ist das der Unterschied zwischen Sekunden und Minuten.
 */
import * as SQLite from 'expo-sqlite';

import {
  datenschluesselErzeugen,
  generalschluesselAuspacken,
  generalschluesselVerpacken,
  inhaltEntschluesseln,
  inhaltVerschluesseln,
  zufallsBytes,
  type VerpackterSchluessel,
} from '@/crypto';
import { istKategorie, type Kategorie } from '@/domain';

import type { Ablage, Eintrag, MusterFuer, NeuerEintrag } from './ablage';
import { DatenFehler, DatenFehlerCode } from './fehler';
import { verpackungsSchluesselHolen } from './sitzung';

const DATENBANK = 'elefin.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Öffnet die Datenbank und legt beim ersten Aufruf die Tabellen an.
 *
 * Die Struktur entspricht 0001_tabellen.sql, reduziert auf das lokal
 * Sinnvolle: keine Freigaben, keine Verbindungen, kein Ernstfall — die
 * setzen alle ein Konto voraus.
 */
async function datenbank(): Promise<SQLite.SQLiteDatabase> {
  if (db !== null) return db;

  db = await SQLite.openDatabaseAsync(DATENBANK);

  await db.execAsync(`
    pragma journal_mode = WAL;

    create table if not exists entries (
      id text primary key not null,
      kategorie text not null,
      inhalt_chiffre text not null,
      inhalt_nonce text not null,
      -- Der Datenschlüssel dieses Eintrags, verpackt mit dem Geräteschlüssel.
      -- Auf dem Server steht an dieser Stelle ein Umschlag in entry_grants.
      schluessel_chiffre text not null,
      schluessel_nonce text not null,
      angelegt_am text not null,
      geaendert_am text not null
    );

    create index if not exists entries_kategorie_idx
      on entries (kategorie);
  `);

  return db;
}

/** Erzeugt eine zufällige ID im selben Format wie der Server. */
function idErzeugen(): string {
  const b = zufallsBytes(16);
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** Eine Zeile aus der Tabelle entries, so wie SQLite sie liefert. */
type Zeile = {
  id: string;
  kategorie: string;
  inhalt_chiffre: string;
  inhalt_nonce: string;
  schluessel_chiffre: string;
  schluessel_nonce: string;
  angelegt_am: string;
  geaendert_am: string;
};

/** Packt den Datenschlüssel einer Zeile aus. */
async function datenschluesselVon(zeile: Zeile): Promise<Uint8Array> {
  const verpackung: VerpackterSchluessel = {
    chiffre: zeile.schluessel_chiffre,
    nonce: zeile.schluessel_nonce,
  };
  return generalschluesselAuspacken(
    verpackung,
    await verpackungsSchluesselHolen(),
  );
}

/** Wandelt eine Zeile in einen entschlüsselten Eintrag. */
async function zeileEntschluesseln<T extends { schemaVersion: number }>(
  zeile: Zeile,
  muster: MusterFuer<T>,
): Promise<Eintrag<T>> {
  const datenschluessel = await datenschluesselVon(zeile);

  const inhalt = inhaltEntschluesseln(
    datenschluessel,
    zeile.id,
    { chiffre: zeile.inhalt_chiffre, nonce: zeile.inhalt_nonce },
    muster,
  );

  if (!istKategorie(zeile.kategorie)) {
    throw new DatenFehler(
      DatenFehlerCode.UNBEKANNT,
      'Datensatz trägt eine Kategorie, die diese App-Fassung nicht kennt.',
    );
  }

  return {
    id: zeile.id,
    kategorie: zeile.kategorie,
    inhalt,
    angelegtAm: zeile.angelegt_am,
    geaendertAm: zeile.geaendert_am,
  };
}

export const lokaleAblage: Ablage = {
  async eintragAnlegen(eintrag: NeuerEintrag): Promise<string> {
    const datenbankVerbindung = await datenbank();
    const id = idErzeugen();
    const jetzt = new Date().toISOString();

    // Eigener Datenschlüssel je Eintrag — dieselbe Zweistufigkeit wie auf
    // dem Server, damit der Umzug später ein Kopiervorgang bleibt.
    const datenschluessel = datenschluesselErzeugen();
    const inhalt = inhaltVerschluesseln(datenschluessel, id, eintrag.inhalt);
    const verpackt = generalschluesselVerpacken(
      datenschluessel,
      await verpackungsSchluesselHolen(),
    );

    await datenbankVerbindung.runAsync(
      `insert into entries
         (id, kategorie, inhalt_chiffre, inhalt_nonce,
          schluessel_chiffre, schluessel_nonce, angelegt_am, geaendert_am)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        eintrag.kategorie,
        inhalt.chiffre,
        inhalt.nonce,
        verpackt.chiffre,
        verpackt.nonce,
        jetzt,
        jetzt,
      ],
    );

    return id;
  },

  async eintraegeLaden<T extends { schemaVersion: number }>(
    kategorie: Kategorie,
    muster: MusterFuer<T>,
  ): Promise<Eintrag<T>[]> {
    const datenbankVerbindung = await datenbank();
    const zeilen = await datenbankVerbindung.getAllAsync<Zeile>(
      `select * from entries
       where kategorie = ?
       order by angelegt_am desc`,
      [kategorie],
    );

    const ergebnis: Eintrag<T>[] = [];
    for (const zeile of zeilen) {
      ergebnis.push(await zeileEntschluesseln(zeile, muster));
    }
    return ergebnis;
  },

  async eintragLaden<T extends { schemaVersion: number }>(
    id: string,
    muster: MusterFuer<T>,
  ): Promise<Eintrag<T>> {
    const datenbankVerbindung = await datenbank();
    const zeile = await datenbankVerbindung.getFirstAsync<Zeile>(
      'select * from entries where id = ?',
      [id],
    );

    if (zeile === null) {
      throw new DatenFehler(
        DatenFehlerCode.NICHT_GEFUNDEN,
        'Kein Eintrag mit dieser Kennung.',
      );
    }

    return zeileEntschluesseln(zeile, muster);
  },

  async eintragAendern(
    id: string,
    inhalt: Record<string, unknown>,
  ): Promise<void> {
    const datenbankVerbindung = await datenbank();
    const zeile = await datenbankVerbindung.getFirstAsync<Zeile>(
      'select * from entries where id = ?',
      [id],
    );

    if (zeile === null) {
      throw new DatenFehler(
        DatenFehlerCode.NICHT_GEFUNDEN,
        'Kein Eintrag mit dieser Kennung.',
      );
    }

    // Der Datenschlüssel bleibt derselbe — nur der Inhalt wird neu
    // verschlüsselt. Sonst müssten später alle Umschläge erneuert werden.
    const datenschluessel = await datenschluesselVon(zeile);
    const neu = inhaltVerschluesseln(datenschluessel, id, inhalt);

    await datenbankVerbindung.runAsync(
      `update entries
         set inhalt_chiffre = ?, inhalt_nonce = ?, geaendert_am = ?
       where id = ?`,
      [neu.chiffre, neu.nonce, new Date().toISOString(), id],
    );
  },

  async eintragLoeschen(id: string): Promise<void> {
    const datenbankVerbindung = await datenbank();
    await datenbankVerbindung.runAsync('delete from entries where id = ?', [id]);
  },

  async anzahlJeKategorie(): Promise<Partial<Record<Kategorie, number>>> {
    const datenbankVerbindung = await datenbank();
    const zeilen = await datenbankVerbindung.getAllAsync<{
      kategorie: string;
      anzahl: number;
    }>('select kategorie, count(*) as anzahl from entries group by kategorie');

    const ergebnis: Partial<Record<Kategorie, number>> = {};
    for (const zeile of zeilen) {
      // Kategorien, die diese App-Fassung nicht kennt, werden übergangen —
      // eine Zählung ist kein Ort für einen Abbruch.
      if (istKategorie(zeile.kategorie)) {
        ergebnis[zeile.kategorie] = zeile.anzahl;
      }
    }
    return ergebnis;
  },
};

/**
 * Löscht die gesamte lokale Datenbank.
 *
 * Für "Alle Daten löschen" und für den Abschluss des Umzugs ins Konto —
 * dort erst, NACHDEM der Server den Empfang bestätigt hat.
 */
export async function lokaleDatenLoeschen(): Promise<void> {
  const datenbankVerbindung = await datenbank();
  await datenbankVerbindung.execAsync('delete from entries;');
}

/**
 * Gibt alle Zeilen im Rohzustand heraus, ohne zu entschlüsseln.
 *
 * Nur für den Umzug ins Konto. Die Inhalte bleiben verschlüsselt wie sie
 * sind; neu verpackt wird ausschließlich der Datenschlüssel.
 */
export async function alleZeilenRoh(): Promise<Zeile[]> {
  const datenbankVerbindung = await datenbank();
  return datenbankVerbindung.getAllAsync<Zeile>('select * from entries');
}