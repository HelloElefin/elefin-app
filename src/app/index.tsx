/**
 * Der Startscreen.
 *
 * Erster Eindruck und zugleich das Versprechen, worauf man sich einlässt.
 * Ist schon etwas gespeichert, wird daraus ein Wiedereinstieg.
 *
 * Oben rechts der Nebeneingang für den Todesfall. Dort, wo Menschen Hilfe
 * suchen — und nicht unten, wo er wie „Abmelden" aussah.
 */
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { loadCatalog } from '@/catalog';
import { colors, fontSize, radius, spacing } from '@/design';
import { openSteps } from '@/domain';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { useSession } from '@/state/session';
import { MAX_AGE_DAYS } from '@/state/storage';
import { Art, Button, Chip, DangerButton, Screen, Wordmark, useLineHeight } from '@/ui';

export default function StartScreen() {
  const { text } = useText();
  const session = useSession();
  const flow = useFlow({ screenId: 'start', pass: 1 });
  const router = useRouter();
  const lineHeight = useLineHeight();

  const weitermachen = session.hasContent;

  /** Zurück an die erste offene Stelle — oder zur Übersicht, wenn alles steht. */
  function resume() {
    const offen = openSteps(loadCatalog(), session.caseFile, session.answers, session.extraPasses);
    flow.goTo(offen[0] ?? { screenId: 'summary', pass: 1 });
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
        <Chip
          label={text('flow.start.bereavement.chip')}
          accessibilityLabel={text('flow.start.bereavement.question')}
          dot={colors.warning}
          onPress={() => router.push('/bereavement')}
        />
      </View>

      <View style={{ gap: spacing.lg }}>
        <View style={{ alignItems: 'center' }}>
          <Art id="schublade" size="large" />
        </View>

        <View>
          <Text
            style={{
              fontSize: fontSize.xxl,
              lineHeight: lineHeight(fontSize.xxl, 1.25),
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: spacing.sm,
            }}
          >
            {text('flow.start.title')}
          </Text>
          <Text
            style={{
              fontSize: fontSize.md,
              lineHeight: lineHeight(fontSize.md),
              color: colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {text('flow.start.subtitle')}
          </Text>
        </View>

        {session.startMode === 'expired' && (
          <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                lineHeight: lineHeight(fontSize.sm),
                color: colors.textSecondary,
              }}
            >
              {text('flow.start.expired', { days: MAX_AGE_DAYS })}
            </Text>
          </View>
        )}

        {!weitermachen && (
          <View style={{ gap: spacing.sm }}>
            {['flow.start.point_1', 'flow.start.point_2', 'flow.start.point_3'].map((key) => (
              <View key={key} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Text style={{ fontSize: fontSize.md, color: colors.accent }}>✓</Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: fontSize.md,
                    lineHeight: lineHeight(fontSize.md),
                    color: colors.textPrimary,
                  }}
                >
                  {text(key)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {weitermachen ? (
          <View style={{ gap: spacing.sm }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                lineHeight: lineHeight(fontSize.sm),
                color: colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {text('flow.start.resume_hint', { days: MAX_AGE_DAYS })}
            </Text>
            <Button label={text('flow.start.resume')} onPress={resume} />
            <DangerButton
              label={text('common.delete_all')}
              question={text('common.delete_question')}
              confirmLabel={text('common.delete_confirm')}
              cancelLabel={text('common.delete_cancel')}
              onConfirm={session.deleteAll}
            />
          </View>
        ) : (
          <Button label={text('flow.start.next')} onPress={flow.goNext} />
        )}
      </View>
    </Screen>
  );
}