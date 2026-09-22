/**
 * Der Abschluss: PDF oder Konto.
 *
 * Der PDF-Knopf führt in Phase 1 zur Druckansicht des Browsers. Die kommt in
 * Schritt 8 — bis dahin ist er absichtlich ausgegraut, statt so zu tun, als
 * gäbe es sie schon. Das Konto beginnt erst in Phase 3.
 */
import { ScrollView, Text, View } from 'react-native';

import { colors, fontSize, radius, screenPadding, spacing } from '@/design';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { Button, Callout, useLineHeight } from '@/ui';

export default function FinishScreen() {
  const { text } = useText();
  const flow = useFlow({ screenId: 'finish', pass: 1 });
  const lineHeight = useLineHeight();

  return (
    <ScrollView contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl }}>
      <Text
        style={{
          fontSize: fontSize.xl,
          lineHeight: lineHeight(fontSize.xl, 1.25),
          color: colors.textPrimary,
          marginBottom: spacing.lg,
        }}
      >
        {text('flow.finish.title')}
      </Text>

      {[
        { key: 'pdf', disabled: true },
        { key: 'account', disabled: true },
      ].map(({ key, disabled }) => (
        <View
          key={key}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
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
            {text(`flow.finish.${key}.title`)}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              lineHeight: lineHeight(fontSize.sm),
              color: colors.textSecondary,
              marginBottom: spacing.md,
            }}
          >
            {text(`flow.finish.${key}.hint`)}
          </Text>
          <Button
            label={text(`flow.finish.${key}.title`)}
            variant={key === 'pdf' ? 'primary' : 'quiet'}
            disabled={disabled}
            onPress={() => {}}
          />
        </View>
      ))}

      <Callout
        title={text('flow.finish.note.title')}
        text={text('flow.finish.note.text')}
        tone="warning"
      />

      <View style={{ marginTop: spacing.xl }}>
        {flow.hasBack && <Button label={text('common.back')} variant="quiet" onPress={flow.goBack} />}
      </View>
    </ScrollView>
  );
}