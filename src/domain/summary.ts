/**
 * Die Übersicht am Ende — eine Zeile je Thema.
 *
 * Liefert nur Daten. Welche Worte daraus werden („Steht fest", „Später
 * klären", „2 von 3 notiert"), entscheiden die Sprachdateien.
 */
import type { Catalog } from '@/catalog';

import { getAnswer, hasValue, answerKey, type Answers } from './answers';
import type { AnswerState } from './answer-state';
import type { Category } from './categories';
import type { CaseFile, DeclaredCount } from './case-file';
import { activeScreens, declaredFor, passesFor, passHasContent, type ExtraPasses } from './flow';

export type SummaryRow = {
  screenId: string;
  category: Category;
  /**
   * answered  es steht etwas da
   * unknown   gefragt, aber „Weiß ich gerade nicht"
   * open      noch nicht angesehen
   */
  state: AnswerState;
  /** Durchgänge mit mindestens einer Eintragung. */
  filled: number;
  /** Durchgänge insgesamt. */
  passes: number;
  /** Was im Inventar erklärt wurde — nur bei wiederholbaren Themen. */
  declared: DeclaredCount | null;
};

export function summaryRows(
  catalog: Catalog,
  caseFile: CaseFile,
  answers: Answers,
  extra: ExtraPasses = {},
): SummaryRow[] {
  const rows: SummaryRow[] = [];
  for (const screen of activeScreens(catalog, caseFile)) {
    if (screen.kind !== 'question' || !screen.category) continue;
    const category = screen.category;
    const passes = passesFor(screen, caseFile, extra);

    let hatAntwort = false;
    let hatWeissNicht = false;
    let filled = 0;
    for (let pass = 1; pass <= passes; pass++) {
      if (passHasContent(screen, pass, answers)) filled++;
      for (const f of screen.fields) {
        const a = getAnswer(answers, answerKey(category, pass, f.id));
        if (hasValue(a)) hatAntwort = true;
        else if (a.state === 'unknown') hatWeissNicht = true;
      }
    }

    rows.push({
      screenId: screen.id,
      category,
      state: hatAntwort ? 'answered' : hatWeissNicht ? 'unknown' : 'open',
      filled,
      passes,
      declared: screen.repeatable && screen.showIf ? (declaredFor(caseFile, screen.showIf)?.count ?? null) : null,
    });
  }
  return rows;
}

/**
 * Reihenfolge nach Dringlichkeit im Ernstfall, aus PM-02.
 *
 * Steuert, welche drei Themen im Abschlusssatz genannt werden, wenn jemand
 * mehr als drei beantwortet hat. Was in den ersten Stunden zählt, steht oben.
 * Kategorien, die hier fehlen, kommen zuletzt — in der Reihenfolge des
 * Katalogs.
 */
const URGENCY: readonly Category[] = [
  'funeral_wishes',
  'emergency_contacts',
  'home_access',
  'pets',
  'document_locations',
  'bank_accounts',
  'insurances',
  'power_of_attorney',
  'living_will',
  'last_will',
  'medical',
  'digital_accounts',
  'contracts',
  'real_estate',
  'vehicles',
  'employment_pension',
  'memberships',
];

/** Wie viele Bausteine der Abschlusssatz höchstens nennt. */
export const MAX_PHRASES = 3;

/**
 * Die Screens für den Abschlusssatz: beantwortet, nach Dringlichkeit
 * sortiert, höchstens drei.
 *
 * Nur 'answered' zählt. Ein „Weiß ich gerade nicht" ist kein Ergebnis, das
 * man jemandem als Erfolg vorhält.
 *
 * Mehrere Screens derselben Kategorie (Bestattung und Organspende) können
 * beide vorkommen — sie sind für Angehörige zwei verschiedene Auskünfte.
 */
export function phraseScreens(
  catalog: Catalog,
  caseFile: CaseFile,
  answers: Answers,
  extra: ExtraPasses = {},
): string[] {
  const rang = (c: Category) => {
    const i = URGENCY.indexOf(c);
    return i === -1 ? URGENCY.length : i;
  };

  return summaryRows(catalog, caseFile, answers, extra)
    .filter((r) => r.state === 'answered')
    .map((r, reihenfolge) => ({ ...r, reihenfolge }))
    .sort((a, b) => rang(a.category) - rang(b.category) || a.reihenfolge - b.reihenfolge)
    .slice(0, MAX_PHRASES)
    .map((r) => r.screenId);
}

/**
 * Eine Aufzählung auf Deutsch: „A", „A und B", „A, B und C".
 * Das Wort für „und" kommt von außen, damit hier kein Text steht.
 */
export function joinGerman(parts: string[], und: string): string {
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0] as string;
  return `${parts.slice(0, -1).join(', ')} ${und} ${parts.at(-1)}`;
}