/**
 * Der Generalschlüssel und seine Verpackungen.
 *
 * Das Grundprinzip von Elefin in drei Sätzen:
 *
 * 1. Der Generalschlüssel ist ZUFÄLLIG, nicht aus dem Passwort abgeleitet.
 * 2. Er wird mehrfach verpackt — mit dem Passwort, mit dem ausgedruckten
 *    Sicherheitsschlüssel, mit dem Gerät, und für den Ernstfall.
 * 3. Alle Verpackungen führen zum selben Schlüssel.
 *
 * Daraus folgt: Ein Passwortwechsel ersetzt EINE kleine Verpackung. Kein
 * Neuverschlüsseln, keine Wartezeit, keine Auswirkung auf Freigaben.
 * Wäre der Generalschlüssel aus dem Passwort abgeleitet, müsste bei jedem
 * Passwortwechsel der gesamte Datenbestand neu verschlüsselt werden.
 */
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

import { bytesToBase64, base64ToBytes, secureRandomBytes } from './bytes';
import {
  CryptoError,
  CryptoErrorCode,
  assertKeyLength,
} from './errors';

/** Länge aller symmetrischen Schlüssel in Byte. */
export const KEY_LENGTH = 32;

/** Länge des Nonce für XChaCha20-Poly1305 in Byte. */
export const NONCE_LENGTH = 24;

/** Länge des Salt für die Schlüsselableitung in Byte. */
export const SALT_LENGTH = 16;

/**
 * Kosten für die Schlüsselableitung aus einem Passwort (scrypt).
 *
 * Gemessen am 31.08.2026 auf einem Xiaomi 15T Pro: 376 ms.
 * Auf einem Mittelklassegerät ist mit dem Drei- bis Vierfachen zu rechnen.
 *
 * Diese Werte werden PRO NUTZER gespeichert. Damit lassen sie sich später
 * erhöhen, ohne dass bestehende Konten unbrauchbar werden — ein alter
 * Nutzer rechnet weiter mit seinen alten Werten, bis er sein Passwort
 * ändert.
 *
 * Warum scrypt und nicht Argon2id: Argon2id gibt es für React Native nur
 * in JavaScript, und dort braucht es auf demselben Gerät über 60 Sekunden.
 * scrypt ist ebenfalls speicherhart und nativ verfügbar.
 */
export const SCRYPT_DEFAULTS = {
  /** Kostenfaktor. Speicherbedarf ist ungefähr 128 * N * r Byte, hier 128 MiB. */
  N: 131072,
  /** Blockgröße. */
  r: 8,
  /** Parallelität. */
  p: 1,
} as const;

export type ScryptCost = {
  readonly N: number;
  readonly r: number;
  readonly p: number;
};

/**
 * Ein verpackter Schlüssel, so wie er gespeichert wird.
 * Beide Felder sind base64-Text, damit sie in Textspalten passen.
 */
export type WrappedKey = {
  readonly chiffre: string;
  readonly nonce: string;
};

/**
 * Erzeugt einen neuen zufälligen Generalschlüssel.
 * Wird genau einmal pro Nutzer aufgerufen, beim Anlegen des Kontos.
 */
export function generateMasterKey(): Uint8Array {
  return secureRandomBytes(KEY_LENGTH);
}

/** Erzeugt einen neuen zufälligen Salt für die Ableitung. */
export function generateSalt(): Uint8Array {
  return secureRandomBytes(SALT_LENGTH);
}

/** Erzeugt einen neuen zufälligen Datenschlüssel für einen einzelnen Eintrag. */
export function generateDataKey(): Uint8Array {
  return secureRandomBytes(KEY_LENGTH);
}

/**
 * Verschlüsselt beliebige Bytes mit einem 32-Byte-Schlüssel.
 *
 * zusatz ist Zusatzinformation, die MITSIGNIERT, aber NICHT verschlüsselt
 * wird. Damit lässt sich ein Chiffrat an seinen Platz binden: Gibt man
 * hier die Eintrags-ID an, schlägt das Entschlüsseln fehl, sobald jemand
 * das Chiffrat in eine andere Zeile kopiert.
 */
export function symEncrypt(
  key: Uint8Array,
  plaintext: Uint8Array,
  additionalData?: Uint8Array,
): WrappedKey {
  assertKeyLength(key, KEY_LENGTH);
  const nonce = secureRandomBytes(NONCE_LENGTH);
  const ciphertext = xchacha20poly1305(key, nonce, additionalData).encrypt(plaintext);
  return {
    chiffre: bytesToBase64(ciphertext),
    nonce: bytesToBase64(nonce),
  };
}

/**
 * Kehrt symVerschluesseln um.
 *
 * Wirft E-CR01, wenn der Schlüssel falsch ist ODER die Daten verändert
 * wurden ODER der zusatz nicht übereinstimmt. Diese Echtheitsprüfung ist
 * der Grund, warum ein falsches Passwort sofort auffällt: Der Nutzer
 * bekommt einen klaren Fehler statt sinnlosem Datenmüll.
 */
export function symDecrypt(
  key: Uint8Array,
  wrapped: WrappedKey,
  additionalData?: Uint8Array,
): Uint8Array {
  assertKeyLength(key, KEY_LENGTH);
  try {
    return xchacha20poly1305(
      key,
      base64ToBytes(wrapped.nonce),
      additionalData,
    ).decrypt(base64ToBytes(wrapped.chiffre));
  } catch {
    throw new CryptoError(
      CryptoErrorCode.DECRYPTION_FAILED,
      'Falscher Schlüssel, veränderte Daten oder abweichende Zusatzinformation.',
    );
  }
}

/**
 * Verpackt den Generalschlüssel mit einem abgeleiteten Schlüssel.
 * Wird für alle Kisten verwendet: Passwort, Sicherheitsschlüssel, Gerät.
 */
export function wrapMasterKey(
  masterKey: Uint8Array,
  wrappingKey: Uint8Array,
): WrappedKey {
  assertKeyLength(masterKey, KEY_LENGTH);
  return symEncrypt(wrappingKey, masterKey);
}

/** Kehrt generalschluesselVerpacken um. Wirft E-CR01 bei falschem Schlüssel. */
export function unwrapMasterKey(
  wrapped: WrappedKey,
  wrappingKey: Uint8Array,
): Uint8Array {
  return symDecrypt(wrappingKey, wrapped);
}