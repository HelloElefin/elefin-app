/**
 * Den Stand des Gesprächs im Browser sichern.
 *
 * Nur Phase 1, und bewusst schlicht: Klartext in localStorage, kein
 * Verschlüsseln, keine Datenbank. In Phase 2 wird daraus IndexedDB mit
 * Verschlüsselung, und diese Datei fällt weg — deshalb kennt sie auch
 * niemand außer src/state.
 *
 * Zwei Dinge sind trotzdem wichtig:
 *
 * ABLAUF. Nach sieben Tagen wird ein gespeicherter Stand verworfen. Safari
 * auf dem iPhone räumt Browserspeicher ohnehin nach etwa dieser Zeit auf,
 * aber eben nur manchmal und nur dort. Wir verlassen uns nicht darauf,
 * sondern löschen selbst — und sagen es den Testnutzern.
 *
 * VERSION. Ändert sich der Katalog, passen alte Antworten womöglich nicht
 * mehr zu den Screens. Dann ist Wegwerfen richtig und Weiterverwenden
 * falsch. Bei jeder Änderung am Katalog die VERSION erhöhen.
 */
import type { Answers, CaseFile, ExtraPasses } from '@/domain';

const KEY = 'elefin.session';
const VERSION = 1;

/** Nach so vielen Tagen ohne Nutzung wird der Stand verworfen. */
export const MAX_AGE_DAYS = 7;

export type SessionData = {
  caseFile: CaseFile;
  answers: Answers;
  extraPasses: ExtraPasses;
};

export type LoadResult =
  | { kind: 'none' }
  | { kind: 'expired' }
  | { kind: 'found'; data: SessionData };

/**
 * Der Speicher des Browsers — oder null.
 *
 * Auf dem Handy gibt es ihn gar nicht, und im privaten Modus mancher Browser
 * wirft schon das Schreiben einen Fehler. Beides ist kein Grund abzustürzen:
 * Dann läuft die App eben ohne Speichern.
 */
function browserStore(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    localStorage.setItem('elefin.probe', '1');
    localStorage.removeItem('elefin.probe');
    return localStorage;
  } catch {
    return null;
  }
}

export function save(data: SessionData): void {
  const store = browserStore();
  if (!store) return;
  try {
    store.setItem(KEY, JSON.stringify({ version: VERSION, savedAt: new Date().toISOString(), ...data }));
  } catch {
    // Speicher voll oder gesperrt. Die Sitzung läuft trotzdem weiter.
  }
}

export function load(): LoadResult {
  const store = browserStore();
  if (!store) return { kind: 'none' };

  let raw: string | null = null;
  try {
    raw = store.getItem(KEY);
  } catch {
    return { kind: 'none' };
  }
  if (!raw) return { kind: 'none' };

  try {
    const parsed = JSON.parse(raw) as {
      version?: number;
      savedAt?: string;
    } & Partial<SessionData>;

    if (parsed.version !== VERSION || !parsed.caseFile || !parsed.answers) {
      clear();
      return { kind: 'none' };
    }

    const alter = Date.now() - new Date(parsed.savedAt ?? 0).getTime();
    if (alter > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
      clear();
      return { kind: 'expired' };
    }

    return {
      kind: 'found',
      data: {
        caseFile: parsed.caseFile,
        answers: parsed.answers,
        extraPasses: parsed.extraPasses ?? {},
      },
    };
  } catch {
    // Unlesbarer Stand. Wegwerfen ist besser als halb laden.
    clear();
    return { kind: 'none' };
  }
}

export function clear(): void {
  const store = browserStore();
  if (!store) return;
  try {
    store.removeItem(KEY);
  } catch {
    // nichts zu tun
  }
}