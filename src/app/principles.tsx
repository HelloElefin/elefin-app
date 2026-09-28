/**
 * Die fünf Grundsätze, bevor die erste Frage kommt.
 *
 * Der Screen, an dem sich entscheidet, ob jemand ehrliche Angaben macht oder
 * Fantasiewerte einträgt. Deshalb Zeichnung und Leitsatz oben — und darunter
 * kurze Punkte statt fünf gleich schwerer Kästen.
 */
import { ScrollView, Text, View } from 'react-native';

import { colors, fontSize, screenPadding, spacing } from '@/design';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { Art, Button, useLineHeight } from '@/ui';

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
          marginBottom: spacing.md,
        }}
      >
        {text('block.before-start.title').toUpperCase()}
      </Text>

      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Art id="schliessfach" size="medium" />
      </View>

      <Text
        style={{
          fontSize: fontSize.lg,
          lineHeight: lineHeight(fontSize.lg, 1.25),
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {text('flow.principles.lead')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.sm,
          lineHeight: lineHeight(fontSize.sm),
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xl,
        }}
      >
        {text('flow.principles.subtitle')}
      </Text>

      {ITEMS.map((item) => (
        <View key={item} style={{ marginBottom: spacing.md }}>
          <Text
            style={{
              fontSize: fontSize.md,
              lineHeight: lineHeight(fontSize.md),
              color: colors.textPrimary,
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

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        <Button label={text('flow.principles.next')} onPress={flow.goNext} />
        {flow.hasBack && <Button label={text('common.back')} variant="quiet" onPress={flow.goBack} />}
      </View>
    </ScrollView>
  );
}