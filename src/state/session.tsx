/**
 * Der Zustand des laufenden Gesprächs.
 *
 * Drei Dinge: der Akten-Kopf (Situation und Inventar), die Antworten und die
 * zusätzlich hinzugefügten Durchgänge. Alles andere — welcher Screen wann
 * kommt — rechnet src/domain daraus aus.
 *
 * In Phase 1 lebt das nur im Arbeitsspeicher: Ein Neuladen der Seite setzt
 * alles zurück. Das Speichern kommt in Schritt 8 und hängt sich genau hier
 * ein, ohne dass ein Screen davon etwas merkt.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

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

type Session = {
  caseFile: CaseFile;
  answers: Answers;
  extraPasses: ExtraPasses;
  setMaritalStatus: (answer: Answer<MaritalStatus>) => void;
  setChildrenStatus: (answer: Answer<ChildrenStatus>) => void;
  setInventory: (category: Category, answer: Answer<InventoryDeclaration>) => void;
  setAnswer: (category: Category, pass: number, fieldId: string, answer: Answer<AnswerValue>) => void;
  addPass: (screenId: string) => void;
  reset: () => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children, language = 'de' }: { children: ReactNode; language?: string }) {
  const [caseFile, setCaseFile] = useState<CaseFile>(() => emptyCaseFile(language));
  const [answers, setAnswers] = useState<Answers>({});
  const [extraPasses, setExtraPasses] = useState<ExtraPasses>({});

  /** Jede Änderung am Akten-Kopf hält den Zeitstempel mit fest. */
  const changeCaseFile = useCallback((change: (c: CaseFile) => CaseFile) => {
    setCaseFile((current) => ({ ...change(current), updatedAt: new Date().toISOString() }));
  }, []);

  const value = useMemo<Session>(
    () => ({
      caseFile,
      answers,
      extraPasses,

      setMaritalStatus: (answer) => changeCaseFile((c) => ({ ...c, maritalStatus: answer })),

      setChildrenStatus: (answer) => changeCaseFile((c) => ({ ...c, childrenStatus: answer })),

      setInventory: (category, answer) =>
        changeCaseFile((c) => ({ ...c, inventory: { ...c.inventory, [category]: answer } })),

      setAnswer: (category, pass, fieldId, answer) =>
        setAnswers((current) => setAnswerIn(current, answerKey(category, pass, fieldId), answer)),

      addPass: (screenId) =>
        setExtraPasses((current) => ({ ...current, [screenId]: (current[screenId] ?? 0) + 1 })),

      reset: () => {
        setCaseFile(emptyCaseFile(language));
        setAnswers({});
        setExtraPasses({});
      },
    }),
    [caseFile, answers, extraPasses, changeCaseFile, language],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession braucht einen SessionProvider darüber.');
  return session;
}