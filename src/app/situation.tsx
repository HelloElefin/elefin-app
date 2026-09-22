/**
 * Familienstand und Kinder.
 *
 * Kein gewöhnlicher Frage-Screen: Die Antworten gehören in den Akten-Kopf,
 * nicht zu einem Eintrag. An diesen beiden Angaben hängt die gesetzliche
 * Erbfolge — und in Phase 3 wandern sie als Erstes mit ins Konto.
 */
import { ScrollView, Text, View } from 'react-native';

import { loadCatalog, type CatalogField } from '@/catalog';
import { colors, fontSize, screenPadding, spacing } from '@/design';
import type { Answer, ChildrenStatus, MaritalStatus } from '@/domain';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { useSession } from '@/state/session';
import { Button, Callout, Choice, Progress, useLineHeight, type ChoiceOption } from '@/ui';

export default function SituationScreen() {
  const { text, exists } = useText();
  const session = useSession();
  const flow = useFlow({ screenId: 'situation', pass: 1 });
  const lineHeight = useLineHeight();

  const screen = loadCatalog().screens.find((s) => s.id === 'situation');
  const field = (id: string): CatalogField | undefined => screen?.fields.find((f) => f.id === id);

  function optionsOf(fieldId: string): ChoiceOption[] {
    return (field(fieldId)?.options ?? []).map((o) => {
      const base = `option.case_profile.${fieldId}.${o.value}`;
      return {
        value: o.value,
        label: text(`${base}.label`),
        ...(exists(`${base}.hint`) ? { hint: text(`${base}.hint`) } : {}),
      };
    });
  }

  function selected(answer: Answer<string>): string | null {
    return answer.state === 'answered' ? answer.value : null;
  }

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
        {text('flow.situation.title')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          lineHeight: lineHeight(fontSize.md),
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        {text('flow.situation.subtitle')}
      </Text>

      <Text
        style={{
          fontSize: fontSize.sm,
          lineHeight: lineHeight(fontSize.sm),
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        }}
      >
        {text('question.case_profile.marital_status.label')}
      </Text>
      <Choice
        options={optionsOf('marital_status')}
        value={selected(session.caseFile.maritalStatus)}
        onSelect={(v) => session.setMaritalStatus({ state: 'answered', value: v as MaritalStatus })}
      />

      <View style={{ height: spacing.lg }} />

      <Text
        style={{
          fontSize: fontSize.sm,
          lineHeight: lineHeight(fontSize.sm),
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        }}
      >
        {text('question.case_profile.children_status.label')}
      </Text>
      <Choice
        options={optionsOf('children_status')}
        value={selected(session.caseFile.childrenStatus)}
        onSelect={(v) => session.setChildrenStatus({ state: 'answered', value: v as ChildrenStatus })}
      />

      <Callout title={text('flow.situation.note.title')} text={text('flow.situation.note.text')} />

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button label={text('common.next')} onPress={flow.goNext} />
        {flow.hasBack && <Button label={text('common.back')} variant="quiet" onPress={flow.goBack} />}
      </View>
    </ScrollView>
  );
}