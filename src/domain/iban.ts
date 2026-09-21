/**
 * IBAN-Prüfung.
 *
 * Wird bei der EINGABE aufgerufen, nicht beim Lesen eines bestehenden
 * Eintrags. Der Unterschied ist wichtig: Ein Eintrag von 2027 darf 2031
 * nicht plötzlich unlesbar werden, weil damals ein Tippfehler durchgerutscht
 * ist. Nachsichtig beim Lesen, hilfsbereit beim Schreiben.
 *
 * Deshalb ist das Ergebnis ein Hinweis, keine Sperre. Der Nutzer kann
 * speichern, was er will — die App sagt ihm nur, dass etwas nicht stimmt.
 * Eine halbe Bankverbindung in der Akte ist mehr wert als gar keine.
 *
 * Verfahren nach ISO 13616: Die ersten vier Zeichen ans Ende, Buchstaben in
 * Zahlen umwandeln, das Ergebnis modulo 97 muss 1 ergeben.
 */

/** Erwartete Gesamtlänge je Land. Nur die für uns relevanten. */
const LENGTHS: Record<string, number> = {
  AT: 20,
  DE: 22,
  CH: 21,
  LI: 21,
  IT: 27,
  FR: 27,
  NL: 18,
  BE: 16,
  ES: 24,
  LU: 20,
};

export type IbanReason =
  | 'leer'
  | 'zu_kurz'
  | 'ungueltige_zeichen'
  | 'unbekanntes_land'
  | 'falsche_laenge'
  | 'pruefsumme';

export type IbanValidation =
  | { readonly valid: true }
  | { readonly valid: false; readonly reason: IbanReason };

/** Entfernt Leerzeichen und macht Großbuchstaben. */
export function normalizeIban(input: string): string {
  return input.replace(/\s/g, '').toUpperCase();
}

/** Formatiert eine IBAN in Vierergruppen für die Anzeige. */
export function formatIban(input: string): string {
  const raw = normalizeIban(input);
  const groups: string[] = [];
  for (let i = 0; i < raw.length; i += 4) {
    groups.push(raw.slice(i, i + 4));
  }
  return groups.join(' ');
}

/**
 * Prüft eine IBAN und nennt bei Ablehnung den Grund.
 *
 * Der Grund ist ein technischer Schlüssel, kein Text — die Oberfläche
 * übersetzt ihn über i18n. Ein leeres Feld gilt als ungültig mit dem Grund
 * 'leer'; ob das ein Problem ist, entscheidet der Screen, denn die IBAN ist
 * ein optionales Feld.
 */
export function validateIban(input: string): IbanValidation {
  const iban = normalizeIban(input);

  if (iban.length === 0) {
    return { valid: false, reason: 'leer' };
  }

  if (!/^[A-Z0-9]+$/.test(iban)) {
    return { valid: false, reason: 'ungueltige_zeichen' };
  }

  if (iban.length < 5) {
    return { valid: false, reason: 'zu_kurz' };
  }

  const country = iban.slice(0, 2);
  const expectedLength = LENGTHS[country];

  if (expectedLength === undefined) {
    // Unbekanntes Land: Wir prüfen trotzdem die Prüfsumme, aber ohne Länge.
    // Besser als abzulehnen — es gibt über siebzig IBAN-Länder.
    return verifyChecksum(iban)
      ? { valid: true }
      : { valid: false, reason: 'unbekanntes_land' };
  }

  if (iban.length !== expectedLength) {
    return { valid: false, reason: 'falsche_laenge' };
  }

  return verifyChecksum(iban)
    ? { valid: true }
    : { valid: false, reason: 'pruefsumme' };
}

/**
 * Rechnet die Prüfsumme nach ISO 13616.
 *
 * Die Zahl wird zu groß für normale Zahlentypen, deshalb wird sie
 * stückweise durch 97 geteilt — dasselbe Ergebnis, ohne Überlauf.
 */
function verifyChecksum(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);

  let digits = '';
  for (const char of rearranged) {
    if (char >= 'A' && char <= 'Z') {
      // A wird zu 10, B zu 11, und so weiter.
      digits += String(char.charCodeAt(0) - 55);
    } else {
      digits += char;
    }
  }

  let remainder = 0;
  for (const digit of digits) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}