/**
 * Der Abschluss: Blatt drucken oder Konto.
 *
 * Das Konto beginnt erst in Phase 3, der Knopf bleibt deshalb aus. Das Blatt
 * geht im Browser über den Druckdialog — daraus wird auf dem Handy ein PDF.
 */
import { ScrollView, Text, View } from 'react-native';

import { loadCatalog } from '@/catalog';
import { colors, fontSize, radius, screenPadding, spacing } from '@/design';
import { useText } from '@/i18n/dynamic';
import { buildPrintHtml } from '@/print/document';
import { canPrint, printHtml } from '@/print/print';
import { useFlow } from '@/state/flow-navigation';
import { useSession } from '@/state/session';
import { Button, Callout, DangerButton, useLineHeight } from '@/ui';

export default function FinishScreen() {
  const { text, exists } = useText();
  const session = useSession();
  const flow = useFlow({ screenId: 'finish', pass: 1 });
  const lineHeight = useLineHeight();

  function drucken() {
    printHtml(
      buildPrintHtml({
        catalog: loadCatalog(),
        caseFile: session.caseFile,
        answers: session.answers,
        extraPasses: session.extraPasses,
        text,
        exists,
        now: new Date(),
      }),
    );
  }

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

      <View
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
          {text('flow.finish.pdf.title')}
        </Text>
        <Text
          style={{
            fontSize: fontSize.sm,
            lineHeight: lineHeight(fontSize.sm),
            color: colors.textSecondary,
            marginBottom: spacing.md,
          }}
        >
          {canPrint() ? text('flow.finish.pdf.hint') : text('print.only_browser')}
        </Text>
        <Button label={text('print.action')} onPress={drucken} disabled={!canPrint()} />
      </View>

      <View
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
          {text('flow.finish.account.title')}
        </Text>
        <Text
          style={{
            fontSize: fontSize.sm,
            lineHeight: lineHeight(fontSize.sm),
            color: colors.textSecondary,
            marginBottom: spacing.md,
          }}
        >
          {text('flow.finish.account.hint')}
        </Text>
        <Button label={text('flow.finish.account.title')} variant="quiet" disabled onPress={() => {}} />
      </View>

      <Callout title={text('flow.finish.note.title')} text={text('flow.finish.note.text')} tone="warning" />

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        {flow.hasBack && <Button label={text('common.back')} variant="quiet" onPress={flow.goBack} />}
        <DangerButton
          label={text('common.delete_all')}
          question={text('common.delete_question')}
          confirmLabel={text('common.delete_confirm')}
          cancelLabel={text('common.delete_cancel')}
          onConfirm={session.deleteAll}
        />
      </View>
    </ScrollView>
  );
}