/**
 * Antworten — was jemand zu den Fragen eingetragen hat.
 *
 * Eine Antwort gehört nicht zu einem Screen, sondern zu einem OBJEKT:
 * Kategorie plus Durchgang. Das zweite Konto ist bank_accounts, Durchgang 2.
 * Zwei Screens derselben Kategorie schreiben in dasselbe Objekt — Bestattung
 * und Organspende ergeben zusammen einen Eintrag funeral_wishes. Das geht,
 * weil Feld-IDs innerhalb einer Kategorie eindeutig sind (geprüft in
 * src/catalog/catalog.test.ts).
 *
 * Der Grund für diesen Zuschnitt liegt in Phase 3: Dort ist genau ein solches
 * Objekt eine verschlüsselte Zeile in der Datenbank.
 *
 * Was NICHT hierher gehört: Familienstand, Kinder und das Inventar. Die
 * steuern den Fluss und stehen im Akten-Kopf (case-file.ts).
 */
import type { Answer } from './answer-state';
import type { Category } from './categories';

/** Ein Textfeld liefert Text, eine Mehrfachauswahl eine Liste von Werten. */
export type AnswerValue = string | string[];

/** Alle Antworten, abgelegt unter "<kategorie>#<durchgang>.<feld>". */
export type Answers = Record<string, Answer<AnswerValue>>;

/** Der Schlüssel einer Antwort, z. B. "bank_accounts#2.institution". */
export function answerKey(category: Category, pass: number, fieldId: string): string {
  return `${category}#${pass}.${fieldId}`;
}

/** Eine Antwort holen. Steht nichts da, wurde nie gefragt. */
export function getAnswer(answers: Answers, key: string): Answer<AnswerValue> {
  return answers[key] ?? { state: 'open' };
}

/**
 * Eine Antwort setzen. Gibt neue Antworten zurück, ändert die alten nicht —
 * so kann die Oberfläche zuverlässig erkennen, dass sich etwas geändert hat.
 * 'open' wird nicht gespeichert: Fehlen ist dasselbe wie nie gefragt.
 */
export function setAnswer(answers: Answers, key: string, answer: Answer<AnswerValue>): Answers {
  const next = { ...answers };
  if (answer.state === 'open') delete next[key];
  else next[key] = answer;
  return next;
}

/** Hat jemand hier wirklich etwas eingetragen? Leere Eingaben zählen nicht. */
export function hasValue(answer: Answer<AnswerValue>): boolean {
  if (answer.state !== 'answered') return false;
  const v = answer.value;
  return Array.isArray(v) ? v.length > 0 : v.trim() !== '';
}