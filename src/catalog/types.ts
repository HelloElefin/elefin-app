/**
 * Fragenkatalog — die Form eines Katalogs.
 *
 * Der Katalog beschreibt jeden Screen des lokalen Flows als Daten. Ein
 * generischer Frage-Screen stellt jeden Eintrag dar; eine neue Frage
 * entsteht durch einen Katalogeintrag, nicht durch Code (Regel 14).
 *
 * IM KATALOG STEHEN KEINE TEXTE. Die Textschlüssel werden aus den IDs
 * abgeleitet (Regel 3):
 *
 *   Screen      flow.<screenId>.title
 *               flow.<screenId>.subtitle
 *               flow.<screenId>.next
 *               flow.<screenId>.note.title    Hinweiskasten „Warum wir das fragen"
 *               flow.<screenId>.note.text
 *   Block       block.<blockId>.title         Überschrift über dem Screen
 *   Feld        question.<category>.<fieldId>.label
 *               question.<category>.<fieldId>.placeholder
 *   Option      option.<category>.<fieldId>.<value>.label
 *               option.<category>.<fieldId>.<value>.hint
 *   Allgemein   common.back
 *               common.unknown                „Weiß ich gerade nicht"
 *
 * Optionen enden bewusst auf .label statt auf <value> selbst: Ein Schlüssel
 * kann in den Sprachdateien nicht zugleich Text und Behälter für .hint sein.
 *
 * Nicht jeder Schlüssel muss existieren — ein Screen ohne Hinweiskasten hat
 * eben kein note.title. Welche vorhanden sein müssen, prüfen die
 * Katalogtests (Phase 1, Schritt 3).
 *
 * IDs sind Daten und werden nie umbenannt. Die Reihenfolge der Screens steht
 * im Katalog, nicht in der ID.
 */
import type { Category } from '@/domain';

/** Art eines Eingabefelds. */
export type FieldType =
  | 'text' // Freitext
  | 'choice' // Einfachauswahl
  | 'multi'; // Mehrfachauswahl

/** Eine Auswahlmöglichkeit. Gespeichert wird der Wert, der Text kommt aus den Sprachdateien. */
export type CatalogOption = {
  /** Englisch, snake_case, z. B. 'checking'. Nie umbenennen. */
  value: string;
};

/** Ein Eingabefeld auf einem Frage-Screen. */
export type CatalogField = {
  /**
   * Datenfeldname, englisch, snake_case, z. B. 'institution'.
   * Innerhalb einer Kategorie eindeutig — auch wenn die Kategorie mehrere
   * Screens hat (z. B. funeral_wishes: Bestattung und Organspende).
   */
  id: string;
  type: FieldType;
  /** Nur bei 'choice' und 'multi'. */
  options?: CatalogOption[];
  /** Bietet „Weiß ich gerade nicht" an. */
  allowUnknown: boolean;
  /** Steckt im Aufklapper statt sofort sichtbar. */
  inDisclosure: boolean;
};

/**
 * Art eines Screens.
 *   frame     Rahmenscreen mit eigener Darstellung: Start, Grundsätze,
 *             Situation, Inventar, Übersicht, Abschluss
 *   question  wird vom generischen Frage-Screen dargestellt
 */
export type ScreenKind = 'frame' | 'question';

/** Ein Screen des Flows. */
export type CatalogScreen = {
  /** Sprechend, englisch, kebab-case, z. B. 'bank-account'. Nie umbenennen. */
  id: string;
  kind: ScreenKind;
  /** Gruppe für Fortschrittsanzeige und Überschrift, z. B. 'money'. */
  block: string;
  /** Kategorie, in die die Antworten gehören. Bei Rahmenscreens meist leer. */
  category?: Category;
  /**
   * Screen nur zeigen, wenn diese Kategorie im Inventar angegeben wurde
   * (applies = true). Fehlt der Wert, wird der Screen immer gezeigt.
   */
  showIf?: Category;
  /** Ein Durchgang je erklärter Anzahl, z. B. dreimal für drei Konten. */
  repeatable: boolean;
  fields: CatalogField[];
};

/** Der ganze Katalog. */
export type Catalog = {
  schemaVersion: number;
  /** In der Reihenfolge des Flows. */
  screens: CatalogScreen[];
};