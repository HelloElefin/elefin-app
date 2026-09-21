/**
 * Der ausgedruckte Sicherheitsschlüssel.
 *
 * Bei Elefin ist er der letzte Rückweg: Wer Passwort und angemeldetes Gerät
 * verliert, kommt nur hierüber wieder an seine Daten. Danach ist nichts mehr.
 * Deshalb ist er bewusst lang und wird beim Onboarding als eigener Schritt
 * behandelt, nicht als Fußnote.
 *
 * Aufbau: 28 Zeichen in sieben Vierergruppen.
 *   K7M2-9XPQ-4RTB-8WVN-3HJD-6CFL-2GYS
 *
 * Davon sind 27 Zeichen zufällig und eines eine Prüfziffer. Das ergibt rund
 * 135 Bit Zufall — deutlich mehr als jedes Passwort, das ein Mensch sich
 * merken würde.
 *
 * Der Zeichenvorrat lässt alles weg, was beim Abtippen von Papier
 * verwechselt wird: kein I, kein 1, kein O, kein 0, kein L.
 */
import { sha256 } from '@noble/hashes/sha2.js';

import { textToUtf8, secureRandomBytes } from './bytes';
import { CryptoError, CryptoErrorCode } from './errors';

/**
 * 32 Zeichen, Crockfords Base32 ohne die verwechselbaren.
 * Diese Reihenfolge darf NIE geändert werden — sonst lassen sich bereits
 * ausgedruckte Schlüssel nicht mehr einlesen.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ*+';

/**
 * Verwechselbare Eingaben und das Zeichen, das gemeint war.
 * Wer von einem Ausdruck abtippt, verliest sich hier am häufigsten.
 */
const CONFUSABLES: Record<string, string> = {
  O: '0',
  I: '1',
  L: '1',
};

/** Zeichen, die es im Vorrat nicht gibt und die daher nie gemeint sein können. */
const NOT_IN_ALPHABET = new Set(['0', '1']);

/** Gesamtlänge ohne Bindestriche. */
const LENGTH = 28;

/** Zeichen je Gruppe in der Anzeige. */
const GROUP_SIZE = 4;

/**
 * Erzeugt einen neuen Sicherheitsschlüssel in der Anzeigeform mit
 * Bindestrichen. Genau so wird er dem Nutzer gezeigt und ausgedruckt.
 */
export function generateRecoveryKey(): string {
  const random = secureRandomBytes(LENGTH - 1);
  let raw = '';
  for (const byte of random) {
    // Rest bei Division durch 32 wählt ein Zeichen aus dem Vorrat.
    // 256 ist durch 32 teilbar, deshalb ist jedes Zeichen gleich wahrscheinlich.
    raw += ALPHABET[byte % ALPHABET.length];
  }
  return formatRecoveryKey(raw + checkCharacter(raw));
}

/**
 * Berechnet das Prüfzeichen zu den ersten 27 Zeichen.
 *
 * Zweck: Ein Tippfehler wird sofort erkannt. Ohne Prüfzeichen bekäme der
 * Nutzer erst nach dem Entschlüsselungsversuch ein nichtssagendes
 * "falscher Schlüssel" und wüsste nicht, ob er sich vertippt hat oder ob
 * seine Daten kaputt sind.
 *
 * Das Prüfzeichen schützt gegen Tippfehler, nicht gegen Angreifer — es ist
 * aus dem Rest berechenbar und trägt nichts zur Sicherheit bei.
 */
function checkCharacter(raw: string): string {
  const hash = sha256(textToUtf8(raw));
  return ALPHABET[hash[0]! % ALPHABET.length]!;
}

/** Setzt die Bindestriche für die Anzeige. */
function formatRecoveryKey(raw: string): string {
  const groups: string[] = [];
  for (let i = 0; i < raw.length; i += GROUP_SIZE) {
    groups.push(raw.slice(i, i + GROUP_SIZE));
  }
  return groups.join('-');
}

/**
 * Bereinigt eine Nutzereingabe.
 *
 * Drei Schritte, jeder für sich nachvollziehbar:
 *   1. Großbuchstaben, Bindestriche und Leerzeichen entfernen.
 *   2. Zeichen entfernen, die es im Vorrat nicht gibt und die daher nur
 *      aus einem Verlesen stammen können.
 *
 * Ein O im Ausdruck gibt es nicht — wer eines tippt, meinte die Null, die
 * es aber ebenfalls nicht gibt. Beides fällt weg, und die Längenprüfung
 * weiter unten meldet dann eine zu kurze Eingabe.
 */
function normalizeRecoveryKey(input: string): string {
  const withoutSeparators = input.toUpperCase().replace(/[\s-]/g, '');

  let cleaned = '';
  for (const char of withoutSeparators) {
    const intended = CONFUSABLES[char] ?? char;
    if (NOT_IN_ALPHABET.has(intended)) continue;
    cleaned += intended;
  }
  return cleaned;
}

/**
 * Prüft eine Eingabe und gibt die bereinigte Form zurück.
 *
 * Wirft E-CR04 bei falscher Länge oder unbekannten Zeichen,
 * E-CR05 bei falscher Prüfziffer — das ist der Tippfehler-Fall, und die
 * Oberfläche sollte darauf mit "Bitte nochmal prüfen" reagieren, nicht mit
 * "Schlüssel ungültig".
 */
export function validateRecoveryKey(input: string): string {
  const raw = normalizeRecoveryKey(input);

  if (raw.length !== LENGTH) {
    throw new CryptoError(
      CryptoErrorCode.RECOVERY_KEY_FORMAT,
      `Eingabe hat ${raw.length} Zeichen, erwartet werden ${LENGTH}.`,
    );
  }

  for (const char of raw) {
    if (!ALPHABET.includes(char)) {
      throw new CryptoError(
        CryptoErrorCode.RECOVERY_KEY_FORMAT,
        'Eingabe enthält ein Zeichen, das nicht zum Vorrat gehört.',
      );
    }
  }

  const body = raw.slice(0, LENGTH - 1);
  if (raw[LENGTH - 1] !== checkCharacter(body)) {
    throw new CryptoError(
      CryptoErrorCode.RECOVERY_KEY_CHECKSUM,
      'Prüfzeichen stimmt nicht — vermutlich ein Tippfehler.',
    );
  }

  return raw;
}

/**
 * Leitet aus dem Sicherheitsschlüssel den Schlüssel ab, mit dem der
 * Generalschlüssel verpackt ist.
 *
 * Hier ist KEIN scrypt nötig — anders als beim Passwort. Grund: Der
 * Schlüssel hat 135 Bit Zufall und ist nicht zu erraten. Die absichtliche
 * Langsamkeit von scrypt schützt nur gegen das Durchprobieren schwacher,
 * von Menschen gewählter Passwörter. Ein einfacher Hash genügt und spart
 * dem Nutzer eine Sekunde Wartezeit.
 */
export function deriveFromRecoveryKey(checked: string): Uint8Array {
  return sha256(textToUtf8('elefin/sicherheitsschluessel/v1' + checked));
}