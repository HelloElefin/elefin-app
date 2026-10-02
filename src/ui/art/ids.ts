/**
 * Die IDs der Zeichnungen, ohne jeden Bezug zur Oberfläche.
 *
 * Absichtlich getrennt von registry.ts: Dort hängen React-Komponenten dran,
 * und die kann ein Test auf dem PC nicht laden. Die reine Liste der IDs
 * dagegen schon — und genau die braucht die Katalogprüfung.
 *
 * Kommt eine Zeichnung dazu, gehört sie in beide Dateien. Dass das
 * zusammenpasst, erzwingt der Typ in registry.ts.
 */
export const ART_IDS = [
  'dose',
  'haus',
  'napf',
  'ordner',
  'briefkasten',
  'fueller',
  'zettel',
  'schublade',
  'schliessfach',
  'checkliste',
  'menschen',
  'wolke',
  'verlauf',
] as const;

export type ArtId = (typeof ART_IDS)[number];

export function isArtId(value: unknown): value is ArtId {
  return typeof value === 'string' && (ART_IDS as readonly string[]).includes(value);
}