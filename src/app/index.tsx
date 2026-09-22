/**
 * Der Startscreen.
 *
 * Erster Eindruck und zugleich das Versprechen, worauf man sich einlässt:
 * keine Unterlagen nötig, keine Passwörter, nichts verlässt das Gerät.
 */
import { ScrollView, Text, View } from 'react-native';

import { colors, fontSize, screenPadding, spacing } from '@/design';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { Button, useLineHeight } from '@/ui';

export default function StartScreen() {
  const { text } = useText();
  const flow = useFlow({ screenId: 'start', pass: 1 });
  const lineHeight = useLineHeight();

  return (
    <ScrollView contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl, flexGrow: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text
          style={{
            fontSize: fontSize.xxl,
            lineHeight: lineHeight(fontSize.xxl, 1.25),
            color: colors.textPrimary,
            marginBottom: spacing.md,
          }}
        >
          {text('flow.start.title')}
        </Text>

        <Text
          style={{
            fontSize: fontSize.md,
            lineHeight: lineHeight(fontSize.md),
            color: colors.textSecondary,
            marginBottom: spacing.xl,
          }}
        >
          {text('flow.start.subtitle')}
        </Text>

        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
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

        <Button label={text('flow.start.next')} onPress={flow.goNext} />

        {/*
          Die Ecke „Ist gerade jemand gestorben?" aus dem Klickdummy fehlt hier
          bewusst. Der Todesfall-Einstieg ist für den MVP geparkt, und ein Link,
          der nirgends hinführt, wäre genau an dieser Stelle das falsche
          Versprechen. Die Texte bleiben in der Sprachdatei stehen.
        */}
      </View>
    </ScrollView>
  );
}