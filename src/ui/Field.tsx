/**
 * Ein Eingabefeld mit Beschriftung und optionalem Hinweis.
 *
 * Liegt in src/ui, weil es in jedem Formular der App gebraucht wird. Kennt
 * keine Fachlogik — es zeigt an, was man ihm gibt.
 */
import { Text, TextInput, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/design';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hint?: string;
  hintType?: 'neutral' | 'warning';
  onBlur?: () => void;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  hintType = 'neutral',
  onBlur,
}: Props) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={{
          fontSize: fontSize.sm,
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
        placeholderTextColor={colors.border}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor:
            hintType === 'warning' ? colors.warning : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: fontSize.md,
          color: colors.textPrimary,
          minHeight: 44,
        }}
      />

      {hint !== undefined && (
        <Text
          style={{
            fontSize: fontSize.sm,
            color:
              hintType === 'warning' ? colors.warning : colors.textSecondary,
            marginTop: spacing.xs,
          }}
        >
          {hint}
        </Text>
      )}
    </View>
  );
}