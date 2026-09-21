/**
 * S-10 — Bankverbindung erfassen.
 *
 * Erster echter Screen. Legt einen Eintrag lokal verschlüsselt an und zeigt,
 * wie viele bereits erfasst sind.
 *
 * Bewusst noch ohne die Schrittkette drumherum — die entsteht, wenn die
 * Screen-Spezifikationen für den lokalen Ablauf stehen. Die Fortschrittsleiste
 * zeigt vorerst einen festen Wert.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { loadEntries, createEntry } from '@/data';
import { BankAccountContent, validateIban, type IbanReason } from '@/domain';
import { colors, fontSize, radius, spacing, screenPadding } from '@/design';
import { Field } from '@/ui/Field';
import { Button } from '@/ui/Button';

const SCHRITT = 3;
const SCHRITTE_GESAMT = 5;

export default function BankverbindungScreen() {
  const { t } = useTranslation();

  const [bezeichnung, setBezeichnung] = useState('');
  const [institut, setInstitut] = useState('');
  const [iban, setIban] = useState('');
  const [kontoinhaber, setKontoinhaber] = useState('');

  const [aufgeklappt, setAufgeklappt] = useState(false);
  const [ibanGrund, setIbanGrund] = useState<Exclude<IbanReason, 'leer'> | null>(
    null,
  );
  const [anzahl, setAnzahl] = useState(0);
  const [fehlerCode, setFehlerCode] = useState<string | null>(null);

  useEffect(() => {
    void anzahlAktualisieren();
  }, []);

  async function anzahlAktualisieren() {
    try {
      const vorhandene = await loadEntries('bank_accounts', BankAccountContent);
      setAnzahl(vorhandene.length);
    } catch (fehler) {
      setFehlerCode(codeVon(fehler));
    }
  }

  /** Prüft die IBAN, sobald das Feld verlassen wird — nicht bei jedem Zeichen. */
  function ibanPruefenBeimVerlassen() {
    const ergebnis = validateIban(iban);
    // 'leer' ist kein Fehler: Die IBAN ist ein optionales Feld.
    if (ergebnis.valid || ergebnis.reason === 'leer') {
      setIbanGrund(null);
      return;
    }
    setIbanGrund(ergebnis.reason);
  }

  async function speichern() {
    setFehlerCode(null);
    try {
      await createEntry({
        category: 'bank_accounts',
        content: {
          bezeichnung: bezeichnung.trim(),
          ...(institut.trim() !== '' && { institut: institut.trim() }),
          ...(iban.trim() !== '' && { iban: iban.trim() }),
          ...(kontoinhaber.trim() !== '' && { kontoinhaber: kontoinhaber.trim() }),
        },
      });

      setBezeichnung('');
      setInstitut('');
      setIban('');
      setKontoinhaber('');
      setIbanGrund(null);
      setAufgeklappt(false);
      await anzahlAktualisieren();
    } catch (fehler) {
      setFehlerCode(codeVon(fehler));
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm }}>
        {Array.from({ length: SCHRITTE_GESAMT }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: radius.full,
              backgroundColor: i < SCHRITT ? colors.accent : colors.border,
            }}
          />
        ))}
      </View>

      <Text
        style={{
          fontSize: fontSize.xs,
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        {t('step.counter', { aktuell: SCHRITT, gesamt: SCHRITTE_GESAMT })}
      </Text>

      <Text
        style={{
          fontSize: fontSize.lg,
          color: colors.textPrimary,
          marginBottom: spacing.md,
        }}
      >
        {t('bankAccount.title')}
      </Text>

      <View
        style={{
          backgroundColor: colors.accentSubtle,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.accentPressed,
            lineHeight: fontSize.sm * 1.45,
          }}
        >
          {t('bankAccount.why')}
        </Text>
      </View>

      <Field
        label={t('bankAccount.bezeichnung')}
        value={bezeichnung}
        onChangeText={setBezeichnung}
        placeholder={t('bankAccount.bezeichnungPlatzhalter')}
      />

      <Field
        label={t('bankAccount.institut')}
        value={institut}
        onChangeText={setInstitut}
        placeholder={t('bankAccount.institutPlatzhalter')}
      />

      <Pressable
        onPress={() => setAufgeklappt(!aufgeklappt)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingVertical: spacing.md,
          minHeight: 44,
          marginBottom: spacing.sm,
        }}
      >
        <Text style={{ fontSize: fontSize.sm, color: colors.accent }}>
          {t('bankAccount.weitereAngaben')}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.accent }}>
          {aufgeklappt ? '−' : '+'}
        </Text>
      </Pressable>

      {aufgeklappt && (
        <>
          <Field
            label={t('bankAccount.iban')}
            value={iban}
            onChangeText={setIban}
            onBlur={ibanPruefenBeimVerlassen}
            placeholder={t('bankAccount.ibanPlatzhalter')}
            hint={ibanGrund !== null ? t(`iban.${ibanGrund}`) : undefined}
            hintType={ibanGrund !== null ? 'warning' : 'neutral'}
          />
          <Field
            label={t('bankAccount.kontoinhaber')}
            value={kontoinhaber}
            onChangeText={setKontoinhaber}
            placeholder={t('bankAccount.kontoinhaberPlatzhalter')}
          />
        </>
      )}

      <View style={{ marginTop: spacing.md }}>
        <Button
          label={t('action.save')}
          onPress={() => void speichern()}
          disabled={bezeichnung.trim() === ''}
        />
      </View>

      {fehlerCode !== null && (
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.danger,
            marginTop: spacing.md,
            textAlign: 'center',
          }}
        >
          {t('state.errorCode', { code: fehlerCode })}
        </Text>
      )}

      {anzahl > 0 && (
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            marginTop: spacing.lg,
            textAlign: 'center',
          }}
        >
          {t('bankAccount.gespeichert', { count: anzahl })}
        </Text>
      )}
    </ScrollView>
  );
}

/** Zieht den Fehlercode heraus, ohne je die Meldung anzuzeigen. */
function codeVon(fehler: unknown): string {
  if (
    typeof fehler === 'object' &&
    fehler !== null &&
    'code' in fehler &&
    typeof fehler.code === 'string'
  ) {
    return fehler.code;
  }
  return 'E-DB99';
}