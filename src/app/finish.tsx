/**
 * Der Abschluss: der Weg ins Schließfach.
 *
 * Das Blatt zum Ausdrucken bleibt erreichbar, aber als kleiner Knopf oben
 * rechts — es ist ein Zwischenschritt, nicht das Ziel. Der Screen selbst
 * zeigt, was das Schließfach von Elefin mehr kann als ein Blatt Papier, und
 * was danach kommt.
 *
 * Der Hauptknopf führt in Phase 1 auf einen ehrlichen Hinweis, dass das
 * Schließfach in Arbeit ist. In der Testrunde zeigt sich daran, wer es
 * haben will.
 */
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { loadCatalog } from '@/catalog';
import { colors, fontSize, radius, spacing } from '@/design';
import { useText } from '@/i18n/dynamic';
import { buildPrintHtml } from '@/print/document';
import { canPrint, printHtml } from '@/print/print';
import { useFlow } from '@/state/flow-navigation';
import { useSession } from '@/state/session';
import { Art, Button, Chip, DangerButton, Screen, Wordmark, useLineHeight } from '@/ui';

const VORTEILE: { key: string; icon: string }[] = [
  { key: 'family', icon: 'menschen' },
  { key: 'online', icon: 'wolke' },
  { key: 'history', icon: 'verlauf' },
];

const GEPLANT: { key: string; icon: string }[] = [
  { key: 'living_will', icon: 'fueller' },
  { key: 'last_will', icon: 'fueller' },
  { key: 'documents', icon: 'ordner' },
];

export default function FinishScreen() {
  const { text, exists } = useText();
  const session = useSession();
  const flow = useFlow({ screenId: 'finish', pass: 1 });
  const router = useRouter();
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

  function zeile(key: string, icon: string, bereich: 'benefits' | 'planned') {
    return (
      <View key={key} style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Art id={icon} size="symbol" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.md,
              lineHeight: lineHeight(fontSize.md),
              color: colors.textPrimary,
            }}
          >
            {text(`flow.finish.${bereich}.${key}.title`)}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              lineHeight: lineHeight(fontSize.sm),
              color: colors.textSecondary,
            }}
          >
            {text(`flow.finish.${bereich}.${key}.text`)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
          marginBottom: spacing.xl,
        }}
      >
        <Wordmark />
        {canPrint() && (
          <Chip
            label={text('flow.finish.pdf_chip')}
            accessibilityLabel={text('print.action')}
            icon="zettel"
            onPress={drucken}
          />
        )}
      </View>

      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Art id="schliessfach" size="medium" />
      </View>

      <Text
        style={{
          fontSize: fontSize.xl,
          lineHeight: lineHeight(fontSize.xl, 1.25),
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {text('flow.finish.title')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          lineHeight: lineHeight(fontSize.md),
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xl,
        }}
      >
        {text('flow.finish.subtitle')}
      </Text>

      <Text
        style={{
          fontSize: fontSize.xs,
          lineHeight: lineHeight(fontSize.xs),
          letterSpacing: 1,
          color: colors.textSecondary,
          marginBottom: spacing.md,
        }}
      >
        {text('flow.finish.benefits.heading').toUpperCase()}
      </Text>
      {VORTEILE.map((v) => zeile(v.key, v.icon, 'benefits'))}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md }}>
        <Text
          style={{
            fontSize: fontSize.xs,
            lineHeight: lineHeight(fontSize.xs),
            letterSpacing: 1,
            color: colors.textSecondary,
          }}
        >
          {text('flow.finish.planned.heading').toUpperCase()}
        </Text>
        <Text
          style={{
            fontSize: fontSize.xs,
            lineHeight: lineHeight(fontSize.xs),
            color: colors.warning,
            backgroundColor: colors.warningSubtle,
            borderRadius: radius.full,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
          }}
        >
          {text('common.coming_soon')}
        </Text>
      </View>
      {GEPLANT.map((g) => zeile(g.key, g.icon, 'planned'))}

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button label={text('flow.finish.cta')} onPress={() => router.push('/account')} />
        {flow.hasBack && <Button label={text('common.back')} variant="quiet" onPress={flow.goBack} />}
        <DangerButton
          label={text('common.delete_all')}
          question={text('common.delete_question')}
          confirmLabel={text('common.delete_confirm')}
          cancelLabel={text('common.delete_cancel')}
          onConfirm={session.deleteAll}
        />
      </View>
    </Screen>
  );
}