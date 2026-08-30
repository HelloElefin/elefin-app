/**
 * Verbindet i18next mit TypeScript.
 * Wirkung: t('preview.titel') wird als Fehler markiert, weil der Schlüssel
 * "titel" heißt in Wahrheit "title". Ohne diese Datei fiele das erst zur
 * Laufzeit auf — als leerer Text auf dem Bildschirm.
 */
import 'i18next';
import type deCommon from './de/common.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof deCommon;
    };
  }
}