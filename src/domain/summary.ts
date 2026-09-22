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