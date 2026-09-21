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
  generateDataKey,
  unwrapMasterKey,
  wrapMasterKey,
  decryptContent,
  encryptContent,
  secureRandomBytes,
  type WrappedKey,
} from '@/crypto';
import { isCategory, type Category } from '@/domain';

import type { Store, Entry, ValidatorFor, NewEntry } from './store';
import { DataError, DataErrorCode } from './errors';
import { getWrappingKey } from './session';

const DATABASE_NAME = 'elefin.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Öffnet die Datenbank und legt beim ersten Aufruf die Tabellen an.
 *
 * Die Struktur entspricht 0001_tabellen.sql, reduziert auf das lokal
 * Sinnvolle: keine Freigaben, keine Verbindungen, kein Ernstfall — die
 * setzen alle ein Konto voraus.
 */
async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db !== null) return db;

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);

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
function generateId(): string {
  const b = secureRandomBytes(16);
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
type Row = {
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
async function dataKeyOf(row: Row): Promise<Uint8Array> {
  const wrapping: WrappedKey = {
    chiffre: row.schluessel_chiffre,
    nonce: row.schluessel_nonce,
  };
  return unwrapMasterKey(
    wrapping,
    await getWrappingKey(),
  );
}

/** Wandelt eine Zeile in einen entschlüsselten Eintrag. */
async function decryptRow<T extends { schemaVersion: number }>(
  row: Row,
  validator: ValidatorFor<T>,
): Promise<Entry<T>> {
  const dataKey = await dataKeyOf(row);

  const content = decryptContent(
    dataKey,
    row.id,
    { chiffre: row.inhalt_chiffre, nonce: row.inhalt_nonce },
    validator,
  );

  if (!isCategory(row.kategorie)) {
    throw new DataError(
      DataErrorCode.UNKNOWN,
      'Datensatz trägt eine Kategorie, die diese App-Fassung nicht kennt.',
    );
  }

  return {
    id: row.id,
    category: row.kategorie,
    content: content,
    createdAt: row.angelegt_am,
    updatedAt: row.geaendert_am,
  };
}

export const localStore: Store = {
  async createEntry(entry: NewEntry): Promise<string> {
    const dbConnection = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    // Eigener Datenschlüssel je Eintrag — dieselbe Zweistufigkeit wie auf
    // dem Server, damit der Umzug später ein Kopiervorgang bleibt.
    const dataKey = generateDataKey();
    const content = encryptContent(dataKey, id, entry.content);
    const wrapped = wrapMasterKey(
      dataKey,
      await getWrappingKey(),
    );

    await dbConnection.runAsync(
      `insert into entries
         (id, kategorie, inhalt_chiffre, inhalt_nonce,
          schluessel_chiffre, schluessel_nonce, angelegt_am, geaendert_am)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entry.category,
        content.chiffre,
        content.nonce,
        wrapped.chiffre,
        wrapped.nonce,
        now,
        now,
      ],
    );

    return id;
  },

  async loadEntries<T extends { schemaVersion: number }>(
    category: Category,
    validator: ValidatorFor<T>,
  ): Promise<Entry<T>[]> {
    const dbConnection = await getDatabase();
    const rows = await dbConnection.getAllAsync<Row>(
      `select * from entries
       where kategorie = ?
       order by angelegt_am desc`,
      [category],
    );

    const result: Entry<T>[] = [];
    for (const row of rows) {
      result.push(await decryptRow(row, validator));
    }
    return result;
  },

  async loadEntry<T extends { schemaVersion: number }>(
    id: string,
    validator: ValidatorFor<T>,
  ): Promise<Entry<T>> {
    const dbConnection = await getDatabase();
    const row = await dbConnection.getFirstAsync<Row>(
      'select * from entries where id = ?',
      [id],
    );

    if (row === null) {
      throw new DataError(
        DataErrorCode.NOT_FOUND,
        'Kein Eintrag mit dieser Kennung.',
      );
    }

    return decryptRow(row, validator);
  },

  async updateEntry(
    id: string,
    content: Record<string, unknown>,
  ): Promise<void> {
    const dbConnection = await getDatabase();
    const row = await dbConnection.getFirstAsync<Row>(
      'select * from entries where id = ?',
      [id],
    );

    if (row === null) {
      throw new DataError(
        DataErrorCode.NOT_FOUND,
        'Kein Eintrag mit dieser Kennung.',
      );
    }

    // Der Datenschlüssel bleibt derselbe — nur der Inhalt wird neu
    // verschlüsselt. Sonst müssten später alle Umschläge erneuert werden.
    const dataKey = await dataKeyOf(row);
    const created = encryptContent(dataKey, id, content);

    await dbConnection.runAsync(
      `update entries
         set inhalt_chiffre = ?, inhalt_nonce = ?, geaendert_am = ?
       where id = ?`,
      [created.chiffre, created.nonce, new Date().toISOString(), id],
    );
  },

  async deleteEntry(id: string): Promise<void> {
    const dbConnection = await getDatabase();
    await dbConnection.runAsync('delete from entries where id = ?', [id]);
  },

  async countByCategory(): Promise<Partial<Record<Category, number>>> {
    const dbConnection = await getDatabase();
    const rows = await dbConnection.getAllAsync<{
      kategorie: string;
      anzahl: number;
    }>('select kategorie, count(*) as anzahl from entries group by kategorie');

    const result: Partial<Record<Category, number>> = {};
    for (const row of rows) {
      // Kategorien, die diese App-Fassung nicht kennt, werden übergangen —
      // eine Zählung ist kein Ort für einen Abbruch.
      if (isCategory(row.kategorie)) {
        result[row.kategorie] = row.anzahl;
      }
    }
    return result;
  },
};

/**
 * Löscht die gesamte lokale Datenbank.
 *
 * Für "Alle Daten löschen" und für den Abschluss des Umzugs ins Konto —
 * dort erst, NACHDEM der Server den Empfang bestätigt hat.
 */
export async function deleteLocalData(): Promise<void> {
  const dbConnection = await getDatabase();
  await dbConnection.execAsync('delete from entries;');
}

/**
 * Gibt alle Zeilen im Rohzustand heraus, ohne zu entschlüsseln.
 *
 * Nur für den Umzug ins Konto. Die Inhalte bleiben verschlüsselt wie sie
 * sind; neu verpackt wird ausschließlich der Datenschlüssel.
 */
export async function getAllRawRows(): Promise<Row[]> {
  const dbConnection = await getDatabase();
  return dbConnection.getAllAsync<Row>('select * from entries');
}