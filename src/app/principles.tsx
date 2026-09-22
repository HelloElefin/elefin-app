/**
 * Die fünf Grundsätze, bevor die erste Frage kommt.
 *
 * Der Screen, an dem sich entscheidet, ob jemand ehrliche Angaben macht oder
 * Fantasiewerte einträgt. Deshalb steht er vor allem anderen.
 */
import { ScrollView, Text, View } from 'react-native';

import { colors, fontSize, radius, screenPadding, spacing } from '@/design';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { Button, useLineHeight } from '@/ui';

const ITEMS = ['item_1', 'item_2', 'item_3', 'item_4', 'item_5'];

export default function PrinciplesScreen() {
  const { text } = useText();
  const flow = useFlow({ screenId: 'principles', pass: 1 });
  const lineHeight = useLineHeight();

  return (
    <ScrollView contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl }}>
      <Text
        style={{
          fontSize: fontSize.xs,
          lineHeight: lineHeight(fontSize.xs),
          letterSpacing: 1,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        }}
      >
        {text('block.before-start.title').toUpperCase()}
      </Text>

      <Text
        style={{
          fontSize: fontSize.xl,
          lineHeight: lineHeight(fontSize.xl, 1.25),
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}
      >
        {text('flow.principles.title')}
      </Text>

      <Text
        style={{
          fontSize: fontSize.md,
          lineHeight: lineHeight(fontSize.md),
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        {text('flow.principles.subtitle')}
      </Text>

      <View style={{ gap: spacing.md }}>
        {ITEMS.map((item) => (
          <View
            key={item}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.md,
                lineHeight: lineHeight(fontSize.md),
                color: colors.textPrimary,
                marginBottom: spacing.xs,
              }}
            >
              {text(`flow.principles.${item}.title`)}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                lineHeight: lineHeight(fontSize.sm),
                color: colors.textSecondary,
              }}
            >
              {text(`flow.principles.${item}.text`)}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button label={text('flow.principles.next')} onPress={flow.goNext} />
        {flow.hasBack && <Button label={text('common.back')} variant="quiet" onPress={flow.goBack} />}
      </View>
    </ScrollView>
  );
}