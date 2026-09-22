/**
 * Ein Eingabefeld mit Beschriftung und optionalem Hinweis.
 *
 * Liegt in src/ui, weil es in jedem Formular der App gebraucht wird. Kennt
 * keine Fachlogik — es zeigt an, was man ihm gibt.
 */
import { Text, TextInput, View } from 'react-native';

import { colors, fontSize, minTouchTarget, radius, spacing } from '@/design';

import { useLineHeight } from './typography';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hint?: string;
  hintType?: 'neutral' | 'warning';
  onBlur?: () => void;
  /** Für längere Angaben wie „Wo liegt es?" — wächst mit dem Text. */
  multiline?: boolean;
  /** Obergrenze, damit niemand versehentlich einen Roman einträgt. */
  maxLength?: number;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  hintType = 'neutral',
  onBlur,
  multiline = false,
  maxLength = 200,
}: Props) {
  const lineHeight = useLineHeight();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          fontSize: fontSize.sm,
          lineHeight: lineHeight(fontSize.sm),
          color: colors.textSecondary,
          marginBottom: spacing.xs,
        }}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        multiline={multiline}
        maxLength={maxLength}
        // Ohne das liest ein Bildschirmleser nur den Beispieltext vor und
        // nicht, wonach überhaupt gefragt wird.
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: hintType === 'warning' ? colors.warning : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: fontSize.md,
          lineHeight: lineHeight(fontSize.md),
          color: colors.textPrimary,
          minHeight: multiline ? minTouchTarget * 2 : minTouchTarget,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />

      {hint !== undefined && (
        <Text
          style={{
            fontSize: fontSize.sm,
            lineHeight: lineHeight(fontSize.sm),
            color: hintType === 'warning' ? colors.warning : colors.textSecondary,
            marginTop: spacing.xs,
          }}
        >
          {hint}
        </Text>
      )}
    </View>
  );
}