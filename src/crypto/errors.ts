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
export const KryptoFehlerCode = {
  /** Entschlüsselung fehlgeschlagen: falscher Schlüssel oder veränderte Daten. */
  ENTSCHLUESSELN_FEHLGESCHLAGEN: 'E-CR01',
  /** Der Umschlag hat eine Version, die diese App-Fassung nicht kennt. */
  UNBEKANNTE_UMSCHLAG_VERSION: 'E-CR02',
  /** Der Umschlag ist zu kurz oder anders beschädigt. */
  UMSCHLAG_BESCHAEDIGT: 'E-CR03',
  /** Der Sicherheitsschlüssel hat die falsche Form (Länge, Zeichen). */
  SICHERHEITSSCHLUESSEL_FORM: 'E-CR04',
  /** Die Prüfziffer des Sicherheitsschlüssels stimmt nicht — meist ein Tippfehler. */
  SICHERHEITSSCHLUESSEL_PRUEFZIFFER: 'E-CR05',
  /** Der verschlüsselte Datensatz hat eine unbekannte schemaVersion. */
  UNBEKANNTE_SCHEMA_VERSION: 'E-CR06',
  /** Der entschlüsselte Inhalt hat nicht die erwartete Struktur. */
  INHALT_UNGUELTIG: 'E-CR07',
  /** Ein übergebener Schlüssel hat die falsche Länge. */
  SCHLUESSEL_LAENGE: 'E-CR08',
} as const;

export type KryptoFehlerCodeWert =
  (typeof KryptoFehlerCode)[keyof typeof KryptoFehlerCode];

/**
 * Fehler mit Code. Die Oberfläche zeigt den Code an, der Text bleibt
 * für Entwickler — er wird nie übersetzt und nie dem Nutzer gezeigt.
 */
export class KryptoFehler extends Error {
  readonly code: KryptoFehlerCodeWert;

  constructor(code: KryptoFehlerCodeWert, hinweis: string) {
    super(`${code}: ${hinweis}`);
    this.name = 'KryptoFehler';
    this.code = code;
  }
}

/**
 * Prüft eine Schlüssellänge und wirft bei Abweichung.
 * Verhindert die stille Fehlfunktion, wenn irgendwo ein falscher Wert
 * durchgereicht wird.
 */
export function schluesselLaengePruefen(
  schluessel: Uint8Array,
  erwartet: number,
): void {
  if (schluessel.length !== erwartet) {
    throw new KryptoFehler(
      KryptoFehlerCode.SCHLUESSEL_LAENGE,
      `Schlüssel hat ${schluessel.length} Byte, erwartet werden ${erwartet}.`,
    );
  }
}