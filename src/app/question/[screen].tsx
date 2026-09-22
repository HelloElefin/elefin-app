/**
 * Der generische Frage-Screen.
 *
 * Ein Screen für alle Fragen der App. Was er zeigt, steht im Katalog; wie es
 * heißt, in den Sprachdateien; was danach kommt, rechnet die Flussmaschine
 * aus. Eine neue Frage entsteht deshalb durch einen Katalogeintrag und nicht
 * durch eine neue Datei (Regel 14).
 */
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { loadCatalog, type CatalogField } from '@/catalog';
import { colors, fontSize, screenPadding, spacing } from '@/design';
import {
  getAnswer,
  answerKey,
  passesFor,
  type Answer,
  type AnswerValue,
  type Category,
} from '@/domain';
import { useText } from '@/i18n/dynamic';
import { useFlow } from '@/state/flow-navigation';
import { useSession } from '@/state/session';
import {
  Button,
  Callout,
  Choice,
  Disclosure,
  Field,
  MultiChoice,
  Progress,
  useLineHeight,
  type ChoiceOption,
} from '@/ui';

export default function QuestionScreen() {
  const params = useLocalSearchParams<{ screen?: string; pass?: string }>();
  const screenId = params.screen ?? '';
  const pass = Math.max(1, Number(params.pass ?? '1') || 1);

  const catalog = loadCatalog();
  const screen = catalog.screens.find((s) => s.id === screenId);

  const session = useSession();
  const { text, exists } = useText();
  const flow = useFlow({ screenId, pass });
  const lineHeight = useLineHeight();

  // Kann vorkommen, wenn jemand eine alte Adresse offen hat.
  if (!screen || !screen.category) {
    return (
      <View style={{ flex: 1, padding: screenPadding, justifyContent: 'center' }}>
        <Text style={{ fontSize: fontSize.md, color: colors.textSecondary }}>{text('common.unknown')}</Text>
      </View>
    );
  }

    // Festhalten, dass screen hier sicher vorhanden ist — innerhalb von
  // skipUnknown weiß TypeScript das sonst nicht mehr.
  const current = screen;
  const category: Category = screen.category;
  const passes = passesFor(screen, session.caseFile, session.extraPasses);
  const sichtbar = screen.fields.filter((f) => !f.inDisclosure);
  const imAufklapper = screen.fields.filter((f) => f.inDisclosure);

  function answerOf(field: CatalogField): Answer<AnswerValue> {
    return getAnswer(session.answers, answerKey(category, pass, field.id));
  }

  function setAnswer(field: CatalogField, answer: Answer<AnswerValue>) {
    session.setAnswer(category, pass, field.id, answer);
  }

  function optionsOf(field: CatalogField): ChoiceOption[] {
    return (field.options ?? []).map((o) => {
      const base = `option.${category}.${field.id}.${o.value}`;
      return {
        value: o.value,
        label: text(`${base}.label`),
        ...(exists(`${base}.hint`) ? { hint: text(`${base}.hint`) } : {}),
      };
    });
  }

  /** Alles, was noch offen ist, als „weiß nicht" festhalten und weitergehen. */
  function skipUnknown() {
    for (const field of current.fields) {
      if (answerOf(field).state === 'open') setAnswer(field, { state: 'unknown' });
    }
    flow.goNext();
  }

  function renderField(field: CatalogField) {
    const answer = answerOf(field);
    const labelKey = `question.${category}.${field.id}.label`;
    const label = exists(labelKey) ? text(labelKey) : '';
    const placeholderKey = `question.${category}.${field.id}.placeholder`;

    if (field.type === 'text') {
      return (
        <Field
          key={field.id}
          label={label}
          value={answer.state === 'answered' ? String(answer.value) : ''}
          onChangeText={(t) =>
            setAnswer(field, t.trim() === '' ? { state: 'open' } : { state: 'answered', value: t })
          }
          placeholder={exists(placeholderKey) ? text(placeholderKey) : undefined}
          multiline={field.id.includes('location') || field.id.includes('notes')}
        />
      );
    }

    const gewaehlt = answer.state === 'answered' ? answer.value : null;

    return (
      <View key={field.id} style={{ marginBottom: spacing.md }}>
        {label !== '' && (
          <Text
            style={{
              fontSize: fontSize.sm,
              lineHeight: lineHeight(fontSize.sm),
              color: colors.textSecondary,
              marginBottom: spacing.sm,
            }}
          >
            {label}
          </Text>
        )}

        {field.type === 'choice' ? (
          <Choice
            options={optionsOf(field)}
            value={typeof gewaehlt === 'string' ? gewaehlt : null}
            onSelect={(v) => setAnswer(field, { state: 'answered', value: v })}
          />
        ) : (
          <MultiChoice
            options={optionsOf(field)}
            values={Array.isArray(gewaehlt) ? gewaehlt : []}
            onToggle={(v) => {
              const jetzt = Array.isArray(gewaehlt) ? gewaehlt : [];
              const neu = jetzt.includes(v) ? jetzt.filter((x) => x !== v) : [...jetzt, v];
              setAnswer(field, neu.length === 0 ? { state: 'open' } : { state: 'answered', value: neu });
            }}
          />
        )}
      </View>
    );
  }

  const kannUeberspringen = screen.fields.some((f) => f.allowUnknown);

  return (
    <ScrollView
      contentContainerStyle={{ padding: screenPadding, paddingBottom: spacing.xxl }}
      keyboardShouldPersistTaps="handled"
    >
      <Progress
        position={flow.position}
        total={flow.total}
        label={text('common.progress', { current: flow.position, total: flow.total })}
      />

      {exists(`block.${screen.block}.title`) && (
        <Text
          style={{
            fontSize: fontSize.xs,
            lineHeight: lineHeight(fontSize.xs),
            letterSpacing: 1,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
          }}
        >
          {text(`block.${screen.block}.title`).toUpperCase()}
        </Text>
      )}

      <Text
        style={{
          fontSize: fontSize.xl,
          lineHeight: lineHeight(fontSize.xl, 1.25),
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}
      >
        {text(`flow.${screen.id}.title`)}
      </Text>

      {passes > 1 && (
        <Text
          style={{
            fontSize: fontSize.sm,
            lineHeight: lineHeight(fontSize.sm),
            color: colors.accent,
            marginBottom: spacing.sm,
          }}
        >
          {text('common.pass', { current: pass, total: passes })}
        </Text>
      )}

      {exists(`flow.${screen.id}.subtitle`) && (
        <Text
          style={{
            fontSize: fontSize.md,
            lineHeight: lineHeight(fontSize.md),
            color: colors.textSecondary,
            marginBottom: spacing.lg,
          }}
        >
          {text(`flow.${screen.id}.subtitle`)}
        </Text>
      )}

      {screen.trustNote && (
        <Callout title={text('common.trust.title')} text={text('common.trust.text')} />
      )}

      <View style={{ marginTop: spacing.lg }}>{sichtbar.map(renderField)}</View>

      {imAufklapper.length > 0 && (
        <Disclosure
          title={text(`flow.${screen.id}.disclosure.title`)}
          note={text('common.disclosure_later')}
        >
          {imAufklapper.map(renderField)}
        </Disclosure>
      )}

      {exists(`flow.${screen.id}.note.title`) && (
        <Callout
          title={text(`flow.${screen.id}.note.title`)}
          text={text(`flow.${screen.id}.note.text`)}
        />
      )}

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button
          label={exists(`flow.${screen.id}.next`) ? text(`flow.${screen.id}.next`) : text('common.next')}
          onPress={flow.goNext}
          disabled={!flow.hasNext}
        />

        {screen.repeatable && pass === passes && (
          <Button
            label={text('common.add_another')}
            variant="quiet"
            onPress={() => {
              session.addPass(screen.id);
              flow.goTo({ screenId: screen.id, pass: passes + 1 });
            }}
          />
        )}

        {kannUeberspringen && (
          <Button label={text('common.skip_unknown')} variant="quiet" onPress={skipUnknown} />
        )}

        {flow.hasBack && <Button label={text('common.back')} variant="quiet" onPress={flow.goBack} />}
      </View>
    </ScrollView>
  );
}