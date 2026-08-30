/**
 * Einrichtung der Textausgabe (i18n).
 *
 * Zwei Achsen, die nichts miteinander zu tun haben:
 *   SPRACHE (hier) — was jemand liest.
 *   MARKT (src/content) — welches Recht gilt.
 * Eine türkischsprachige Familie in Wien braucht türkische Oberfläche und
 * österreichische Rechtsinhalte. Deshalb wird der Markt NICHT hier gewählt.
 *
 * Basissprache ist Deutsch. Fehlt ein Schlüssel in einer anderen Sprache,
 * fällt die Anzeige auf Deutsch zurück statt leer zu bleiben.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import deCommon from './de/common.json';
import enCommon from './en/common.json';

/** Sprachen, die die App kennt. Neue Sprache: hier und bei resources ergänzen. */
export const SUPPORTED_LANGUAGES = ['de', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = 'de';

/**
 * Ermittelt die Gerätesprache und prüft, ob wir sie unterstützen.
 * Das Gerät meldet z. B. "de-AT" — uns interessiert nur der Teil davor.
 */
function geraeteSpracheErmitteln(): SupportedLanguage {
  const locales = getLocales();
  // Kann aus zwei Gründen leer sein: Die Liste ist leer (deshalb der
  // optionale Zugriff mit ?.) oder das Gerät meldet keinen Sprachcode
  // (dann ist der Wert null). Beides fängt die Prüfung unten ab.
  const ersteSprache = locales[0]?.languageCode;

  if (
    ersteSprache != null &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(ersteSprache)
  ) {
    return ersteSprache as SupportedLanguage;
  }

  return FALLBACK_LANGUAGE;
}

void i18n.use(initReactI18next).init({
  resources: {
    de: { common: deCommon },
    en: { common: enCommon },
  },
  lng: geraeteSpracheErmitteln(),
  fallbackLng: FALLBACK_LANGUAGE,
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    // React schützt bereits vor gefährlichem Inhalt in Texten.
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;