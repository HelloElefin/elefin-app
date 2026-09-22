/** Tests der Übersicht: drei Zustände und die Zählung „2 von 3". */
import { describe, expect, it } from 'vitest';

import { parseCatalog } from '@/catalog';

import { answerKey, setAnswer, type Answers } from './answers';
import type { Category } from './categories';
import type { CaseFile, DeclaredCount } from './case-file';
import { summaryRows } from './summary';

const mini = parseCatalog({
  schemaVersion: 1,
  screens: [
    { id: 'summary', kind: 'frame', block: 'done', repeatable: false, fields: [] },
    {
      id: 'account',
      kind: 'question',
      block: 'b',
      category: 'bank_accounts',
      showIf: 'bank_accounts',
      repeatable: true,
      fields: [
        { id: 'institution', type: 'text', allowUnknown: true, inDisclosure: false },
        { id: 'purpose', type: 'text', allowUnknown: true, inDisclosure: true },
      ],
    },
    {
      id: 'pet',
      kind: 'question',
      block: 'b',
      category: 'pets',
      showIf: 'pets',
      repeatable: true,
      fields: [{ id: 'animal', type: 'text', allowUnknown: true, inDisclosure: false }],
    },
  ],
});

function caseFile(inventar: Partial<Record<Category, DeclaredCount>>): CaseFile {
  const inventory: CaseFile['inventory'] = {};
  for (const [cat, count] of Object.entries(inventar)) {
    inventory[cat as Category] = { state: 'answered', value: { applies: true, count: count as DeclaredCount } };
  }
  return {
    schemaVersion: 1,
    entryMode: 'planning',
    maritalStatus: { state: 'open' },
    childrenStatus: { state: 'open' },
    market: 'de',
    language: 'de',
    inventory,
    createdAt: '2026-09-21T10:00:00.000Z',
    updatedAt: '2026-09-21T10:00:00.000Z',
  };
}

describe('Übersicht', () => {
  it('führt nur auf, was für diese Person vorkommt', () => {
    const rows = summaryRows(mini, caseFile({ bank_accounts: 1 }), {});
    expect(rows.map((r) => r.screenId)).toEqual(['account']);
  });

  it('kennt die drei Zustände', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('bank_accounts', 1, 'institution'), { state: 'answered', value: 'Erste Bank' });
    answers = setAnswer(answers, answerKey('pets', 1, 'animal'), { state: 'unknown' });
    const rows = summaryRows(mini, caseFile({ bank_accounts: 1, pets: 1 }), answers);
    expect(rows.find((r) => r.screenId === 'account')?.state).toBe('answered');
    expect(rows.find((r) => r.screenId === 'pet')?.state).toBe('unknown');

    const leer = summaryRows(mini, caseFile({ pets: 1 }), {});
    expect(leer[0]?.state).toBe('open');
  });

  it('zählt ausgefüllte Durchgänge gegen die erklärte Anzahl', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('bank_accounts', 1, 'institution'), { state: 'answered', value: 'Erste Bank' });
    answers = setAnswer(answers, answerKey('bank_accounts', 3, 'institution'), { state: 'answered', value: 'Raiffeisen' });
    const row = summaryRows(mini, caseFile({ bank_accounts: 3 }), answers)[0];
    expect(row?.filled).toBe(2);
    expect(row?.passes).toBe(3);
    expect(row?.declared).toBe(3);
  });

  it('wertet leere Eingaben nicht als Antwort', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('pets', 1, 'animal'), { state: 'answered', value: '   ' });
    const row = summaryRows(mini, caseFile({ pets: 1 }), answers)[0];
    expect(row?.filled).toBe(0);
    expect(row?.state).toBe('open');
  });
});