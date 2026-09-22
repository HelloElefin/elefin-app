/**
 * Der Standardknopf. Zwei Ausprägungen: gefüllt für die Hauptaktion,
 * unauffällig für alles andere.
 *
 * Mindesthöhe aus dem Token minTouchTarget, wie in der Definition of Done
 * gefordert.
 */
import { Pressable, Text } from 'react-native';

import { colors, fontSize, minTouchTarget, radius, spacing } from '@/design';

import { useLineHeight } from './typography';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'quiet';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: Props) {
  const filled = variant === 'primary';
  const lineHeight = useLineHeight();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      // Ohne diese beiden Angaben meldet sich der Knopf bei Bildschirmlesern
      // nicht als Knopf — und im Browser ist er per Tastatur nicht erreichbar.
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        backgroundColor: filled
          ? disabled
            ? colors.surfaceMuted
            : pressed
              ? colors.accentPressed
              : colors.accent
          : pressed
            ? colors.surfaceMuted
            : 'transparent',
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        minHeight: minTouchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: !filled && disabled ? 0.5 : 1,
      })}
    >
      <Text
        style={{
          fontSize: fontSize.md,
          lineHeight: lineHeight(fontSize.md),
          color: filled
            ? disabled
              ? colors.textSecondary
              : colors.textOnAccent
            : colors.textSecondary,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}