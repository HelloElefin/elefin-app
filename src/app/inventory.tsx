/**
 * Das Inventar — was es überhaupt gibt, und wie viel davon.
 *
 * Der wichtigste Screen der ganzen App: Er entscheidet, welche Fragen danach
 * kommen. Und die erklärte Anzahl ist für Angehörige die wertvollste Angabe
 * überhaupt — sie verrät, dass es ein drittes Konto gibt, auch wenn nichts
 * dazu eingetragen wurde.
 */
import { ScrollView, Text, View } from 'react-native';

import { loadCatalog } from '@/catalog';
import { colors, fontSize, screenPadding, spacing } from '@/design';
import { declaredFor, isCategory, type Category, type DeclaredCount } from '@/domain';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { useSession } from '@/state/session';
import { Button, Choice, MultiChoice, Progress, useLineHeight, type ChoiceOption } from '@/ui';

const COUNTS: DeclaredCount[] = [1, 2, 3, 'more', 'unknown'];

export default function InventoryScreen() {
  const { text, exists } = useText();
  const session = useSession();
  const flow = useFlow({ screenId: 'inventory', pass: 1 });
  const lineHeight = useLineHeight();

  const catalog = loadCatalog();
  const screen = catalog.screens.find((s) => s.id === 'inventory');
  const field = screen?.fields.find((f) => f.id === 'inventory');

  /** Bei welchen Kategorien lohnt die Frage nach der Anzahl? */
  const wiederholbar = new Set(
    catalog.screens.filter((s) => s.repeatable && s.showIf).map((s) => s.showIf as Category),
  );

  const optionen: ChoiceOption[] = (field?.options ?? []).map((o) => {
    const base = `option.case_profile.inventory.${o.value}`;
    return {
      value: o.value,
      label: text(`${base}.label`),
      ...(exists(`${base}.hint`) ? { hint: text(`${base}.hint`) } : {}),
    };
  });

  const angetippt = (field?.options ?? [])
    .map((o) => o.value)
    .filter((v) => isCategory(v) && declaredFor(session.caseFile, v)?.applies === true);

  function toggle(value: string) {
    if (!isCategory(value)) return;
    const anGerade = declaredFor(session.caseFile, value)?.applies === true;
    session.setInventory(
      value,
      anGerade
        ? { state: 'answered', value: { applies: false } }
        : { state: 'answered', value: { applies: true } },
    );
  }

  function setCount(category: Category, count: DeclaredCount) {
    session.setInventory(category, { state: 'answered', value: { applies: true, count } });
  }

  function countOptions(): ChoiceOption[] {
    return COUNTS.map((c) => ({ value: String(c), label: text(`common.count.${c}`) }));
  }

  function currentCount(category: Category): string | null {
    const count = declaredFor(session.caseFile, category)?.count;
    return count === undefined ? null : String(count);
  }

  function parseCount(value: string): DeclaredCount {
    if (value === 'more' || value === 'unknown') return value;
    return Number(value) as DeclaredCount;
  }

  const mitAnzahl = angetippt.filter((v) => isCategory(v) && wiederholbar.has(v));

  return (
    <ScrollView contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl }}>
      <Progress
        position={flow.position}
        total={flow.total}
        label={text('common.progress', { current: flow.position, total: flow.total })}
      />

      <Text
        style={{
          fontSize: fontSize.xl,
          lineHeight: lineHeight(fontSize.xl, 1.25),
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}
      >
        {text('flow.inventory.title')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          lineHeight: lineHeight(fontSize.md),
          color: colors.textSecondary,
          marginBottom: spacing.xs,
        }}
      >
        {text('flow.inventory.subtitle')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.xs,
          lineHeight: lineHeight(fontSize.xs),
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        {text('common.multi_hint')}
      </Text>

      <MultiChoice options={optionen} values={angetippt} onToggle={toggle} />

      {mitAnzahl.length > 0 && (
        <View style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              lineHeight: lineHeight(fontSize.lg, 1.25),
              color: colors.textPrimary,
              marginBottom: spacing.md,
            }}
          >
            {text('common.count_question')}
          </Text>

          {mitAnzahl.map((value) => {
            if (!isCategory(value)) return null;
            return (
              <View key={value} style={{ marginBottom: spacing.lg }}>
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    lineHeight: lineHeight(fontSize.sm),
                    color: colors.textSecondary,
                    marginBottom: spacing.sm,
                  }}
                >
                  {text(`option.case_profile.inventory.${value}.label`)}
                </Text>
                <Choice
                  options={countOptions()}
                  value={currentCount(value)}
                  onSelect={(c) => setCount(value, parseCount(c))}
                />
              </View>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button label={text('common.next')} onPress={flow.goNext} />
        {flow.hasBack && <Button label={text('common.back')} variant="quiet" onPress={flow.goBack} />}
      </View>
    </ScrollView>
  );
}