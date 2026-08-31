// TEMPORÄR — Messwerkzeug für die Argon2id-Kosten.
// Wird gelöscht, sobald die Werte feststehen. Bewusst mit Text im Code:
// Dieser Bildschirm ist kein Teil der App, sondern ein Prüfwerkzeug.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { argon2idAsync } from '@noble/hashes/argon2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { colors, fontSize, radius, spacing, screenPadding } from '@/design';

/** Die Kostenstufen, die wir vergleichen. m = Arbeitsspeicher in KiB, t = Durchläufe. */
const STUFEN = [
  { name: 'A — 19 MiB, 2 Durchläufe', m: 19456, t: 2 },
  { name: 'B — 46 MiB, 1 Durchlauf', m: 47104, t: 1 },
  { name: 'C — 64 MiB, 3 Durchläufe', m: 65536, t: 3 },
  { name: 'D — 96 MiB, 3 Durchläufe', m: 98304, t: 3 },
] as const;

const TEST_PASSWORT = 'ein-realistisch-langes-passwort-2026';
const TEST_SALT = utf8ToBytes('0123456789abcdef'); // 16 Byte, fest für die Messung

export default function Messung() {
  const [ergebnisse, setErgebnisse] = useState<Record<string, string>>({});
  const [laeuft, setLaeuft] = useState<string | null>(null);
  const [fortschritt, setFortschritt] = useState(0);

  async function messen(stufe: (typeof STUFEN)[number]) {
    setLaeuft(stufe.name);
    setFortschritt(0);
    // Kurz warten, damit die Anzeige sich aktualisiert, bevor gerechnet wird.
    await new Promise((r) => setTimeout(r, 50));

    try {
      const start = Date.now();
      await argon2idAsync(utf8ToBytes(TEST_PASSWORT), TEST_SALT, {
        t: stufe.t,
        m: stufe.m,
        p: 1,
        dkLen: 32,
        asyncTick: 16, // gibt der Oberfläche Luft — so läuft es später auch echt
        onProgress: (p: number) => setFortschritt(p),
      });
      const dauer = Date.now() - start;
      setErgebnisse((alt) => ({ ...alt, [stufe.name]: `${dauer} ms` }));
    } catch (fehler) {
      setErgebnisse((alt) => ({
        ...alt,
        [stufe.name]: `Fehler: ${fehler instanceof Error ? fehler.message : String(fehler)}`,
      }));
    } finally {
      setLaeuft(null);
      setFortschritt(0);
    }
  }

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
        Argon2id-Messung
      </Text>
      <Text
        style={{
          fontSize: fontSize.sm,
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        Jede Stufe zweimal messen. Der erste Wert ist immer höher, weil die
        Rechenmaschine noch warmläuft. Der zweite Wert zählt.
      </Text>

      {STUFEN.map((stufe) => {
        const aktiv = laeuft === stufe.name;
        const gesperrt = laeuft !== null;

        return (
          <View key={stufe.name} style={{ marginBottom: spacing.md }}>
            <Pressable
              onPress={() => void messen(stufe)}
              disabled={gesperrt}
              style={{
                backgroundColor: gesperrt ? colors.surfaceMuted : colors.accent,
                borderRadius: radius.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                minHeight: 44,
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.md,
                  color: gesperrt ? colors.textSecondary : colors.textOnAccent,
                }}
              >
                {stufe.name}
              </Text>
            </Pressable>

            {aktiv && (
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                rechnet … {Math.round(fortschritt * 100)} %
              </Text>
            )}

            {ergebnisse[stufe.name] !== undefined && (
              <Text
                style={{
                  fontSize: fontSize.lg,
                  color: colors.textPrimary,
                  marginTop: spacing.xs,
                }}
              >
                {ergebnisse[stufe.name]}
              </Text>
            )}
          </View>
        );
      })}

      <View
        style={{
          backgroundColor: colors.warningSubtle,
          borderRadius: radius.md,
          padding: spacing.md,
          marginTop: spacing.md,
        }}
      >
        <Text style={{ fontSize: fontSize.sm, color: colors.warning }}>
          Stufe D braucht viel Arbeitsspeicher. Wenn die App dabei abstürzt, ist
          das ein Ergebnis und kein Fehler — dann ist D auf diesem Gerät nicht
          benutzbar.
        </Text>
      </View>
    </ScrollView>
  );
}