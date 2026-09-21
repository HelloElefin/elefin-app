/**
 * Der Standardknopf. Zwei Ausprägungen: gefüllt für die Hauptaktion,
 * unauffällig für alles andere.
 *
 * Mindesthöhe 44 Punkt, wie in der Definition of Done gefordert.
 */
import { Pressable, Text } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/design';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'quiet';
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: Props) {
  const filled = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: filled
          ? disabled
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
          color: filled
            ? disabled
              ? colors.textSecondary
              : colors.textOnAccent
            : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}