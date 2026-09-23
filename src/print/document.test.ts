/** Tests des Blatts: Inhalt, offene Punkte, und dass Eingaben kein HTML werden. */
import { describe, expect, it } from 'vitest';

import { loadCatalog } from '@/catalog';
import { answerKey, setAnswer, type Answers, type CaseFile, type Category, type DeclaredCount } from '@/domain';

import { buildPrintHtml, type PrintInput } from './document';

function caseFile(inventar: Partial<Record<Category, DeclaredCount>> = {}): CaseFile {
  const inventory: CaseFile['inventory'] = {};
  for (const [cat, count] of Object.entries(inventar)) {
    inventory[cat as Category] = { state: 'answered', value: { applies: true, count: count as DeclaredCount } };
  }
  return {
    schemaVersion: 1,
    entryMode: 'planning',
    maritalStatus: { state: 'open' },
    childrenStatus: { state: 'open' },
    market: 'at',
    language: 'de',
    inventory,
    createdAt: '2026-09-23T08:00:00.000Z',
    updatedAt: '2026-09-23T08:00:00.000Z',
  };
}

/** Texte hier als Schlüssel selbst, damit der Test nicht an Formulierungen hängt. */
function input(answers: Answers, inventar: Partial<Record<Category, DeclaredCount>> = {}): PrintInput {
  return {
    catalog: loadCatalog(),
    caseFile: caseFile(inventar),
    answers,
    extraPasses: {},
    text: (key, vars) => (vars ? `${key}(${Object.values(vars).join('/')})` : key),
    exists: () => true,
    now: new Date('2026-09-23T10:00:00.000Z'),
  };
}

describe('Blatt zum Ausdrucken', () => {
  it('nennt jedes Thema, das für diese Person vorkommt', () => {
    const html = buildPrintHtml(input({}, { pets: 1 }));
    expect(html).toContain('flow.pet.summary.title');
    expect(html).not.toContain('flow.bank-account.summary.title');
  });

  it('schreibt Antworten auf das Blatt', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('pets', 1, 'animal'), { state: 'answered', value: 'Katze, Mimi' });
    expect(buildPrintHtml(input(answers, { pets: 1 }))).toContain('Katze, Mimi');
  });

  it('vermerkt, was noch fehlt', () => {
    const html = buildPrintHtml(input({}, { pets: 1 }));
    expect(html).toContain('print.missing');
  });

  it('zählt ausgefüllte gegen erklärte Durchgänge', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('bank_accounts', 1, 'institution'), {
      state: 'answered',
      value: 'Erste Bank',
    });
    const html = buildPrintHtml(input(answers, { bank_accounts: 3 }));
    expect(html).toContain('print.count(1/');
  });

  it('macht aus „weiß nicht" einen sichtbaren Vermerk', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('pets', 1, 'animal'), { state: 'unknown' });
    expect(buildPrintHtml(input(answers, { pets: 1 }))).toContain('print.unknown');
  });

  it('lässt Eingaben niemals als HTML wirken', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('pets', 1, 'animal'), {
      state: 'answered',
      value: '<script>böse()</script>',
    });
    const html = buildPrintHtml(input(answers, { pets: 1 }));
    expect(html).not.toContain('<script>böse');
    expect(html).toContain('&lt;script&gt;');
  });

  it('stellt Notfallkontakt und Unterlagen nach oben, und zwar nur einmal', () => {
    let answers: Answers = {};
    answers = setAnswer(answers, answerKey('emergency_contacts', 1, 'name'), {
      state: 'answered',
      value: 'Maria Musterfrau',
    });
    answers = setAnswer(answers, answerKey('pets', 1, 'animal'), { state: 'answered', value: 'Katze' });
    const html = buildPrintHtml(input(answers, { pets: 1 }));
    expect(html.indexOf('Maria Musterfrau') < html.indexOf('Katze')).toBe(true);
    expect(html.split('Maria Musterfrau').length - 1).toBe(1);
  });
});