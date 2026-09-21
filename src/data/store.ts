/**
 * Die Schnittstelle zur Ablage.
 *
 * Hier steht, WAS eine Ablage können muss — nicht wie. Es gibt zwei
 * Umsetzungen:
 *
 *   local-store.ts    expo-sqlite, ohne Konto, nur auf diesem Gerät
 *   server-store.ts   Supabase, mit Konto und Freigaben
 *
 * Screens und Hooks sehen nur diese Schnittstelle. Deshalb muss beim
 * Übergang vom lokalen Modus ins Konto kein einziger Screen angefasst
 * werden — es wechselt nur, welche Umsetzung darunter liegt.
 *
 * Beide arbeiten mit derselben zweistufigen Verschlüsselung: Jeder Eintrag
 * hat einen eigenen Datenschlüssel, der verpackt gespeichert wird. Lokal ist
 * das streng genommen unnötig, macht den späteren Umzug aber zu einem
 * Kopiervorgang statt einer Umformung.
 */
import type { Category } from '@/domain';

/**
 * Ein Eintrag, wie ihn die Ablage nach oben herausgibt: entschlüsselt und
 * gegen sein Muster geprüft.
 */
export type Entry<T> = {
  readonly id: string;
  readonly category: Category;
  readonly content: T;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** Was beim Anlegen übergeben wird. Die ID vergibt die Ablage. */
export type NewEntry = {
  readonly category: Category;
  readonly content: Record<string, unknown>;
};

/**
 * Die Ablage.
 *
 * Alle Funktionen sind asynchron — auch die lokalen. Sonst müsste beim
 * Wechsel auf die Serverablage jede Aufrufstelle geändert werden.
 */
export type Store = {
  /** Legt einen Eintrag an und gibt seine ID zurück. */
  createEntry(entry: NewEntry): Promise<string>;

  /**
   * Lädt alle Einträge einer Kategorie, entschlüsselt und geprüft.
   *
   * validator ist das zod-Muster aus src/domain. Die Ablage kennt die
   * Fachstruktur nicht — sie wendet nur an, was sie bekommt.
   */
  loadEntries<T extends { schemaVersion: number }>(
    category: Category,
    validator: ValidatorFor<T>,
  ): Promise<Entry<T>[]>;

  /** Lädt einen einzelnen Eintrag. Wirft E-DB05, wenn es ihn nicht gibt. */
  loadEntry<T extends { schemaVersion: number }>(
    id: string,
    validator: ValidatorFor<T>,
  ): Promise<Entry<T>>;

  /** Ersetzt den Inhalt eines Eintrags. Der Datenschlüssel bleibt derselbe. */
  updateEntry(id: string, content: Record<string, unknown>): Promise<void>;

  /** Löscht einen Eintrag samt aller zugehörigen Verpackungen. */
  deleteEntry(id: string): Promise<void>;

  /**
   * Zählt Einträge je Kategorie, ohne zu entschlüsseln.
   *
   * Für das Dashboard. Die Kategorie steht im Klartext, deshalb geht das
   * ohne jeden Schlüssel — und ohne dass der Server je einen Inhalt sieht.
   */
  countByCategory(): Promise<Partial<Record<Category, number>>>;
};

/**
 * Ein Prüfmuster, wie es zod liefert.
 *
 * Bewusst schmal beschrieben statt den vollen zod-Typ zu verlangen: Die
 * Ablage braucht nur safeParse. So bleibt die Schnittstelle unabhängig
 * davon, mit welchem Werkzeug geprüft wird.
 */
export type ValidatorFor<T> = {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false };
};