/**
 * Der Platz für das Logo.
 *
 * Vorerst nur der Schriftzug mit einem Platzhalter daneben. Sobald es ein
 * Zeichen gibt, kommt es als Zeichnung mit der ID "elefant" hinein und
 * diese Datei bleibt, wie sie ist.
 */
import { Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/design';

import { useLineHeight } from '../typography';
import { Art } from './Art';

export function Wordmark({ centered = false }: { centered?: boolean }) {
  const lineHeight = useLineHeight();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        justifyContent: centered ? 'center' : 'flex-start',
      }}
      accessibilityRole="header"
      accessibilityLabel="Elefin"
    >
      <Art id="elefant" size="symbol" />
      <Text
        style={{
          fontSize: fontSize.lg,
          lineHeight: lineHeight(fontSize.lg),
          color: colors.accent,
          letterSpacing: 0.5,
        }}
      >
        Elefin
      </Text>
    </View>
  );
}