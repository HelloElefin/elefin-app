// TEMPORÄR — Messwerkzeug für die scrypt-Kosten.
// Wird gelöscht, sobald die Werte feststehen.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { pbkdf2, scrypt } from 'react-native-quick-crypto';
import { colors, fontSize, radius, spacing, screenPadding } from '@/design';

/**
 * N = Kostenfaktor (Zweierpotenz, bestimmt Speicher und Rechenzeit)
 * r = Blockgröße, p = Parallelität — bleiben bei den Standardwerten.
 * Der Speicherbedarf ist ungefähr 128 * N * r Byte.
 */
const STUFEN = [
  { name: 'A — N=2^14 (16 MiB)', N: 16384 },
  { name: 'B — N=2^15 (32 MiB)', N: 32768 },
  { name: 'C — N=2^16 (64 MiB)', N: 65536 },
  { name: 'D — N=2^17 (128 MiB)', N: 131072 },
] as const;

const TEST_PASSWORT = 'ein-realistisch-langes-passwort-2026';
const TEST_SALT = 'salt-0123456789ab';

export default function Messung() {
  const [ergebnisse, setErgebnisse] = useState<Record<string, string>>({});
  const [laeuft, setLaeuft] = useState<string | null>(null);

  async function messen(name: string, arbeit: () => Promise<unknown>) {
    setLaeuft(name);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const start = Date.now();
      await arbeit();
      const dauer = Date.now() - start;
      setErgebnisse((alt) => ({ ...alt, [name]: `${dauer} ms` }));
    } catch (fehler) {
      setErgebnisse((alt) => ({
        ...alt,
        [name]: `Fehler: ${fehler instanceof Error ? fehler.message : String(fehler)}`,
      }));
    } finally {
      setLaeuft(null);
    }
  }

  function scryptMessen(stufe: (typeof STUFEN)[number]) {
    return messen(
      stufe.name,
      () =>
        new Promise((aufloesen, ablehnen) => {
          scrypt(
            TEST_PASSWORT,
            TEST_SALT,
            32,
            { N: stufe.N, r: 8, p: 1, maxmem: 512 * 1024 * 1024 },
            (fehler, ergebnis) => (fehler ? ablehnen(fehler) : aufloesen(ergebnis)),
          );
        }),
    );
  }

  /** Vergleichswert: PBKDF2 ist nicht speicherhart, zeigt aber, ob nativ gerechnet wird. */
  function pbkdf2Messen() {
    return messen(
      'Vergleich — PBKDF2, 600.000 Runden',
      () =>
        new Promise((aufloesen, ablehnen) => {
          pbkdf2(TEST_PASSWORT, TEST_SALT, 600000, 32, 'sha256', (fehler, ergebnis) =>
            fehler ? ablehnen(fehler) : aufloesen(ergebnis),
          );
        }),
    );
  }

  const gesperrt = laeuft !== null;

  function Knopf({ name, onPress }: { name: string; onPress: () => void }) {
    return (
      <View style={{ marginBottom: spacing.md }}>
        <Pressable
          onPress={onPress}
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
            {name}
          </Text>
        </Pressable>
        {laeuft === name && (
          <Text
            style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}
          >
            rechnet …
          </Text>
        )}
        {ergebnisse[name] !== undefined && (
          <Text
            style={{ fontSize: fontSize.lg, color: colors.textPrimary, marginTop: spacing.xs }}
          >
            {ergebnisse[name]}
          </Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl }}
    >
      <Text style={{ fontSize: fontSize.xl, color: colors.textPrimary, marginBottom: spacing.xs }}>
        scrypt-Messung
      </Text>
      <Text
        style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg }}
      >
        Jede Stufe zweimal messen, der zweite Wert zählt. Wenn hier Zahlen im
        dreistelligen Millisekundenbereich stehen, rechnet die App nativ.
      </Text>

      {STUFEN.map((stufe) => (
        <Knopf key={stufe.name} name={stufe.name} onPress={() => void scryptMessen(stufe)} />
      ))}

      <Knopf name="Vergleich — PBKDF2, 600.000 Runden" onPress={() => void pbkdf2Messen()} />
    </ScrollView>
  );
}