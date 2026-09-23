/**
 * Vom Schritt zur Adresse — und zurück.
 *
 * Die Flussmaschine rechnet in Schritten ({ screenId, pass }). Expo Router
 * denkt in Adressen. Diese Datei übersetzt zwischen beidem, damit der
 * Zurück-Knopf des Geräts funktioniert und man einen Screen direkt aufrufen
 * kann.
 */
import { useRouter, type Href } from 'expo-router';

import { loadCatalog } from '@/catalog';
import { nextStep, previousStep, progress, steps, stepIndex, type Step } from '@/domain';

import { useSession } from './session';

/**
 * Rahmenscreens haben eigene Dateien und damit eigene Adressen. Alle
 * Frage-Screens teilen sich question/[screen].tsx.
 *
 * as const ist wichtig: Ohne das wären die Werte einfach Text, und mit
 * typedRoutes in app.json nimmt der Router nur bekannte Adressen an.
 */
const FRAME_ROUTES = {
  start: '/',
  principles: '/principles',
  situation: '/situation',
  inventory: '/inventory',
  summary: '/summary',
  finish: '/finish',
} as const;

type FrameId = keyof typeof FRAME_ROUTES;

function isFrame(screenId: string): screenId is FrameId {
  return screenId in FRAME_ROUTES;
}

/**
 * Die Adresse zu einem Schritt.
 *
 * Der Frage-Screen wird als Objekt adressiert statt als fertige Zeile: Der
 * Router setzt die Adresse dann selbst zusammen und kann sie prüfen. Eine
 * zusammengebaute Zeichenkette könnte er nicht einordnen.
 */
export function hrefFor(step: Step): Href {
  if (isFrame(step.screenId)) return FRAME_ROUTES[step.screenId];
  // Als fertige Adresszeile statt als Objekt: Die Objektform hat den
  // Parameter nicht übernommen, die Adresse landete bei "undefined".
  return `/question/${step.screenId}?pass=${step.pass}` as Href;
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
      if (!next) return;
      console.log('nächster Schritt:', JSON.stringify(next), '→', hrefFor(next));
      router.push(hrefFor(next));
    },
    goBack: () => {
      // Der Verlauf des Geräts hat Vorrang, damit der Zurück-Knopf sich
      // erwartbar verhält. Nur beim Direktaufruf einer Adresse gibt es
      // keinen Verlauf — dann springen wir zum vorherigen Schritt.
      if (router.canGoBack()) router.back();
      else if (back) router.replace(hrefFor(back));
    },
    goTo: (step: Step) => router.push(hrefFor(step)),
  };
}