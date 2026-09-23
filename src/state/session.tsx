/**
 * Der Zustand des laufenden Gesprächs.
 *
 * Drei Dinge: der Akten-Kopf (Situation und Inventar), die Antworten und die
 * zusätzlich hinzugefügten Durchgänge. Alles andere — welcher Screen wann
 * kommt — rechnet src/domain daraus aus.
 *
 * Gesichert wird über src/state/storage.ts: im Browser in localStorage, auf
 * dem Handy vorerst gar nicht. In Phase 2 wird daraus die verschlüsselte
 * Ablage, ohne dass ein Screen etwas davon merkt.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  setAnswer as setAnswerIn,
  answerKey,
  type Answer,
  type Answers,
  type AnswerValue,
  type CaseFile,
  type Category,
  type ChildrenStatus,
  type ExtraPasses,
  type InventoryDeclaration,
  type MaritalStatus,
} from '@/domain';

import { clear as clearStorage, load, save, type SessionData } from './storage';

function emptyCaseFile(language: string): CaseFile {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    entryMode: 'planning',
    maritalStatus: { state: 'open' },
    childrenStatus: { state: 'open' },
    // Markt vorerst fest: Die Testrunde läuft in Österreich und Deutschland
    // mit denselben Texten. Die Wahl kommt, sobald es Marktinhalte gibt.
    market: 'at',
    language,
    inventory: {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Wie die Sitzung begonnen hat.
 *   fresh    nichts gespeichert, alles neu
 *   resumed  ein gespeicherter Stand wurde geladen
 *   expired  es gab einen Stand, er war älter als die Frist
 */
export type StartMode = 'fresh' | 'resumed' | 'expired';

type Session = {
  caseFile: CaseFile;
  answers: Answers;
  extraPasses: ExtraPasses;
  startMode: StartMode;
  /** Hat die Person überhaupt schon etwas eingetragen? */
  hasContent: boolean;
  setMaritalStatus: (answer: Answer<MaritalStatus>) => void;
  setChildrenStatus: (answer: Answer<ChildrenStatus>) => void;
  setInventory: (category: Category, answer: Answer<InventoryDeclaration>) => void;
  setAnswer: (category: Category, pass: number, fieldId: string, answer: Answer<AnswerValue>) => void;
  addPass: (screenId: string) => void;
  /** Alles verwerfen, auch im Speicher des Browsers. */
  deleteAll: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children, language = 'de' }: { children: ReactNode; language?: string }) {
  // Einmal beim Start laden. Die Funktionsform sorgt dafür, dass das bei
  // jedem weiteren Rendern nicht noch einmal passiert.
  const [start] = useState(() => load());

  const [caseFile, setCaseFile] = useState<CaseFile>(() =>
    start.kind === 'found' ? start.data.caseFile : emptyCaseFile(language),
  );
  const [answers, setAnswers] = useState<Answers>(() => (start.kind === 'found' ? start.data.answers : {}));
  const [extraPasses, setExtraPasses] = useState<ExtraPasses>(() =>
    start.kind === 'found' ? start.data.extraPasses : {},
  );
  const [startMode, setStartMode] = useState<StartMode>(
    start.kind === 'found' ? 'resumed' : start.kind === 'expired' ? 'expired' : 'fresh',
  );

  // Nach jeder Änderung sichern. Klein genug, dass das nicht bremst.
  useEffect(() => {
    const data: SessionData = { caseFile, answers, extraPasses };
    save(data);
  }, [caseFile, answers, extraPasses]);

  /** Jede Änderung am Akten-Kopf hält den Zeitstempel mit fest. */
  const changeCaseFile = useCallback((change: (c: CaseFile) => CaseFile) => {
    setCaseFile((current) => ({ ...change(current), updatedAt: new Date().toISOString() }));
  }, []);

  const hasContent =
    Object.keys(answers).length > 0 ||
    Object.keys(caseFile.inventory).length > 0 ||
    caseFile.maritalStatus.state !== 'open' ||
    caseFile.childrenStatus.state !== 'open';

  const value = useMemo<Session>(
    () => ({
      caseFile,
      answers,
      extraPasses,
      startMode,
      hasContent,

      setMaritalStatus: (answer) => changeCaseFile((c) => ({ ...c, maritalStatus: answer })),

      setChildrenStatus: (answer) => changeCaseFile((c) => ({ ...c, childrenStatus: answer })),

      setInventory: (category, answer) =>
        changeCaseFile((c) => ({ ...c, inventory: { ...c.inventory, [category]: answer } })),

      setAnswer: (category, pass, fieldId, answer) =>
        setAnswers((current) => setAnswerIn(current, answerKey(category, pass, fieldId), answer)),

      addPass: (screenId) =>
        setExtraPasses((current) => ({ ...current, [screenId]: (current[screenId] ?? 0) + 1 })),

      deleteAll: () => {
        clearStorage();
        setCaseFile(emptyCaseFile(language));
        setAnswers({});
        setExtraPasses({});
        setStartMode('fresh');
      },
    }),
    [caseFile, answers, extraPasses, startMode, hasContent, changeCaseFile, language],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession braucht einen SessionProvider darüber.');
  return session;
}