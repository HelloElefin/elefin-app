/**
 * Eckenradien.
 *
 * Weich, aber nicht verspielt. Bei einem Thema wie Vorsorge wirken sehr
 * runde Ecken schnell nach Spiel-App, sehr scharfe nach Behördenformular.
 */
export const radius = {
  /** Kleine Elemente: Kennzeichnungen, Symbolflächen. */
  sm: 8,
  /** Standard: Eingabefelder, Knöpfe. */
  md: 12,
  /** Karten und größere Flächen. */
  lg: 16,
  /** Vollständig rund, z. B. runder Symbolknopf. */
  full: 999,
} as const;

export type RadiusToken = keyof typeof radius;