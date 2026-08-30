// TEMPORÄR — Vorschau der Design-Tokens.
// Wird gelöscht, sobald der erste echte Screen nach Spezifikation entsteht.
import { ScrollView, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing, screenPadding } from '@/design';

export default function TokenVorschau() {
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl }}
    >
      <Text
        style={{
          fontSize: fontSize.xl,
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        }}
      >
        Bildschirmtitel, 24 Punkt
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        Erklärtext in 17 Punkt. So sieht ein normaler Absatz aus, wenn er über
        mehr als eine Zeile geht und tatsächlich gelesen werden soll.
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: fontSize.lg, color: colors.textPrimary }}>
          Eine Karte
        </Text>
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            marginTop: spacing.xs,
          }}
        >
          Weiße Fläche auf warmem Hintergrund, mit Rahmen.
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.accent,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ fontSize: fontSize.md, color: colors.textOnAccent }}>
          Hauptknopf
        </Text>
      </View>

      {(
        [
          ['danger', colors.danger, colors.dangerSubtle],
          ['success', colors.success, colors.successSubtle],
          ['warning', colors.warning, colors.warningSubtle],
        ] as const
      ).map(([name, stark, zart]) => (
        <View
          key={name}
          style={{
            backgroundColor: zart,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
          }}
        >
          <Text style={{ fontSize: fontSize.sm, color: stark }}>
            {name} — Fehler E-4A7C
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}