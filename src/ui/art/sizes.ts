/**
 * Drei Größen, mehr nicht.
 *
 *   symbol   neben einer Überschrift, wächst mit der Schrift mit
 *   medium   über einem Abschnitt
 *   large    die Schwelle, z. B. auf dem Startscreen
 *
 * Warum das eine eigene Datei ist: Stellt jemand die Systemschrift auf 200 %,
 * wächst der Text — das Bild nicht. Eine große Illustration würde den Text
 * dann vom Bildschirm drängen. Ab einer gewissen Vergrößerung wird sie
 * deshalb kleiner, und irgendwann verschwindet sie ganz. Text vor Bild.
 */
import { useWindowDimensions } from 'react-native';

export type ArtSize = 'symbol' | 'medium' | 'large';

const BASIS: Record<ArtSize, number> = {
  symbol: 20,
  medium: 170,
  large: 260,
};

/**
 * Die Breite in Punkt — oder null, wenn das Bild bei dieser Schriftgröße
 * weichen soll. Ein null hier bedeutet: gar nichts zeichnen.
 */
export function useArtSize(size: ArtSize): number | null {
  const { fontScale } = useWindowDimensions();

  // Symbole gehören zum Text und wachsen mit, aber gedeckelt: Ein Symbol,
  // das doppelt so groß ist wie die Zeile, sieht nach Versehen aus.
  if (size === 'symbol') return Math.round(BASIS.symbol * Math.min(fontScale, 1.5));

  if (fontScale >= 1.6) return null;
  if (fontScale >= 1.3) return size === 'large' ? BASIS.medium : Math.round(BASIS.medium * 0.7);
  return BASIS[size];
}