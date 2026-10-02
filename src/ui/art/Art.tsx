/**
 * Eine Zeichnung anzeigen.
 *
 * Der einzige Weg, wie ein Screen an ein Bild kommt. Kennt die ID nicht?
 * Dann erscheint ein gestrichelter Platzhalter statt einer Lücke — so sieht
 * man beim Entwickeln sofort, wo eine Zeichnung fehlt.
 *
 * Bilder sind hier immer Schmuck. Sie tragen keine Information, die nicht
 * auch im Text steht, und werden deshalb vor Bildschirmlesern verborgen.
 */
import { View } from 'react-native';

import { colors, radius } from '@/design';

import type { ArtId } from './ids';
import { DRAWINGS } from './registry';
import { useArtSize, type ArtSize } from './sizes';

type Props = {
  id: ArtId | string;
  size: ArtSize;
  /** Abweichende Farbe, sonst der Akzent. */
  color?: string;
};

export function Art({ id, size, color = colors.accent }: Props) {
  const breite = useArtSize(size);
  if (breite === null) return null;

  const Zeichnung = (DRAWINGS as Record<string, (typeof DRAWINGS)[ArtId] | undefined>)[id];

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Zeichnung ? (
        <Zeichnung size={breite} color={color} />
      ) : (
        <View
          style={{
            width: breite,
            height: Math.round(breite * 0.8),
            borderWidth: 1.5,
            borderStyle: 'dashed',
            // Platzhalter in der Farbe der Zeichnung, damit er auch auf
            // dunklem Grund sichtbar bleibt.
            borderColor: color,
            opacity: 0.4,
            borderRadius: radius.md,
          }}
        />
      )}
    </View>
  );
}