/**
 * Umschläge: einen Schlüssel für einen anderen Menschen verpacken.
 *
 * Das Problem: Anna soll einen Datenschlüssel bekommen, aber niemand sonst —
 * auch nicht euer Server, über den er läuft. Lösung ist ein Verfahren, bei
 * dem allein Annas öffentlicher Schlüssel genügt, um für sie zu verpacken.
 * Auspacken kann nur, wer ihren privaten Schlüssel hat.
 *
 * Ablauf beim Verpacken:
 *   1. Ein Wegwerf-Schlüsselpaar erzeugen, nur für diesen einen Umschlag.
 *   2. Aus Wegwerf-privat und Anna-öffentlich ein gemeinsames Geheimnis
 *      rechnen (X25519).
 *   3. Daraus per HKDF einen sauberen Verpackungsschlüssel ableiten.
 *   4. Damit den Inhalt verschlüsseln.
 *   5. Wegwerf-privat wegwerfen. Ab jetzt kann nur noch Anna auspacken.
 *
 * Aufbau des fertigen Umschlags:
 *   [ Version (1) | Wegwerf-öffentlich (32) | Nonce (24) | Chiffre (Rest) ]
 *
 * Das Versionsbyte am Anfang erlaubt es, das Verfahren später zu wechseln,
 * ohne alte Umschläge unlesbar zu machen — dieselbe Idee wie schemaVersion
 * bei den Inhalten, nur eine Ebene tiefer.
 */
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { x25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

import {
  bytesToBase64,
  concatBytes,
  base64ToBytes,
  textToUtf8,
  secureRandomBytes,
} from './bytes';
import { CryptoError, CryptoErrorCode } from './errors';
import { NONCE_LENGTH, KEY_LENGTH } from './keys';

/** Aktuelle Umschlag-Version. Bei Verfahrenswechsel erhöhen, nie wiederverwenden. */
const ENVELOPE_VERSION = 1;

/** Länge eines X25519-Schlüssels in Byte. */
export const X25519_LENGTH = 32;

/**
 * Trennt diese Ableitung von jeder anderen Verwendung derselben Verfahren.
 * Ohne diese Kennzeichnung könnte ein Umschlag theoretisch in einem anderen
 * Zusammenhang wiederverwendet werden.
 */
const ENVELOPE_LABEL = textToUtf8('elefin/umschlag/v1');

export type KeyPair = {
  readonly privat: Uint8Array;
  readonly oeffentlich: Uint8Array;
};

/**
 * Erzeugt ein persönliches X25519-Schlüsselpaar.
 *
 * Der öffentliche Teil darf jeder sehen — er wird gebraucht, damit andere
 * für diese Person verpacken können. Der private Teil wird nur verpackt
 * gespeichert, geschützt durch den Generalschlüssel.
 */
export function generateKeyPair(): KeyPair {
  const pair = x25519.keygen();
  return { privat: pair.secretKey, oeffentlich: pair.publicKey };
}

/**
 * Leitet den Verpackungsschlüssel ab.
 *
 * Beide öffentlichen Schlüssel gehen mit ein. Das bindet den Umschlag an
 * genau dieses Paar aus Absender-Wegwerfschlüssel und Empfänger — er lässt
 * sich nicht für einen anderen Empfänger umdeuten.
 */
function deriveWrappingKey(
  sharedSecret: Uint8Array,
  ephemeralPublic: Uint8Array,
  recipientPublic: Uint8Array,
): Uint8Array {
  return hkdf(
    sha256,
    sharedSecret,
    // Kein Salt nötig: Das gemeinsame Geheimnis ist bereits zufällig.
    undefined,
    concatBytes(ENVELOPE_LABEL, ephemeralPublic, recipientPublic),
    KEY_LENGTH,
  );
}

/**
 * Verpackt einen Schlüssel für den Besitzer des angegebenen öffentlichen
 * Schlüssels. Ergebnis ist base64-Text, fertig zum Speichern.
 */
export function sealEnvelope(
  content: Uint8Array,
  recipientPublic: Uint8Array,
): string {
  const ephemeral = x25519.keygen();
  const shared = x25519.getSharedSecret(
    ephemeral.secretKey,
    recipientPublic,
  );
  const key = deriveWrappingKey(
    shared,
    ephemeral.publicKey,
    recipientPublic,
  );

  const nonce = secureRandomBytes(NONCE_LENGTH);
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(content);

  return bytesToBase64(
    concatBytes(
      new Uint8Array([ENVELOPE_VERSION]),
      ephemeral.publicKey,
      nonce,
      ciphertext,
    ),
  );
}

/**
 * Kehrt sealEnvelope um.
 *
 * Wirft E-CR02 bei unbekannter Version, E-CR03 bei zu kurzem Umschlag und
 * E-CR01, wenn der private Schlüssel nicht passt.
 */
export function openEnvelope(
  envelopeText: string,
  myPrivate: Uint8Array,
): Uint8Array {
  const block = base64ToBytes(envelopeText);

  const headerLength = 1 + X25519_LENGTH + NONCE_LENGTH;
  if (block.length <= headerLength) {
    throw new CryptoError(
      CryptoErrorCode.ENVELOPE_CORRUPTED,
      `Umschlag ist ${block.length} Byte lang, mindestens ${headerLength + 1} werden erwartet.`,
    );
  }

  const version = block[0];
  if (version !== ENVELOPE_VERSION) {
    throw new CryptoError(
      CryptoErrorCode.UNKNOWN_ENVELOPE_VERSION,
      `Umschlag hat Version ${String(version)}, diese App kennt nur ${ENVELOPE_VERSION}.`,
    );
  }

  const ephemeralPublic = block.slice(1, 1 + X25519_LENGTH);
  const nonce = block.slice(1 + X25519_LENGTH, headerLength);
  const ciphertext = block.slice(headerLength);

  const myPublic = x25519.getPublicKey(myPrivate);
  const shared = x25519.getSharedSecret(myPrivate, ephemeralPublic);
  const key = deriveWrappingKey(
    shared,
    ephemeralPublic,
    myPublic,
  );

  try {
    return xchacha20poly1305(key, nonce).decrypt(ciphertext);
  } catch {
    throw new CryptoError(
      CryptoErrorCode.DECRYPTION_FAILED,
      'Umschlag konnte mit diesem privaten Schlüssel nicht geöffnet werden.',
    );
  }
}