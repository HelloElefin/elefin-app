/**
 * Die Fortschrittsanzeige oben: ein Balken und eine Zeile Text.
 *
 * Der Text kommt fertig von außen („Bereich 7 von 23"), damit hier kein
 * Textschlüssel steht (Regel 3).
 */
import { Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/design';

import { useLineHeight } from './typography';

type Props = {
  position: number;
  total: number;
  label: string;
};

export function Progress({ position, total, label }: Props) {
  const lineHeight = useLineHeight();
  const anteil = total > 0 ? Math.min(1, Math.max(0, position / total)) : 0;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: position }}
        accessibilityLabel={label}
        style={{
          height: spacing.xs,
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.full,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${anteil * 100}%`,
            height: '100%',
            backgroundColor: colors.accent,
          }}
        />
      </View>
      <Text
        style={{
          fontSize: fontSize.xs,
          lineHeight: lineHeight(fontSize.xs),
          color: colors.textSecondary,
          marginTop: spacing.xs,
        }}
      >
        {label}
      </Text>
    </View>
  );
}