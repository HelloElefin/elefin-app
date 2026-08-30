/**
 * Farbtokens für Elefin.
 *
 * Regel: Kein Screen und keine Komponente schreibt jemals einen Hex-Wert
 * direkt hin. Alles kommt aus dieser Datei.
 *
 * Alle Textfarben sind gegen ihren Hintergrund auf WCAG AA geprüft
 * (mindestens 4,5:1 bei normalem Text).
 */
export const colors = {
  // --- Hintergründe ---
  /** Hintergrund des gesamten Bildschirms. Warmes Off-White, nicht grell. */
  background: '#FBFAF8',
  /** Karten, Listeneinträge, alles was auf dem Hintergrund "liegt". */
  surface: '#FFFFFF',
  /** Dezent hervorgehobener Bereich, z. B. Hinweisbox. */
  surfaceMuted: '#F2F0EC',

  // --- Text ---
  /** Überschriften und Fließtext. Kontrast auf background: 15,8:1 */
  textPrimary: '#1A2320',
  /** Erklärungen, Untertitel, Metadaten. Kontrast auf background: 6,0:1 */
  textSecondary: '#5A6663',
  /** Text auf farbigem Grund, z. B. auf dem Hauptknopf. */
  textOnAccent: '#FFFFFF',

  // --- Hauptfarbe ---
  /** Knöpfe, aktive Zustände, Akzente. Kontrast auf weiß: 7,4:1 */
  accent: '#1F5F5B',
  /** Gedrückter Zustand des Hauptknopfs. */
  accentPressed: '#174744',
  /** Sehr dezenter Akzenthintergrund, z. B. hinter einem Symbol. */
  accentSubtle: '#E6EFEE',

  // --- Linien ---
  /** Trennlinien, Rahmen um Eingabefelder. */
  border: '#E2E0DB',
  /** Rahmen eines Eingabefelds, in das man gerade tippt. */
  borderFocus: '#1F5F5B',

  // --- Rückmeldungen ---
  /** Fehler. Kontrast auf weiß: 7,3:1 */
  danger: '#A4262C',
  dangerSubtle: '#FBEAEA',
  /** Erfolg, abgeschlossene Schritte. */
  success: '#2E6B43',
  successSubtle: '#E8F2EB',
  /** Achtung, ohne dass etwas kaputt ist. */
  warning: '#8A5A00',
  warningSubtle: '#FBF2E0',
} as const;

export type ColorToken = keyof typeof colors;