/**
 * Pflichttests für den Krypto-Bereich.
 *
 * Diese Tests prüfen AUSSAGEN ÜBER DAS SICHERHEITSMODELL, nicht die
 * Umsetzung. Wenn ihr später scrypt gegen etwas anderes tauscht oder die
 * Umschlag-Version erhöht, müssen sie unverändert weiterlaufen. Tun sie das
 * nicht, prüfen sie das Falsche.
 *
 * Was hier NICHT geprüft wird: die Ableitung aus dem Passwort. Die ruft
 * scrypt nativ auf und läuft nur auf dem Gerät.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { secureRandomBytes } from './bytes';
import { CryptoError, CryptoErrorCode } from './errors';
import {
  CURRENT_SCHEMA_VERSION,
  decryptContent,
  encryptContent,
} from './content';
import {
  generateDataKey,
  unwrapMasterKey,
  generateMasterKey,
  wrapMasterKey,
} from './keys';
import {
  deriveFromRecoveryKey,
  generateRecoveryKey,
  validateRecoveryKey,
} from './recovery-key';
import {
  generateKeyPair,
  openEnvelope,
  sealEnvelope,
} from './envelope';

/** Muster für die Testinhalte. In der echten App kommen die aus src/domain. */
const TestContent = z.object({
  schemaVersion: z.number(),
  titel: z.string(),
  text: z.string(),
});

describe('Verschlüsseln und Entschlüsseln', () => {
  it('ergibt wieder das Original', () => {
    const key = generateDataKey();
    const entryId = 'eintrag-1';
    const original = { titel: 'Sparkonto', text: 'AT12 3456 7890' };

    const wrapped = encryptContent(key, entryId, original);
    const decrypted = decryptContent(
      key,
      entryId,
      wrapped,
      TestContent,
    );

    expect(decrypted.titel).toBe(original.titel);
    expect(decrypted.text).toBe(original.text);
    expect(decrypted.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('schlägt mit einem falschen Schlüssel fehl', () => {
    const correct = generateDataKey();
    const wrong = generateDataKey();
    const entryId = 'eintrag-1';

    const wrapped = encryptContent(correct, entryId, {
      titel: 'Sparkonto',
      text: 'AT12 3456 7890',
    });

    expect(() =>
      decryptContent(wrong, entryId, wrapped, TestContent),
    ).toThrow(CryptoError);
  });

  it('schlägt fehl, wenn das Chiffrat in eine andere Zeile verschoben wird', () => {
    const key = generateDataKey();

    const wrapped = encryptContent(key, 'eintrag-1', {
      titel: 'Sparkonto',
      text: 'AT12 3456 7890',
    });

    // Derselbe Schlüssel, aber eine fremde Eintrags-ID.
    expect(() =>
      decryptContent(key, 'eintrag-2', wrapped, TestContent),
    ).toThrow(CryptoError);
  });
});

describe('Umschläge', () => {
  it('lassen sich vom Empfänger öffnen', () => {
    const anna = generateKeyPair();
    const dataKey = generateDataKey();

    const envelope = sealEnvelope(dataKey, anna.oeffentlich);
    const unwrapped = openEnvelope(envelope, anna.privat);

    expect(unwrapped).toEqual(dataKey);
  });

  it('sind für Dritte nicht lesbar', () => {
    const anna = generateKeyPair();
    const sister = generateKeyPair();
    const dataKey = generateDataKey();

    // Für Anna verpackt — die Schwester darf nicht herankommen.
    const envelope = sealEnvelope(dataKey, anna.oeffentlich);

    expect(() => openEnvelope(envelope, sister.privat)).toThrow(
      CryptoError,
    );
  });

  it('erzeugen für denselben Inhalt jedes Mal ein anderes Ergebnis', () => {
    const anna = generateKeyPair();
    const dataKey = generateDataKey();

    const a = sealEnvelope(dataKey, anna.oeffentlich);
    const b = sealEnvelope(dataKey, anna.oeffentlich);

    // Zwei gleiche Umschläge würden verraten, dass derselbe Schlüssel
    // zweimal verpackt wurde — also dass zwei Einträge zusammengehören.
    expect(a).not.toBe(b);
  });
});

describe('Generalschlüssel', () => {
  it('öffnet sich mit jeder seiner Verpackungen gleichermaßen', () => {
    const masterKey = generateMasterKey();

    // Zwei verschiedene Kisten, in der echten App: Passwort und
    // Sicherheitsschlüssel. Hier stehen zwei Zufallsschlüssel dafür,
    // weil die Ableitung selbst nicht Gegenstand dieses Tests ist.
    const fromPassword = secureRandomBytes(32);
    const fromRecoveryKey = secureRandomBytes(32);

    const box1 = wrapMasterKey(masterKey, fromPassword);
    const box2 = wrapMasterKey(
      masterKey,
      fromRecoveryKey,
    );

    expect(unwrapMasterKey(box1, fromPassword)).toEqual(
      masterKey,
    );
    expect(
      unwrapMasterKey(box2, fromRecoveryKey),
    ).toEqual(masterKey);
  });

  it('bleibt bei einem Passwortwechsel derselbe', () => {
    const masterKey = generateMasterKey();
    const oldPassword = secureRandomBytes(32);
    const newPassword = secureRandomBytes(32);

    const oldBox = wrapMasterKey(
      masterKey,
      oldPassword,
    );

    // Passwortwechsel: auspacken, mit dem neuen Schlüssel neu verpacken.
    const unwrapped = unwrapMasterKey(oldBox, oldPassword);
    const newBox = wrapMasterKey(unwrapped, newPassword);

    // Entscheidend: Es ist derselbe Generalschlüssel. Deshalb bleiben alle
    // bestehenden Freigaben gültig und nichts muss neu verschlüsselt werden.
    expect(unwrapMasterKey(newBox, newPassword)).toEqual(
      masterKey,
    );
  });
});

describe('Sicherheitsschlüssel', () => {
  it('hat die vereinbarte Form', () => {
    const key = generateRecoveryKey();

    expect(key).toMatch(/^[2-9A-HJ-NP-Z*+]{4}(-[2-9A-HJ-NP-Z*+]{4}){6}$/);
  });

  it('wird trotz Bindestrichen und Kleinschreibung erkannt', () => {
    const key = generateRecoveryKey();

    const checked = validateRecoveryKey(key);
    const equivalent = validateRecoveryKey(
      key.toLowerCase().replace(/-/g, ' '),
    );

    expect(equivalent).toBe(checked);
  });

  it('erkennt einen Tippfehler an der Prüfziffer', () => {
    const key = generateRecoveryKey();

    // Erstes Zeichen verändern, aber im gültigen Vorrat bleiben.
    const firstChars = key[0] === '2' ? '3' : '2';
    const mistyped = firstChars + key.slice(1);

    try {
      validateRecoveryKey(mistyped);
      expect.unreachable('Hätte einen Fehler werfen müssen.');
    } catch (error) {
      expect(error).toBeInstanceOf(CryptoError);
      expect((error as CryptoError).code).toBe(
        CryptoErrorCode.RECOVERY_KEY_CHECKSUM,
      );
    }
  });

  it('ergibt für denselben Schlüssel immer dieselbe Ableitung', () => {
    const key = generateRecoveryKey();
    const checked = validateRecoveryKey(key);

    // Das ist die Grundlage dafür, dass der Ausdruck auf einem beliebigen
    // Gerät funktioniert — auch Jahre später.
    expect(deriveFromRecoveryKey(checked)).toEqual(
      deriveFromRecoveryKey(checked),
    );
  });
});