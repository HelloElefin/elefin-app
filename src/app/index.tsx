/**
 * Der Startscreen.
 *
 * Erster Eindruck und zugleich das Versprechen, worauf man sich einlässt.
 * Ist schon etwas gespeichert, wird daraus ein Wiedereinstieg.
 *
 * Unten, abgetrennt, die Ecke für den Ernstfall. Bewusst kein eigener
 * Entscheidungsscreen davor: Fast jeder kommt hier an, um vorzusorgen, und
 * müsste sonst einen Schritt für eine Minderheit mitgehen.
 */
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { loadCatalog } from '@/catalog';
import { colors, fontSize, minTouchTarget, radius, screenPadding, spacing } from '@/design';
import { openSteps } from '@/domain';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { useSession } from '@/state/session';
import { MAX_AGE_DAYS } from '@/state/storage';
import { Art, Button, DangerButton, Wordmark, useLineHeight } from '@/ui';

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
    <ScrollView contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xl, flexGrow: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
        <Wordmark centered />

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

      {/* Der Nebeneingang. Kein eigener Screen davor, aber auch nicht versteckt. */}
      <View
        style={{
          marginTop: spacing.xl,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: fontSize.sm,
            lineHeight: lineHeight(fontSize.sm),
            color: colors.textSecondary,
          }}
        >
          {text('flow.start.bereavement.question')}
        </Text>
        <Pressable
          onPress={() => router.push('/bereavement')}
          accessibilityRole="link"
          style={{ minHeight: minTouchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm }}
        >
          <Text
            style={{
              fontSize: fontSize.md,
              lineHeight: lineHeight(fontSize.md),
              color: colors.accent,
              textDecorationLine: 'underline',
            }}
          >
            {text('flow.start.bereavement.link')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}