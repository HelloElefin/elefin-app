/**
 * Fehler aus dem Krypto-Bereich.
 *
 * Bei Zero-Knowledge kann euer Support nicht in die Daten sehen. Deshalb
 * trägt jeder Fehler einen Code, der auf dem Bildschirm steht und in den
 * Protokollen auftaucht. Über diesen Code ordnet der Support zu, was
 * passiert ist — ohne je einen Inhalt zu sehen.
 *
 * WICHTIG: Diese Fehler enthalten NIEMALS Nutzerinhalte. Keine Titel,
 * keine Eingaben, keine Passwörter, keine Schlüssel. Nur der Code und
 * eine allgemeine Beschreibung für Entwickler.
 */

/** Alle Fehlercodes des Krypto-Bereichs. Bereich CR. */
export const CryptoErrorCode = {
  /** Entschlüsselung fehlgeschlagen: falscher Schlüssel oder veränderte Daten. */
  DECRYPTION_FAILED: 'E-CR01',
  /** Der Umschlag hat eine Version, die diese App-Fassung nicht kennt. */
  UNKNOWN_ENVELOPE_VERSION: 'E-CR02',
  /** Der Umschlag ist zu kurz oder anders beschädigt. */
  ENVELOPE_CORRUPTED: 'E-CR03',
  /** Der Sicherheitsschlüssel hat die falsche Form (Länge, Zeichen). */
  RECOVERY_KEY_FORMAT: 'E-CR04',
  /** Die Prüfziffer des Sicherheitsschlüssels stimmt nicht — meist ein Tippfehler. */
  RECOVERY_KEY_CHECKSUM: 'E-CR05',
  /** Der verschlüsselte Datensatz hat eine unbekannte schemaVersion. */
  UNKNOWN_SCHEMA_VERSION: 'E-CR06',
  /** Der entschlüsselte Inhalt hat nicht die erwartete Struktur. */
  CONTENT_INVALID: 'E-CR07',
  /** Ein übergebener Schlüssel hat die falsche Länge. */
  KEY_LENGTH: 'E-CR08',
} as const;

export type CryptoErrorCodeValue =
  (typeof CryptoErrorCode)[keyof typeof CryptoErrorCode];

/**
 * Fehler mit Code. Die Oberfläche zeigt den Code an, der Text bleibt
 * für Entwickler — er wird nie übersetzt und nie dem Nutzer gezeigt.
 */
export class CryptoError extends Error {
  readonly code: CryptoErrorCodeValue;

  constructor(code: CryptoErrorCodeValue, hint: string) {
    super(`${code}: ${hint}`);
    this.name = 'KryptoFehler';
    this.code = code;
  }
}

/**
 * Prüft eine Schlüssellänge und wirft bei Abweichung.
 * Verhindert die stille Fehlfunktion, wenn irgendwo ein falscher Wert
 * durchgereicht wird.
 */
export function assertKeyLength(
  key: Uint8Array,
  expected: number,
): void {
  if (key.length !== expected) {
    throw new CryptoError(
      CryptoErrorCode.KEY_LENGTH,
      `Schlüssel hat ${key.length} Byte, erwartet werden ${expected}.`,
    );
  }
}