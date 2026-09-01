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

import { bytesNachText, textNachBytes, zufallsBytes } from './bytes';
import {
  KryptoFehler,
  KryptoFehlerCode,
  schluesselLaengePruefen,
} from './fehler';

/** Länge aller symmetrischen Schlüssel in Byte. */
export const SCHLUESSEL_LAENGE = 32;

/** Länge des Nonce für XChaCha20-Poly1305 in Byte. */
export const NONCE_LAENGE = 24;

/** Länge des Salt für die Schlüsselableitung in Byte. */
export const SALT_LAENGE = 16;

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
export const SCRYPT_STANDARD = {
  /** Kostenfaktor. Speicherbedarf ist ungefähr 128 * N * r Byte, hier 128 MiB. */
  N: 131072,
  /** Blockgröße. */
  r: 8,
  /** Parallelität. */
  p: 1,
} as const;

export type ScryptKosten = {
  readonly N: number;
  readonly r: number;
  readonly p: number;
};

/**
 * Ein verpackter Schlüssel, so wie er gespeichert wird.
 * Beide Felder sind base64-Text, damit sie in Textspalten passen.
 */
export type VerpackterSchluessel = {
  readonly chiffre: string;
  readonly nonce: string;
};

/**
 * Erzeugt einen neuen zufälligen Generalschlüssel.
 * Wird genau einmal pro Nutzer aufgerufen, beim Anlegen des Kontos.
 */
export function generalschluesselErzeugen(): Uint8Array {
  return zufallsBytes(SCHLUESSEL_LAENGE);
}

/** Erzeugt einen neuen zufälligen Salt für die Ableitung. */
export function saltErzeugen(): Uint8Array {
  return zufallsBytes(SALT_LAENGE);
}

/** Erzeugt einen neuen zufälligen Datenschlüssel für einen einzelnen Eintrag. */
export function datenschluesselErzeugen(): Uint8Array {
  return zufallsBytes(SCHLUESSEL_LAENGE);
}

/**
 * Verschlüsselt beliebige Bytes mit einem 32-Byte-Schlüssel.
 *
 * zusatz ist Zusatzinformation, die MITSIGNIERT, aber NICHT verschlüsselt
 * wird. Damit lässt sich ein Chiffrat an seinen Platz binden: Gibt man
 * hier die Eintrags-ID an, schlägt das Entschlüsseln fehl, sobald jemand
 * das Chiffrat in eine andere Zeile kopiert.
 */
export function symVerschluesseln(
  schluessel: Uint8Array,
  klartext: Uint8Array,
  zusatz?: Uint8Array,
): VerpackterSchluessel {
  schluesselLaengePruefen(schluessel, SCHLUESSEL_LAENGE);
  const nonce = zufallsBytes(NONCE_LAENGE);
  const chiffre = xchacha20poly1305(schluessel, nonce, zusatz).encrypt(klartext);
  return {
    chiffre: bytesNachText(chiffre),
    nonce: bytesNachText(nonce),
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
export function symEntschluesseln(
  schluessel: Uint8Array,
  verpackt: VerpackterSchluessel,
  zusatz?: Uint8Array,
): Uint8Array {
  schluesselLaengePruefen(schluessel, SCHLUESSEL_LAENGE);
  try {
    return xchacha20poly1305(
      schluessel,
      textNachBytes(verpackt.nonce),
      zusatz,
    ).decrypt(textNachBytes(verpackt.chiffre));
  } catch {
    throw new KryptoFehler(
      KryptoFehlerCode.ENTSCHLUESSELN_FEHLGESCHLAGEN,
      'Falscher Schlüssel, veränderte Daten oder abweichende Zusatzinformation.',
    );
  }
}

/**
 * Verpackt den Generalschlüssel mit einem abgeleiteten Schlüssel.
 * Wird für alle Kisten verwendet: Passwort, Sicherheitsschlüssel, Gerät.
 */
export function generalschluesselVerpacken(
  generalschluessel: Uint8Array,
  verpackungsSchluessel: Uint8Array,
): VerpackterSchluessel {
  schluesselLaengePruefen(generalschluessel, SCHLUESSEL_LAENGE);
  return symVerschluesseln(verpackungsSchluessel, generalschluessel);
}

/** Kehrt generalschluesselVerpacken um. Wirft E-CR01 bei falschem Schlüssel. */
export function generalschluesselAuspacken(
  verpackt: VerpackterSchluessel,
  verpackungsSchluessel: Uint8Array,
): Uint8Array {
  return symEntschluesseln(verpackungsSchluessel, verpackt);
}