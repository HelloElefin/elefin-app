/**
 * Der Hinweiskasten „Gut zu wissen" unter einer Frage.
 *
 * Erklärt, warum wir etwas fragen. Im Klickdummy ist das die Stelle, an der
 * aus einem Formular ein Gespräch wird — deshalb ein eigener Baustein.
 */
import { Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/design';

import { useLineHeight } from './typography';

type Props = {
  title: string;
  text: string;
  tone?: 'info' | 'warning';
};

export function Callout({ title, text, tone = 'info' }: Props) {
  const lineHeight = useLineHeight();
  const warn = tone === 'warning';

  return (
    <View
      style={{
        backgroundColor: warn ? colors.warningSubtle : colors.accentSubtle,
        borderRadius: radius.md,
        padding: spacing.md,
        marginTop: spacing.lg,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.sm,
          lineHeight: lineHeight(fontSize.sm),
          color: warn ? colors.warning : colors.textPrimary,
          marginBottom: spacing.xs,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: fontSize.sm,
          lineHeight: lineHeight(fontSize.sm),
          color: warn ? colors.warning : colors.textSecondary,
        }}
      >
        {text}
      </Text>
    </View>
  );
}