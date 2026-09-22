/**
 * Die Übersicht.
 *
 * Jede Zeile führt zurück zu ihrem Screen. Offene Punkte sind kein Vorwurf,
 * sondern der nächste Schritt — deshalb drei Zustände statt zwei.
 */
import { Pressable, ScrollView, Text, View } from 'react-native';

import { loadCatalog } from '@/catalog';
import { colors, fontSize, minTouchTarget, radius, screenPadding, spacing } from '@/design';
import { summaryRows } from '@/domain';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { useSession } from '@/state/session';
import { Button, useLineHeight } from '@/ui';

export default function SummaryScreen() {
  const { text } = useText();
  const session = useSession();
  const flow = useFlow({ screenId: 'summary', pass: 1 });
  const lineHeight = useLineHeight();

  const rows = summaryRows(loadCatalog(), session.caseFile, session.answers, session.extraPasses);

  return (
    <ScrollView contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl }}>
      <Text
        style={{
          fontSize: fontSize.xl,
          lineHeight: lineHeight(fontSize.xl, 1.25),
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}
      >
        {text('flow.summary.title')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          lineHeight: lineHeight(fontSize.md),
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        {text('flow.summary.subtitle')}
      </Text>

      {rows.map((row) => {
        const fertig = row.state === 'answered';
        const zustand = text(`common.summary_state.${row.state}`);
        const zaehlung =
          row.declared !== null && row.filled > 0
            ? text('common.pass', { current: row.filled, total: text(`common.count.${row.declared}`) })
            : null;

        return (
          <Pressable
            key={row.screenId}
            onPress={() => flow.goTo({ screenId: row.screenId, pass: 1 })}
            accessibilityRole="button"
            accessibilityLabel={`${text(`flow.${row.screenId}.summary.title`)}, ${zustand}`}
            style={({ pressed }) => ({
              minHeight: minTouchTarget,
              padding: spacing.md,
              marginBottom: spacing.sm,
              backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderLeftWidth: 3,
              borderLeftColor: fertig ? colors.success : colors.border,
              borderRadius: radius.md,
            })}
          >
            <Text
              style={{
                fontSize: fontSize.md,
                lineHeight: lineHeight(fontSize.md),
                color: colors.textPrimary,
              }}
            >
              {text(`flow.${row.screenId}.summary.title`)}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                lineHeight: lineHeight(fontSize.sm),
                color: fertig ? colors.success : colors.textSecondary,
              }}
            >
              {fertig ? (zaehlung ?? zustand) : `${zustand} — ${text(`flow.${row.screenId}.summary.empty`)}`}
            </Text>
          </Pressable>
        );
      })}

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button label={text('common.next')} onPress={flow.goNext} disabled={!flow.hasNext} />
        {flow.hasBack && <Button label={text('common.back')} variant="quiet" onPress={flow.goBack} />}
      </View>
    </ScrollView>
  );
}