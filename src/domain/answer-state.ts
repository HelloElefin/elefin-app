/**
 * Antwortzustände — ein Begriff für alle Stellen, an denen gefragt wird.
 *
 * Jede Antwort ist in genau einem von drei Zuständen:
 *   open      nie gefragt
 *   unknown   gefragt, die Person wusste es nicht („Weiß ich gerade nicht")
 *   answered  beantwortet, mit Wert
 *
 * Der Unterschied zwischen „nie gefragt" und „wusste es nicht" lässt sich
 * nachträglich nicht rekonstruieren. Er steuert später die Erinnerungen und
 * die Statusanzeige auf der Übersicht. Deshalb wird er von Anfang an
 * festgehalten.
 *
 * Ein Feld, zu dem nichts gespeichert ist, gilt als 'open'. Gespeichert wird
 * also nur, was davon abweicht.
 *
 * Die Zustandswerte sind Daten: Sie landen später verschlüsselt im Inhalt
 * und werden nie umbenannt.
 */

/** Eine Antwort mit Wert vom Typ T — oder ohne Wert, wenn nicht beantwortet. */
export type Answer<T> =
  | { state: 'open' }
  | { state: 'unknown' }
  | { state: 'answered'; value: T };

/** Nur der Zustand: 'open' | 'unknown' | 'answered'. */
export type AnswerState = Answer<unknown>['state'];