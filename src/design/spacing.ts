/**
 * Abstandstokens.
 *
 * Alles ist ein Vielfaches von 4. Das klingt nach Erbsenzählerei, sorgt aber
 * dafür, dass die App ruhig wirkt statt zufällig zusammengeschoben.
 *
 * Faustregel:
 *   xs  innerhalb eines Elements (Symbol zu Text)
 *   sm  zwischen eng zusammengehörenden Zeilen
 *   md  Standardabstand, Innenabstand von Karten
 *   lg  zwischen Abschnitten
 *   xl  über und unter größeren Blöcken
 *   xxl vor einem Abschluss, z. B. über dem Hauptknopf
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Seitenrand links und rechts. Eigener Token, weil er überall gleich sein
 * muss und man ihn sonst versehentlich mal als md, mal als lg setzt.
 */
export const screenPadding = spacing.md;

/**
 * Kleinste zulässige Höhe und Breite für alles, was man antippen kann.
 * 44 Punkt ist der Wert aus den Barrierefreiheitsrichtlinien von Apple und
 * Google. Darunter treffen Menschen mit zittrigen Händen nicht zuverlässig.
 */
export const minTouchTarget = 44;

export type SpacingToken = keyof typeof spacing;