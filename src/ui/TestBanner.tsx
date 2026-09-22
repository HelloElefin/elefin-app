/**
 * Der Hinweis auf die Testfassung, dauerhaft oben auf jedem Screen.
 *
 * Nur für Phase 1. Die App verspricht auf dem Grundsätze-Screen
 * Verschlüsselung auf dem Gerät — in der Browserfassung stimmt das nicht.
 * Dieser Streifen ist der Ausgleich dafür, bis Phase 2 ihn überflüssig macht.
 */
import { Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/design';

import { useLineHeight } from './typography';

type Props = { text: string };

export function TestBanner({ text }: Props) {
  const lineHeight = useLineHeight();

  return (
    <View
      style={{
        backgroundColor: colors.warningSubtle,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.xs,
          lineHeight: lineHeight(fontSize.xs),
          color: colors.warning,
          textAlign: 'center',
        }}
      >
        {text}
      </Text>
    </View>
  );
}