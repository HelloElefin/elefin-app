/**
 * Die Übersicht — aus einer Liste wird ein Ergebnis.
 *
 * Oben die Zeichnung und ein Satz, der benennt, was jetzt festgehalten ist.
 * Erst darunter die Liste. Der Satz nennt höchstens drei Themen, sortiert
 * nach Dringlichkeit — nicht nach der Reihenfolge, in der gefragt wurde.
 *
 * Offene Punkte sind kein Vorwurf, sondern der nächste Schritt. Deshalb
 * drei Zustände statt zwei, und jede Zeile führt zurück zu ihrem Screen.
 */
import { Pressable, ScrollView, Text, View } from 'react-native';

import { loadCatalog } from '@/catalog';
import { colors, fontSize, minTouchTarget, radius, screenPadding, spacing } from '@/design';
import { joinGerman, phraseScreens, summaryRows } from '@/domain';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { useSession } from '@/state/session';
import { Art, Button, useLineHeight } from '@/ui';

export default function SummaryScreen() {
  const { text, exists } = useText();
  const session = useSession();
  const flow = useFlow({ screenId: 'summary', pass: 1 });
  const lineHeight = useLineHeight();

  const catalog = loadCatalog();
  const rows = summaryRows(catalog, session.caseFile, session.answers, session.extraPasses);

  const bausteine = phraseScreens(catalog, session.caseFile, session.answers, session.extraPasses)
    .map((id) => `flow.${id}.phrase`)
    .filter(exists)
    .map((key) => text(key));

  const satz =
    bausteine.length > 0
      ? text('flow.summary.sentence', { list: joinGerman(bausteine, text('common.list_and')) })
      : text('flow.summary.fallback');

  return (
    <ScrollView contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl }}>
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Art id="checkliste" size="medium" />
      </View>

      <Text
        style={{
          fontSize: fontSize.xl,
          lineHeight: lineHeight(fontSize.xl, 1.25),
          color: colors.textPrimary,
          marginBottom: spacing.sm,
          textAlign: 'center',
        }}
      >
        {text('flow.summary.title')}
      </Text>

      <Text
        style={{
          fontSize: fontSize.md,
          lineHeight: lineHeight(fontSize.md),
          color: colors.textPrimary,
          marginBottom: spacing.sm,
          textAlign: 'center',
        }}
      >
        {satz}
      </Text>

      <Text
        style={{
          fontSize: fontSize.sm,
          lineHeight: lineHeight(fontSize.sm),
          color: colors.textSecondary,
          marginBottom: spacing.lg,
          textAlign: 'center',
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