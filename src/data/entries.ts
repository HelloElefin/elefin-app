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
import type { Kategorie } from '@/domain';

import type { Store, Entry, NewEntry } from './store';
import { lokaleAblage } from './local-store';
import { hatKonto } from './session';

/**
 * Wählt die passende Ablage.
 *
 * Noch immer die lokale — die Serverablage gibt es erst, wenn der Kontoteil
 * gebaut ist. Die Weiche steht aber schon, damit der Wechsel später eine
 * Zeile ist.
 */
async function ablage(): Promise<Store> {
  if (await hatKonto()) {
    // TODO: serverAblage zurückgeben, sobald ablage-server.ts existiert.
    return lokaleAblage;
  }
  return lokaleAblage;
}

/** Legt einen Eintrag an und gibt seine Kennung zurück. */
export async function eintragAnlegen(eintrag: NewEntry): Promise<string> {
  return (await ablage()).eintragAnlegen(eintrag);
}

/** Lädt alle Einträge einer Kategorie, entschlüsselt und geprüft. */
export async function eintraegeLaden<T extends { schemaVersion: number }>(
  kategorie: Kategorie,
  muster: Validator<T>,
): Promise<Entry<T>[]> {
  return (await ablage()).eintraegeLaden(kategorie, muster);
}

/** Lädt einen einzelnen Eintrag. Wirft E-DB05, wenn es ihn nicht gibt. */
export async function eintragLaden<T extends { schemaVersion: number }>(
  id: string,
  muster: Validator<T>,
): Promise<Entry<T>> {
  return (await ablage()).eintragLaden(id, muster);
}

/** Ersetzt den Inhalt eines Eintrags. */
export async function eintragAendern(
  id: string,
  inhalt: Record<string, unknown>,
): Promise<void> {
  return (await ablage()).eintragAendern(id, inhalt);
}

/** Löscht einen Eintrag. */
export async function eintragLoeschen(id: string): Promise<void> {
  return (await ablage()).eintragLoeschen(id);
}

/** Zählt Einträge je Kategorie, ohne zu entschlüsseln. Für das Dashboard. */
export async function anzahlJeKategorie(): Promise<Partial<Record<Kategorie, number>>> {
  return (await ablage()).anzahlJeKategorie();
}