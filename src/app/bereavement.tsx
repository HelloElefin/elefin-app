/**
 * Was in den ersten Stunden zu tun ist.
 *
 * Steht bewusst außerhalb des Fragenflusses: keine Fortschrittsanzeige, kein
 * Weiter, kein Katalogeintrag. Wer hierherkommt, hat gerade jemanden
 * verloren und braucht eine Liste, keinen Ablauf.
 *
 * Die Punkte sind Beispieltexte. Sie müssen vor der Testrunde inhaltlich
 * und juristisch geprüft werden — Fristen und Zuständigkeiten sind in
 * Österreich und Deutschland verschieden.
 */
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/design';
import { useText } from '@/i18n/dynamic';
import { Art, Button, Screen, useLineHeight } from '@/ui';

const SCHRITTE = ['step_1', 'step_2', 'step_3', 'step_4', 'step_5', 'step_6', 'step_7'];

export default function BereavementScreen() {
  const { text } = useText();
  const router = useRouter();
  const lineHeight = useLineHeight();

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Art id="checkliste" size="medium" />
      </View>

      <Text
        style={{
          fontSize: fontSize.xl,
          lineHeight: lineHeight(fontSize.xl, 1.25),
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}
      >
        {text('flow.bereavement.title')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          lineHeight: lineHeight(fontSize.md),
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        {text('flow.bereavement.subtitle')}
      </Text>

      {SCHRITTE.map((key, i) => (
        <View key={key} style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
          <Text
            style={{
              fontSize: fontSize.md,
              lineHeight: lineHeight(fontSize.md),
              color: colors.accent,
              minWidth: 20,
            }}
          >
            {i + 1}
          </Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fontSize.md,
                lineHeight: lineHeight(fontSize.md),
                color: colors.textPrimary,
              }}
            >
              {text(`flow.bereavement.${key}.title`)}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                lineHeight: lineHeight(fontSize.sm),
                color: colors.textSecondary,
              }}
            >
              {text(`flow.bereavement.${key}.text`)}
            </Text>
          </View>
        </View>
      ))}

      <View
        style={{
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.md,
          padding: spacing.md,
          marginTop: spacing.md,
        }}
      >
        <Text
          style={{
            fontSize: fontSize.sm,
            lineHeight: lineHeight(fontSize.sm),
            color: colors.textSecondary,
          }}
        >
          {text('flow.bereavement.note')}
        </Text>
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button label={text('common.back')} variant="quiet" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
