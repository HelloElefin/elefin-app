/**
 * Ein Eingabefeld mit Beschriftung und optionalem Hinweis.
 *
 * Liegt in src/ui, weil es in jedem Formular der App gebraucht wird. Kennt
 * keine Fachlogik — es zeigt an, was man ihm gibt.
 */
import { Text, TextInput, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/design';

type Props = {
  beschriftung: string;
  wert: string;
  aufAenderung: (wert: string) => void;
  platzhalter?: string;
  hinweis?: string;
  hinweisArt?: 'neutral' | 'warnung';
  aufVerlassen?: () => void;
};

export function Field({
  beschriftung,
  wert,
  aufAenderung,
  platzhalter,
  hinweis,
  hinweisArt = 'neutral',
  aufVerlassen,
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
        {beschriftung}
      </Text>

      <TextInput
        value={wert}
        onChangeText={aufAenderung}
        onBlur={aufVerlassen}
        placeholder={platzhalter}
        placeholderTextColor={colors.border}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor:
            hinweisArt === 'warnung' ? colors.warning : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: fontSize.md,
          color: colors.textPrimary,
          minHeight: 44,
        }}
      />

      {hinweis !== undefined && (
        <Text
          style={{
            fontSize: fontSize.sm,
            color:
              hinweisArt === 'warnung' ? colors.warning : colors.textSecondary,
            marginTop: spacing.xs,
          }}
        >
          {hinweis}
        </Text>
      )}
    </View>
  );
}