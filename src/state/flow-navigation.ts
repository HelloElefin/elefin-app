/**
 * Vom Schritt zur Adresse — und zurück.
 *
 * Die Flussmaschine rechnet in Schritten ({ screenId, pass }). Expo Router
 * denkt in Adressen. Diese Datei übersetzt zwischen beidem, damit der
 * Zurück-Knopf des Geräts funktioniert und man einen Screen direkt aufrufen
 * kann.
 */
import { useRouter } from 'expo-router';

import { loadCatalog } from '@/catalog';
import { nextStep, previousStep, progress, steps, stepIndex, type Step } from '@/domain';

import { useSession } from './session';

/**
 * Welche Adressen der Router annimmt, leiten wir direkt von ihm ab.
 *
 * Grund: In app.json steht typedRoutes: true. Expo Router prüft damit jede
 * Adresse gegen die Dateien, die es unter src/app wirklich gibt — und die
 * Rahmenscreens aus Schritt 6b fehlen noch. Bis sie da sind, brauchen wir
 * diese Umtypung. Danach kann sie ersatzlos weg.
 */
type Router = ReturnType<typeof useRouter>;
type PushRoute = Parameters<Router['push']>[0];
type ReplaceRoute = Parameters<Router['replace']>[0];

/** Rahmenscreens haben eigene Adressen, Frage-Screens eine gemeinsame. */
const FRAME_ROUTES: Record<string, string> = {
  start: '/',
  principles: '/principles',
  situation: '/situation',
  inventory: '/inventory',
  summary: '/summary',
  finish: '/finish',
};

export function hrefFor(step: Step): string {
  const frame = FRAME_ROUTES[step.screenId];
  return frame ?? `/question/${step.screenId}?pass=${step.pass}`;
}

export function useFlow(current: Step) {
  const router = useRouter();
  const { caseFile, extraPasses } = useSession();
  const catalog = loadCatalog();
  const all = steps(catalog, caseFile, extraPasses);

  const next = nextStep(all, current);
  const back = previousStep(all, current);

  return {
    steps: all,
    position: progress(all, current).position,
    total: progress(all, current).total,
    isKnownStep: stepIndex(all, current) >= 0,
    hasNext: next !== null,
    hasBack: back !== null,
    goNext: () => {
      if (next) router.push(hrefFor(next) as PushRoute);
    },
    goBack: () => {
      if (router.canGoBack()) router.back();
      else if (back) router.replace(hrefFor(back) as ReplaceRoute);
    },
    goTo: (step: Step) => router.push(hrefFor(step) as PushRoute),
  };
}