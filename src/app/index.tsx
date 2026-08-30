// TEMPORÄR — Vorschau der Design-Tokens und der Textausgabe.
// Wird gelöscht, sobald der erste echte Screen nach Spezifikation entsteht.
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fontSize, radius, spacing, screenPadding } from '@/design';

export default function Vorschau() {
  // t ist die Funktion, die aus einem Schlüssel den fertigen Text macht.
  const { t, i18n } = useTranslation();

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
        {t('preview.title')}
      </Text>

      <Text
        style={{
          fontSize: fontSize.md,
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        {t('preview.body')}
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
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
          Aktive Sprache: {i18n.language}
        </Text>
        {/* Mehrzahlformen: i18next wählt anhand von count automatisch. */}
        <Text
          style={{
            fontSize: fontSize.md,
            color: colors.textPrimary,
            marginTop: spacing.xs,
          }}
        >
          {t('preview.entryCount', { count: 1 })} / {t('preview.entryCount', { count: 5 })}
        </Text>
        <Text
          style={{
            fontSize: fontSize.md,
            color: colors.textPrimary,
            marginTop: spacing.xs,
          }}
        >
          {t('state.errorCode', { code: 'E-4A7C' })}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.accent,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: fontSize.md, color: colors.textOnAccent }}>
          {t('action.continue')}
        </Text>
      </View>
    </ScrollView>
  );
}