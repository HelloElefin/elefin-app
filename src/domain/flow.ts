/**
 * Die Flussmaschine — welcher Screen kommt wann, und wie oft.
 *
 * Reine Funktionen: Katalog, Akten-Kopf und Antworten rein, Schritte raus.
 * Kein Zugriff auf Speicher, keine Oberfläche. Deshalb lässt sich hier jeder
 * Sonderfall prüfen, ohne ein Gerät anzufassen — und die Screens bleiben
 * dumm (Regel 11).
 */
import type { Catalog, CatalogScreen } from '@/catalog';

import { answerKey, getAnswer, hasValue, type Answers } from './answers';
import type { Category } from './categories';
import type { CaseFile, DeclaredCount, InventoryDeclaration } from './case-file';

/** Ein Schritt im Gespräch: ein Screen in einem bestimmten Durchgang (1-basiert). */
export type Step = { screenId: string; pass: number };

/**
 * Zusätzliche Durchgänge je Screen, entstanden durch „Weitere hinzufügen".
 * Liegt außerhalb des Katalogs, weil es der Nutzer bestimmt, nicht wir.
 */
export type ExtraPasses = Record<string, number>;

/** Was im Inventar zu einer Kategorie steht — oder null, wenn nichts. */
export function declaredFor(caseFile: CaseFile, category: Category): InventoryDeclaration | null {
  const entry = caseFile.inventory[category];
  return entry && entry.state === 'answered' ? entry.value : null;
}

/** Trifft die Kategorie laut Inventar zu? */
export function applies(caseFile: CaseFile, category: Category): boolean {
  return declaredFor(caseFile, category)?.applies === true;
}

/** Aus „mehr als 3" oder „weiß nicht" eine Zahl machen, mit der man rechnen kann. */
function countOf(count: DeclaredCount | undefined): number {
  if (count === undefined || count === 'unknown') return 1;
  if (count === 'more') return 3; // drei Durchgänge, weitere über „Weitere hinzufügen"
  return count;
}

/**
 * Die Screens, die für diese Person überhaupt vorkommen.
 * Rahmenscreens und Frage-Screens ohne Bedingung immer; die übrigen nur,
 * wenn die Kategorie im Inventar angetippt wurde.
 */
export function activeScreens(catalog: Catalog, caseFile: CaseFile): CatalogScreen[] {
  return catalog.screens.filter((s) => !s.showIf || applies(caseFile, s.showIf));
}

/** Wie oft dieser Screen hintereinander kommt. */
export function passesFor(screen: CatalogScreen, caseFile: CaseFile, extra: ExtraPasses = {}): number {
  if (!screen.repeatable) return 1;
  const zusaetzlich = Math.max(0, extra[screen.id] ?? 0);
  const erklaert = screen.showIf ? countOf(declaredFor(caseFile, screen.showIf)?.count) : 1;
  return erklaert + zusaetzlich;
}

/** Alle Schritte in der Reihenfolge des Katalogs, Wiederholungen aufgefächert. */
export function steps(catalog: Catalog, caseFile: CaseFile, extra: ExtraPasses = {}): Step[] {
  const out: Step[] = [];
  for (const screen of activeScreens(catalog, caseFile)) {
    const n = passesFor(screen, caseFile, extra);
    for (let pass = 1; pass <= n; pass++) out.push({ screenId: screen.id, pass });
  }
  return out;
}

/** Die Position eines Schritts in der Liste, oder -1. */
export function stepIndex(all: Step[], step: Step): number {
  return all.findIndex((s) => s.screenId === step.screenId && s.pass === step.pass);
}

export function nextStep(all: Step[], current: Step): Step | null {
  const i = stepIndex(all, current);
  return i >= 0 && i + 1 < all.length ? (all[i + 1] as Step) : null;
}

export function previousStep(all: Step[], current: Step): Step | null {
  const i = stepIndex(all, current);
  return i > 0 ? (all[i - 1] as Step) : null;
}

/** Für die Fortschrittsanzeige: „Bereich 7 von 23". Position ist 1-basiert. */
export function progress(all: Step[], current: Step): { position: number; total: number } {
  const i = stepIndex(all, current);
  return { position: i >= 0 ? i + 1 : 0, total: all.length };
}

/**
 * Schritte, in denen noch gar nichts steht — weder eine Antwort noch ein
 * „Weiß ich gerade nicht".
 *
 * Damit funktioniert der Wiedereinstieg: Wer nach Wochen im Inventar
 * „Immobilie" nachkreuzt, bekommt genau die neuen Schritte und läuft nicht
 * noch einmal durch alles.
 */
export function openSteps(
  catalog: Catalog,
  caseFile: CaseFile,
  answers: Answers,
  extra: ExtraPasses = {},
): Step[] {
  const byId = new Map(catalog.screens.map((s) => [s.id, s]));
  return steps(catalog, caseFile, extra).filter((step) => {
    const screen = byId.get(step.screenId);
    if (!screen || screen.kind !== 'question') return false;
    const category = screen.category;
    if (!category) return false;
    return screen.fields.every(
      (f) => getAnswer(answers, answerKey(category, step.pass, f.id)).state === 'open',
    );
  });
}

/** Wurde in diesem Durchgang irgendetwas eingetragen? */
export function passHasContent(screen: CatalogScreen, pass: number, answers: Answers): boolean {
  const category = screen.category;
  if (!category) return false;
  return screen.fields.some((f) => hasValue(getAnswer(answers, answerKey(category, pass, f.id))));
}