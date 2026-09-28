/**
 * Die Zeichnungen für das gedruckte Blatt.
 *
 * Bewusst getrennt von src/ui/art: Dort sind es React-Komponenten für den
 * Bildschirm, hier sind es Zeichenketten für eine HTML-Seite. Beides aus
 * einer Quelle zu erzeugen wäre mehr Aufwand als Nutzen — auf Papier
 * braucht es ohnehin eine feinere Linie und andere Größen.
 *
 * Wer eine Zeichnung ändert, muss an beide Stellen denken. Deshalb sind es
 * hier nur die zwei, die auf dem Blatt wirklich vorkommen.
 */

const SCHUBLADE = [
  'M18 46h124v52a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6Z',
  'M18 62h124',
  'M70 74h20',
  'M44 46V26a6 6 0 0 1 6-6h60a6 6 0 0 1 6 6v20',
  'M58 46V34h44v12',
  'M61 30a5 5 0 1 0 10 0 5 5 0 1 0-10 0',
  'M66 35v7',
  'M66 38h4',
  'M84 26h20v12H84Z',
  'M84 26l10 7 10-7',
];

/** Die Schublade, wie sie auch auf dem Startscreen steht. */
export function schubladeSvg(width: number, color: string): string {
  const hoehe = Math.round(width * 0.75);
  const pfade = SCHUBLADE.map((d) => `<path d="${d}"/>`).join('');
  return (
    `<svg viewBox="0 0 160 120" width="${width}" height="${hoehe}" fill="none" stroke="${color}" ` +
    `stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${pfade}</svg>`
  );
}

/**
 * Die Wortmarke. Der Platz für das Zeichen bleibt vorerst leer — auf Papier
 * wäre ein gestrichelter Platzhalter störender als gar nichts.
 */
export function wordmarkHtml(color: string): string {
  return `<span style="font-size: 13pt; font-weight: 600; color: ${color}; letter-spacing: 0.4pt">Elefin</span>`;
}