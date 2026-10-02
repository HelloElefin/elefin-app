/**
 * Ein kleiner Knopf oben rechts für einen Nebenweg.
 *
 * Für Dinge, die nicht zum Hauptweg gehören, aber jederzeit erreichbar sein
 * sollen: der Einstieg für den Todesfall, das Blatt zum Ausdrucken. Oben
 * rechts, weil Menschen dort Hilfe und Werkzeuge suchen — sichtbar, ohne mit
 * dem Hauptknopf zu konkurrieren.
 *
 * Mindesthöhe wie jeder andere Knopf: Klein heißt nicht schwer zu treffen.
 */
import { Pressable, Text, View } from 'react-native';

import { colors, fontSize, minTouchTarget, radius, spacing } from '@/design';

import { Art } from './art';
import { useLineHeight } from './typography';

type Props = {
  label: string;
  onPress: () => void;
  /** Der volle Satz für Bildschirmleser, wenn das sichtbare Wort kurz ist. */
  accessibilityLabel?: string;
  /** Ein kleiner farbiger Punkt davor, z. B. für den Todesfall. */
  dot?: string;
  /** Oder ein Symbol aus src/ui/art. */
  icon?: string;
};

export function Chip({ label, onPress, accessibilityLabel, dot, icon }: Props) {
  const lineHeight = useLineHeight();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        minHeight: minTouchTarget,
        paddingHorizontal: spacing.md,
        backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.full,
      })}
    >
      {dot !== undefined && (
        <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: dot }} />
      )}
      {icon !== undefined && <Art id={icon} size="symbol" />}
      <Text
        style={{
          fontSize: fontSize.sm,
          lineHeight: lineHeight(fontSize.sm),
          color: colors.textPrimary,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>›</Text>
    </Pressable>
  );
}