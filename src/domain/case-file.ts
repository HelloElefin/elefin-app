/**
 * Akten-Kopf — was wir über die Situation der Person wissen.
 *
 * Genau einer je Person. Er hält keine Inhalte (keine Konten, keine Orte),
 * sondern das, was den Fragenfluss steuert: Einstieg, Familienstand, Kinder,
 * Markt und das Inventar — welche Themen es überhaupt gibt und wie viele.
 *
 * Wird in Phase 3 als verschlüsselter Eintrag der Kategorie 'case_profile'
 * ins Konto übernommen. Familienstand und Kinder bestimmen die gesetzliche
 * Erbfolge und dürfen dabei nicht verloren gehen.
 *
 * Alle Werte sind Daten und werden nie umbenannt.
 */
import type { Answer } from './answer-state';
import type { Category } from './categories';

/**
 * Wie jemand eingestiegen ist.
 *   planning     für sich selbst vorsorgen
 *   bereavement  nach einem Todesfall
 * Phase 1 fragt beides ab, verzweigt aber noch nicht.
 */
export type EntryMode = 'planning' | 'bereavement';

/** Familienstand. */
export type MaritalStatus =
  | 'single'
  | 'married'
  | 'partnership'
  | 'divorced'
  | 'widowed';

/**
 * Kinder.
 *   none        keine
 *   all_adult   ja, alle über 18
 *   some_minor  ja, mindestens eines unter 18
 */
export type ChildrenStatus = 'none' | 'all_adult' | 'some_minor';

/**
 * Markt = welches Recht gilt, nicht welche Sprache.
 * Klein geschrieben, genau wie die Prüfregel in der Datenbank.
 */
export type Market = 'at' | 'de';

/**
 * Wie viele Objekte jemand zu einem Thema angibt, z. B. drei Konten.
 *
 * 'unknown' heißt hier: Es gibt welche, aber die Person weiß nicht, wie viele.
 * Das ist etwas anderes als Answer 'unknown' — dort weiß sie nicht einmal,
 * ob es überhaupt welche gibt.
 */
export type DeclaredCount = 1 | 2 | 3 | 'more' | 'unknown';

/** Angabe im Inventar zu einer Kategorie. */
export type InventoryDeclaration = {
  /** Gibt es das? */
  applies: boolean;
  /** Wie viele? Nur sinnvoll, wenn applies = true. */
  count?: DeclaredCount;
};

/** Der Akten-Kopf. */
export type CaseFile = {
  /**
   * Pflichtfeld nach Regel 7. Der Wert wird beim Verschlüsseln von
   * encryptContent gesetzt (src/crypto/content.ts) und gilt dort für alle
   * Inhalte gemeinsam — deshalb gibt es hier keine eigene Konstante.
   */
  schemaVersion: number;
  entryMode: EntryMode;
  maritalStatus: Answer<MaritalStatus>;
  childrenStatus: Answer<ChildrenStatus>;
  market: Market;
  /** Sprache der Oberfläche beim Anlegen, z. B. 'de'. Unabhängig vom Markt. */
  language: string;
  /**
   * Inventar: je Kategorie die Angabe der Person.
   * Fehlt eine Kategorie, gilt sie als 'open' — nie gefragt.
   *
   * Die erklärte Anzahl ist bewusst getrennt von den tatsächlich gefüllten
   * Einträgen. Daraus entsteht auf der Übersicht „2 von 3 Konten notiert".
   */
  inventory: Partial<Record<Category, Answer<InventoryDeclaration>>>;
  /** Zeitpunkte als ISO-Zeichenkette, z. B. '2026-09-21T18:30:00.000Z'. */
  createdAt: string;
  updatedAt: string;
  /** Gesetzt, sobald die Akte ins Konto übernommen wurde (Phase 3). */
  takenOverAt?: string;
};