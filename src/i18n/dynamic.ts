/**
 * Texte holen, deren Schlüssel erst zur Laufzeit entsteht.
 *
 * Die Sprachdatei ist typisiert, damit ein Tippfehler in einem festen
 * Schlüssel rot wird. Katalogschlüssel wie `flow.bank-account.title` setzt
 * die App aber erst beim Rendern zusammen — dafür ist diese Funktion da.
 *
 * exists() ist genauso wichtig wie text(): Nicht jeder Screen hat einen
 * Untertitel oder einen Hinweiskasten.
 */
import { useTranslation } from 'react-i18next';

export function useText() {
  const { t, i18n } = useTranslation();

  // Die einzige Stelle, an der die Typprüfung der Textschlüssel aufgehoben
  // wird. Bewusst hier gebündelt: Dass der Schlüssel existiert, prüfen
  // stattdessen die Katalogtests.
  const translate = t as unknown as (key: string, vars?: Record<string, unknown>) => string;

  return {
    /** Text zu einem zusammengesetzten Schlüssel. */
    text: (key: string, vars?: Record<string, unknown>): string => translate(key, vars),
    /** Gibt es diesen Schlüssel überhaupt? */
    exists: (key: string): boolean => i18n.exists(key),
  };
}