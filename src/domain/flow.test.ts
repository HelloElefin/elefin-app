/**
 * Tests der Flussmaschine — gegen den echten Katalog, damit die Fälle
 * realistisch sind, und gegen erfundene Miniaturkataloge für die Sonderfälle.
 */
import { describe, expect, it } from 'vitest';

import { loadCatalog, parseCatalog } from '@/catalog';

import { answerKey, setAnswer, type Answers } from './answers';
import type { Category } from './categories';
import type { CaseFile, DeclaredCount } from './case-file';
import {
  activeScreens,
  nextStep,
  openSteps,
  passesFor,
  previousStep,
  progress,
  steps,
} from './flow';

const catalog = loadCatalog();

/** Ein Akten-Kopf, bei dem die genannten Kategorien zutreffen. */
function caseFile(inventar: Partial<Record<Category, DeclaredCount | true>> = {}): CaseFile {
  const inventory: CaseFile['inventory'] = {};
  for (const [cat, count] of Object.entries(inventar)) {
    inventory[cat as Category] = {
      state: 'answered',
      value: count === true ? { applies: true } : { applies: true, count: count as DeclaredCount },
    };
  }
  return {
    schemaVersion: 1,
    entryMode: 'planning',
    maritalStatus: { state: 'open' },
    childrenStatus: { state: 'open' },
    market: 'at',
    language: 'de',
    inventory,
    createdAt: '2026-09-21T10:00:00.000Z',
    updatedAt: '2026-09-21T10:00:00.000Z',
  };
}

const mini = parseCatalog({
  schemaVersion: 1,
  screens: [
    { id: 'start', kind: 'frame', block: 'intro', repeatable: false, fields: [] },
    {
      id: 'contact',
      kind: 'question',
      block: 'b',
      category: 'emergency_contacts',
      repeatable: true,
      fields: [{ id: 'name', type: 'text', allowUnknown: true, inDisclosure: false }],
    },
    {
      id: 'account',
      kind: 'question',
      block: 'b',
      category: 'bank_accounts',
      showIf: 'bank_accounts',
      repeatable: true,
      fields: [{ id: 'institution', type: 'text', allowUnknown: true, inDisclosure: false }],
    },
  ],
});

describe('Fluss: welche Screens', () => {
  it('zeigt ohne Inventar nur das, was immer kommt', () => {
    const aktiv = activeScreens(catalog, caseFile()).map((s) => s.id);
    expect(aktiv).toContain('start');
    expect(aktiv).toContain('emergency-contact');
    expect(aktiv).toContain('home-access');
    expect(aktiv).not.toContain('bank-account');
    expect(aktiv).not.toContain('pet');
  });

  it('zeigt angetippte Kategorien', () => {
    const aktiv = activeScreens(catalog, caseFile({ bank_accounts: 1, pets: 1 })).map((s) => s.id);
    expect(aktiv).toContain('bank-account');
    expect(aktiv).toContain('pet');
    expect(aktiv).not.toContain('real-estate');
  });

  it('zeigt nichts Bedingtes, wenn applies false ist', () => {
    const cf = caseFile();
    cf.inventory.pets = { state: 'answered', value: { applies: false } };
    expect(activeScreens(catalog, cf).map((s) => s.id)).not.toContain('pet');
  });
});

describe('Fluss: Durchgänge', () => {
  const screen = (id: string) => catalog.screens.find((s) => s.id === id)!;

  it('wiederholt so oft, wie im Inventar angegeben', () => {
    expect(passesFor(screen('bank-account'), caseFile({ bank_accounts: 3 }))).toBe(3);
    expect(passesFor(screen('bank-account'), caseFile({ bank_accounts: 1 }))).toBe(1);
  });

  it('macht aus „mehr als 3" drei und aus „weiß nicht" einen', () => {
    expect(passesFor(screen('bank-account'), caseFile({ bank_accounts: 'more' }))).toBe(3);
    expect(passesFor(screen('bank-account'), caseFile({ bank_accounts: 'unknown' }))).toBe(1);
  });

  it('zählt zusätzliche Durchgänge dazu', () => {
    expect(passesFor(screen('bank-account'), caseFile({ bank_accounts: 2 }), { 'bank-account': 2 })).toBe(4);
    expect(passesFor(screen('emergency-contact'), caseFile(), { 'emergency-contact': 1 })).toBe(2);
  });

  it('wiederholt nicht, was nicht wiederholbar ist', () => {
    expect(passesFor(screen('funeral'), caseFile(), { funeral: 5 })).toBe(1);
  });
});

describe('Fluss: Schritte und Bewegung', () => {
  it('fächert Wiederholungen in der Katalogreihenfolge auf', () => {
    const alle = steps(mini, caseFile({ bank_accounts: 2 }));
    expect(alle).toEqual([
      { screenId: 'start', pass: 1 },
      { screenId: 'contact', pass: 1 },
      { screenId: 'account', pass: 1 },
      { screenId: 'account', pass: 2 },
    ]);
  });

  it('geht vor und zurück und kennt die Enden', () => {
    const alle = steps(mini, caseFile({ bank_accounts: 1 }));
    expect(nextStep(alle, { screenId: 'start', pass: 1 })).toEqual({ screenId: 'contact', pass: 1 });
    expect(previousStep(alle, { screenId: 'contact', pass: 1 })).toEqual({ screenId: 'start', pass: 1 });
    expect(previousStep(alle, { screenId: 'start', pass: 1 })).toBe(null);
    expect(nextStep(alle, { screenId: 'account', pass: 1 })).toBe(null);
  });

  it('zählt den Fortschritt 1-basiert', () => {
    const alle = steps(mini, caseFile({ bank_accounts: 2 }));
    expect(progress(alle, { screenId: 'account', pass: 2 })).toEqual({ position: 4, total: 4 });
  });
});

describe('Fluss: Wiedereinstieg', () => {
  it('nennt nur Schritte, in denen noch gar nichts steht', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('emergency_contacts', 1, 'name'), {
      state: 'answered',
      value: 'Maria',
    });
    const offen = openSteps(mini, caseFile({ bank_accounts: 1 }), answers);
    expect(offen).toEqual([{ screenId: 'account', pass: 1 }]);
  });

  it('zählt „Weiß ich gerade nicht" als beantwortet — die Frage war ja da', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('bank_accounts', 1, 'institution'), { state: 'unknown' });
    const offen = openSteps(mini, caseFile({ bank_accounts: 1 }), answers).map((s) => s.screenId);
    expect(offen).not.toContain('account');
  });

  it('bringt nach einem Nachtrag im Inventar genau die neuen Schritte', () => {
    let answers: Answers = {};
    for (const s of steps(catalog, caseFile({ bank_accounts: 1 }))) {
      const screen = catalog.screens.find((x) => x.id === s.screenId)!;
      if (screen.kind !== 'question' || !screen.category) continue;
      for (const f of screen.fields) {
        answers = setAnswer(answers, answerKey(screen.category, s.pass, f.id), { state: 'answered', value: 'x' });
      }
    }
    const offen = openSteps(catalog, caseFile({ bank_accounts: 1, pets: 2 }), answers);
    expect(offen).toEqual([
      { screenId: 'pet', pass: 1 },
      { screenId: 'pet', pass: 2 },
    ]);
  });
});