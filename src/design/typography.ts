/**
 * Schrifttokens.
 *
 * Wir benutzen bewusst die Systemschrift (Roboto auf Android, San Francisco
 * auf iOS). Keine eigene Schriftart: spart Ladezeit, sieht auf jedem Gerät
 * vertraut aus, und eure Zielgruppe achtet auf Verständlichkeit, nicht auf
 * Typografie-Feinheiten.
 *
 * Zur Zeilenhöhe: Hier stehen nur Faktoren, keine fertigen Werte. Grund:
 * Wenn jemand die Systemschrift auf 200 % stellt, wächst die Schriftgröße
 * mit — eine fest eingetragene Zeilenhöhe würde nicht mitwachsen und der
 * Text würde übereinanderlaufen. Die Umrechnung passiert später in den
 * UI-Bausteinen unter src/ui.
 */
export const fontSize = {
  /** Metadaten, Fußnoten, Fehlercodes. */
  xs: 13,
  /** Erklärtexte, Beschriftungen über Eingabefeldern. */
  sm: 15,
  /** Standard-Fließtext. Bewusst nicht kleiner. */
  md: 17,
  /** Abschnittsüberschrift. */
  lg: 20,
  /** Bildschirmtitel. */
  xl: 24,
  /** Große Titel, sparsam einsetzen. */
  xxl: 30,
} as const;

export const lineHeightFactor = {
  /** Für Überschriften: enger, wirkt kompakter. */
  tight: 1.25,
  /** Für Fließtext. Luft zwischen den Zeilen hilft beim Lesen. */
  normal: 1.45,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
} as const;

export type FontSizeToken = keyof typeof fontSize;