/**
 * Die Fassade der Datenschicht.
 *
 * Das hier rufen Hooks und Screens auf. Sie erfahren nicht, ob die Daten
 * lokal in SQLite oder in Supabase liegen — und sollen es auch nicht.
 *
 * Solange kein Konto besteht, geht alles an die lokale Ablage. Sobald
 * ablage-server.ts existiert, entscheidet diese Datei anhand des
 * Sitzungszustands, welche Ablage benutzt wird. Kein Screen muss dafür
 * angefasst werden.
 */
import type { Validator } from '@/crypto';
import type { Category } from '@/domain';

import type { Store, Entry, NewEntry } from './store';
import { localStore } from './local-store';
import { hasAccount } from './session';

/**
 * Wählt die passende Ablage.
 *
 * Noch immer die lokale — die Serverablage gibt es erst, wenn der Kontoteil
 * gebaut ist. Die Weiche steht aber schon, damit der Wechsel später eine
 * Zeile ist.
 */
async function getStore(): Promise<Store> {
  if (await hasAccount()) {
    // TODO: serverAblage zurückgeben, sobald ablage-server.ts existiert.
    return localStore;
  }
  return localStore;
}

/** Legt einen Eintrag an und gibt seine Kennung zurück. */
export async function createEntry(entry: NewEntry): Promise<string> {
  return (await getStore()).createEntry(entry);
}

/** Lädt alle Einträge einer Kategorie, entschlüsselt und geprüft. */
export async function loadEntries<T extends { schemaVersion: number }>(
  category: Category,
  validator: Validator<T>,
): Promise<Entry<T>[]> {
  return (await getStore()).loadEntries(category, validator);
}

/** Lädt einen einzelnen Eintrag. Wirft E-DB05, wenn es ihn nicht gibt. */
export async function loadEntry<T extends { schemaVersion: number }>(
  id: string,
  validator: Validator<T>,
): Promise<Entry<T>> {
  return (await getStore()).loadEntry(id, validator);
}

/** Ersetzt den Inhalt eines Eintrags. */
export async function updateEntry(
  id: string,
  content: Record<string, unknown>,
): Promise<void> {
  return (await getStore()).updateEntry(id, content);
}

/** Löscht einen Eintrag. */
export async function deleteEntry(id: string): Promise<void> {
  return (await getStore()).deleteEntry(id);
}

/** Zählt Einträge je Kategorie, ohne zu entschlüsseln. Für das Dashboard. */
export async function countByCategory(): Promise<Partial<Record<Category, number>>> {
  return (await getStore()).countByCategory();
}