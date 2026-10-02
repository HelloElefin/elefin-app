/**
 * Hinter dem Knopf „Weiter zur Speicherung bei Elefin".
 *
 * Das Schließfach gibt es erst in Phase 3. Dieser Screen sagt das ehrlich,
 * statt so zu tun, als ginge es weiter — und bietet das Blatt als Weg bis
 * dahin an.
 *
 * Steht außerhalb des Fragenflusses, wie die Todesfall-Liste.
 */
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { loadCatalog } from '@/catalog';
import { colors, fontSize, spacing } from '@/design';
import { useText } from '@/i18n/dynamic';
import { buildPrintHtml } from '@/print/document';
import { canPrint, printHtml } from '@/print/print';
import { useSession } from '@/state/session';
import { Art, Button, Screen, useLineHeight } from '@/ui';

export default function AccountScreen() {
  const { text, exists } = useText();
  const session = useSession();
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

  return (
    <Screen centered>
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
        {text('flow.account.title')}
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
        {text('flow.account.text')}
      </Text>

      <View style={{ gap: spacing.sm }}>
        {canPrint() && <Button label={text('print.action')} onPress={drucken} />}
        <Button label={text('common.back')} variant="quiet" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}