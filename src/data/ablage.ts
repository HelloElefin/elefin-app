/**
 * Die Schnittstelle zur Ablage.
 *
 * Hier steht, WAS eine Ablage können muss — nicht wie. Es gibt zwei
 * Umsetzungen:
 *
 *   ablage-lokal.ts   expo-sqlite, ohne Konto, nur auf diesem Gerät
 *   ablage-server.ts  Supabase, mit Konto und Freigaben
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
import type { Kategorie } from '@/domain';

/**
 * Ein Eintrag, wie ihn die Ablage nach oben herausgibt: entschlüsselt und
 * gegen sein Muster geprüft.
 */
export type Eintrag<T> = {
  readonly id: string;
  readonly kategorie: Kategorie;
  readonly inhalt: T;
  readonly angelegtAm: string;
  readonly geaendertAm: string;
};

/** Was beim Anlegen übergeben wird. Die ID vergibt die Ablage. */
export type NeuerEintrag = {
  readonly kategorie: Kategorie;
  readonly inhalt: Record<string, unknown>;
};

/**
 * Die Ablage.
 *
 * Alle Funktionen sind asynchron — auch die lokalen. Sonst müsste beim
 * Wechsel auf die Serverablage jede Aufrufstelle geändert werden.
 */
export type Ablage = {
  /** Legt einen Eintrag an und gibt seine ID zurück. */
  eintragAnlegen(eintrag: NeuerEintrag): Promise<string>;

  /**
   * Lädt alle Einträge einer Kategorie, entschlüsselt und geprüft.
   *
   * muster ist das zod-Muster aus src/domain. Die Ablage kennt die
   * Fachstruktur nicht — sie wendet nur an, was sie bekommt.
   */
  eintraegeLaden<T extends { schemaVersion: number }>(
    kategorie: Kategorie,
    muster: MusterFuer<T>,
  ): Promise<Eintrag<T>[]>;

  /** Lädt einen einzelnen Eintrag. Wirft E-DB05, wenn es ihn nicht gibt. */
  eintragLaden<T extends { schemaVersion: number }>(
    id: string,
    muster: MusterFuer<T>,
  ): Promise<Eintrag<T>>;

  /** Ersetzt den Inhalt eines Eintrags. Der Datenschlüssel bleibt derselbe. */
  eintragAendern(id: string, inhalt: Record<string, unknown>): Promise<void>;

  /** Löscht einen Eintrag samt aller zugehörigen Verpackungen. */
  eintragLoeschen(id: string): Promise<void>;

  /**
   * Zählt Einträge je Kategorie, ohne zu entschlüsseln.
   *
   * Für das Dashboard. Die Kategorie steht im Klartext, deshalb geht das
   * ohne jeden Schlüssel — und ohne dass der Server je einen Inhalt sieht.
   */
  anzahlJeKategorie(): Promise<Partial<Record<Kategorie, number>>>;
};

/**
 * Ein Prüfmuster, wie es zod liefert.
 *
 * Bewusst schmal beschrieben statt den vollen zod-Typ zu verlangen: Die
 * Ablage braucht nur safeParse. So bleibt die Schnittstelle unabhängig
 * davon, mit welchem Werkzeug geprüft wird.
 */
export type MusterFuer<T> = {
  safeParse(wert: unknown):
    | { success: true; data: T }
    | { success: false };
};