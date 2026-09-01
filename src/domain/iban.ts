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
const LAENGEN: Record<string, number> = {
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

export type IbanGrund =
  | 'leer'
  | 'zu_kurz'
  | 'ungueltige_zeichen'
  | 'unbekanntes_land'
  | 'falsche_laenge'
  | 'pruefsumme';

export type IbanPruefung =
  | { readonly gueltig: true }
  | { readonly gueltig: false; readonly grund: IbanGrund };

/** Entfernt Leerzeichen und macht Großbuchstaben. */
export function ibanNormalisieren(eingabe: string): string {
  return eingabe.replace(/\s/g, '').toUpperCase();
}

/** Formatiert eine IBAN in Vierergruppen für die Anzeige. */
export function ibanFormatieren(eingabe: string): string {
  const roh = ibanNormalisieren(eingabe);
  const gruppen: string[] = [];
  for (let i = 0; i < roh.length; i += 4) {
    gruppen.push(roh.slice(i, i + 4));
  }
  return gruppen.join(' ');
}

/**
 * Prüft eine IBAN und nennt bei Ablehnung den Grund.
 *
 * Der Grund ist ein technischer Schlüssel, kein Text — die Oberfläche
 * übersetzt ihn über i18n. Ein leeres Feld gilt als ungültig mit dem Grund
 * 'leer'; ob das ein Problem ist, entscheidet der Screen, denn die IBAN ist
 * ein optionales Feld.
 */
export function ibanPruefen(eingabe: string): IbanPruefung {
  const iban = ibanNormalisieren(eingabe);

  if (iban.length === 0) {
    return { gueltig: false, grund: 'leer' };
  }

  if (!/^[A-Z0-9]+$/.test(iban)) {
    return { gueltig: false, grund: 'ungueltige_zeichen' };
  }

  if (iban.length < 5) {
    return { gueltig: false, grund: 'zu_kurz' };
  }

  const land = iban.slice(0, 2);
  const erwarteteLaenge = LAENGEN[land];

  if (erwarteteLaenge === undefined) {
    // Unbekanntes Land: Wir prüfen trotzdem die Prüfsumme, aber ohne Länge.
    // Besser als abzulehnen — es gibt über siebzig IBAN-Länder.
    return pruefsummePruefen(iban)
      ? { gueltig: true }
      : { gueltig: false, grund: 'unbekanntes_land' };
  }

  if (iban.length !== erwarteteLaenge) {
    return { gueltig: false, grund: 'falsche_laenge' };
  }

  return pruefsummePruefen(iban)
    ? { gueltig: true }
    : { gueltig: false, grund: 'pruefsumme' };
}

/**
 * Rechnet die Prüfsumme nach ISO 13616.
 *
 * Die Zahl wird zu groß für normale Zahlentypen, deshalb wird sie
 * stückweise durch 97 geteilt — dasselbe Ergebnis, ohne Überlauf.
 */
function pruefsummePruefen(iban: string): boolean {
  const umgestellt = iban.slice(4) + iban.slice(0, 4);

  let ziffern = '';
  for (const zeichen of umgestellt) {
    if (zeichen >= 'A' && zeichen <= 'Z') {
      // A wird zu 10, B zu 11, und so weiter.
      ziffern += String(zeichen.charCodeAt(0) - 55);
    } else {
      ziffern += zeichen;
    }
  }

  let rest = 0;
  for (const ziffer of ziffern) {
    rest = (rest * 10 + Number(ziffer)) % 97;
  }
  return rest === 1;
}