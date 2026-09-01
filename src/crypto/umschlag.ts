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
  bytesNachText,
  bytesVerbinden,
  textNachBytes,
  textNachUtf8,
  zufallsBytes,
} from './bytes';
import { KryptoFehler, KryptoFehlerCode } from './fehler';
import { NONCE_LAENGE, SCHLUESSEL_LAENGE } from './schluessel';

/** Aktuelle Umschlag-Version. Bei Verfahrenswechsel erhöhen, nie wiederverwenden. */
const UMSCHLAG_VERSION = 1;

/** Länge eines X25519-Schlüssels in Byte. */
export const X25519_LAENGE = 32;

/**
 * Trennt diese Ableitung von jeder anderen Verwendung derselben Verfahren.
 * Ohne diese Kennzeichnung könnte ein Umschlag theoretisch in einem anderen
 * Zusammenhang wiederverwendet werden.
 */
const UMSCHLAG_KENNUNG = textNachUtf8('elefin/umschlag/v1');

export type Schluesselpaar = {
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
export function schluesselpaarErzeugen(): Schluesselpaar {
  const paar = x25519.keygen();
  return { privat: paar.secretKey, oeffentlich: paar.publicKey };
}

/**
 * Leitet den Verpackungsschlüssel ab.
 *
 * Beide öffentlichen Schlüssel gehen mit ein. Das bindet den Umschlag an
 * genau dieses Paar aus Absender-Wegwerfschlüssel und Empfänger — er lässt
 * sich nicht für einen anderen Empfänger umdeuten.
 */
function verpackungsSchluessel(
  gemeinsamesGeheimnis: Uint8Array,
  wegwerfOeffentlich: Uint8Array,
  empfaengerOeffentlich: Uint8Array,
): Uint8Array {
  return hkdf(
    sha256,
    gemeinsamesGeheimnis,
    // Kein Salt nötig: Das gemeinsame Geheimnis ist bereits zufällig.
    undefined,
    bytesVerbinden(UMSCHLAG_KENNUNG, wegwerfOeffentlich, empfaengerOeffentlich),
    SCHLUESSEL_LAENGE,
  );
}

/**
 * Verpackt einen Schlüssel für den Besitzer des angegebenen öffentlichen
 * Schlüssels. Ergebnis ist base64-Text, fertig zum Speichern.
 */
export function umschlagVerpacken(
  inhalt: Uint8Array,
  empfaengerOeffentlich: Uint8Array,
): string {
  const wegwerf = x25519.keygen();
  const gemeinsam = x25519.getSharedSecret(
    wegwerf.secretKey,
    empfaengerOeffentlich,
  );
  const schluessel = verpackungsSchluessel(
    gemeinsam,
    wegwerf.publicKey,
    empfaengerOeffentlich,
  );

  const nonce = zufallsBytes(NONCE_LAENGE);
  const chiffre = xchacha20poly1305(schluessel, nonce).encrypt(inhalt);

  return bytesNachText(
    bytesVerbinden(
      new Uint8Array([UMSCHLAG_VERSION]),
      wegwerf.publicKey,
      nonce,
      chiffre,
    ),
  );
}

/**
 * Kehrt umschlagVerpacken um.
 *
 * Wirft E-CR02 bei unbekannter Version, E-CR03 bei zu kurzem Umschlag und
 * E-CR01, wenn der private Schlüssel nicht passt.
 */
export function umschlagAuspacken(
  umschlagText: string,
  meinPrivat: Uint8Array,
): Uint8Array {
  const block = textNachBytes(umschlagText);

  const kopfLaenge = 1 + X25519_LAENGE + NONCE_LAENGE;
  if (block.length <= kopfLaenge) {
    throw new KryptoFehler(
      KryptoFehlerCode.UMSCHLAG_BESCHAEDIGT,
      `Umschlag ist ${block.length} Byte lang, mindestens ${kopfLaenge + 1} werden erwartet.`,
    );
  }

  const version = block[0];
  if (version !== UMSCHLAG_VERSION) {
    throw new KryptoFehler(
      KryptoFehlerCode.UNBEKANNTE_UMSCHLAG_VERSION,
      `Umschlag hat Version ${String(version)}, diese App kennt nur ${UMSCHLAG_VERSION}.`,
    );
  }

  const wegwerfOeffentlich = block.slice(1, 1 + X25519_LAENGE);
  const nonce = block.slice(1 + X25519_LAENGE, kopfLaenge);
  const chiffre = block.slice(kopfLaenge);

  const meinOeffentlich = x25519.getPublicKey(meinPrivat);
  const gemeinsam = x25519.getSharedSecret(meinPrivat, wegwerfOeffentlich);
  const schluessel = verpackungsSchluessel(
    gemeinsam,
    wegwerfOeffentlich,
    meinOeffentlich,
  );

  try {
    return xchacha20poly1305(schluessel, nonce).decrypt(chiffre);
  } catch {
    throw new KryptoFehler(
      KryptoFehlerCode.ENTSCHLUESSELN_FEHLGESCHLAGEN,
      'Umschlag konnte mit diesem privaten Schlüssel nicht geöffnet werden.',
    );
  }
}