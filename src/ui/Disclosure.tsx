/**
 * Der Aufklapper für Angaben, die man auch später ergänzen kann.
 *
 * Zugeklappt sieht ein Screen nach zwei Fragen aus statt nach fünf. Wer mehr
 * eintragen will, klappt auf.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors, fontSize, minTouchTarget, spacing } from '@/design';

import { useLineHeight } from './typography';

type Props = {
  title: string;
  /** Kleiner Zusatz, z. B. „Kannst du auch später ergänzen". */
  note?: string;
  children: ReactNode;
};

export function Disclosure({ title, note, children }: Props) {
  const [open, setOpen] = useState(false);
  const lineHeight = useLineHeight();

  return (
    <View style={{ marginTop: spacing.lg }}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: minTouchTarget,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: spacing.md,
        }}
      >
        <Text style={{ fontSize: fontSize.md, color: colors.accent }}>{open ? '−' : '+'}</Text>
        <Text
          style={{
            flex: 1,
            fontSize: fontSize.md,
            lineHeight: lineHeight(fontSize.md),
            color: colors.accent,
          }}
        >
          {title}
        </Text>
      </Pressable>

      {!open && note !== undefined && (
        <Text
          style={{
            fontSize: fontSize.xs,
            lineHeight: lineHeight(fontSize.xs),
            color: colors.textSecondary,
            marginBottom: spacing.sm,
          }}
        >
          {note}
        </Text>
      )}

      {open && <View style={{ marginTop: spacing.md }}>{children}</View>}
    </View>
  );
}