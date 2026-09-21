/**
 * Der Standardknopf. Zwei Ausprägungen: gefüllt für die Hauptaktion,
 * unauffällig für alles andere.
 *
 * Mindesthöhe 44 Punkt, wie in der Definition of Done gefordert.
 */
import { Pressable, Text } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/design';

type Props = {
  beschriftung: string;
  aufDruck: () => void;
  art?: 'haupt' | 'leise';
  gesperrt?: boolean;
};

export function Knopf({
  beschriftung,
  aufDruck,
  art = 'haupt',
  gesperrt = false,
}: Props) {
  const gefuellt = art === 'haupt';

  return (
    <Pressable
      onPress={aufDruck}
      disabled={gesperrt}
      style={({ pressed }) => ({
        backgroundColor: gefuellt
          ? gesperrt
            ? colors.surfaceMuted
            : pressed
              ? colors.accentPressed
              : colors.accent
          : 'transparent',
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Text
        style={{
          fontSize: fontSize.md,
          color: gefuellt
            ? gesperrt
              ? colors.textSecondary
              : colors.textOnAccent
            : colors.textSecondary,
        }}
      >
        {beschriftung}
      </Text>
    </Pressable>
  );
}