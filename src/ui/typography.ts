/**
 * Zeilenhöhe zur Schriftgröße ausrechnen.
 *
 * In src/design stehen bewusst nur Faktoren. Der Grund: Stellt jemand die
 * Systemschrift auf 200 %, wächst die Schriftgröße mit — eine fest
 * eingetragene Zeilenhöhe nicht, und der Text liefe übereinander.
 *
 * useWindowDimensions liefert den aktuellen Vergrößerungsfaktor und meldet
 * sich neu, wenn er sich ändert. Deshalb ein Hook und keine einfache
 * Funktion.
 */
import { useWindowDimensions } from 'react-native';

import { lineHeightFactor } from '@/design';

export function useLineHeight() {
  const { fontScale } = useWindowDimensions();
  return (size: number, factor: number = lineHeightFactor.normal) =>
    Math.round(size * factor * fontScale);
}