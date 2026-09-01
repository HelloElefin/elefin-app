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

import { textNachUtf8, zufallsBytes } from './bytes';
import { KryptoFehler, KryptoFehlerCode } from './fehler';

/**
 * 32 Zeichen, Crockfords Base32 ohne die verwechselbaren.
 * Diese Reihenfolge darf NIE geändert werden — sonst lassen sich bereits
 * ausgedruckte Schlüssel nicht mehr einlesen.
 */
const ZEICHEN = '23456789ABCDEFGHJKMNPQRSTVWXYZ*+';

/**
 * Verwechselbare Eingaben und das Zeichen, das gemeint war.
 * Wer von einem Ausdruck abtippt, verliest sich hier am häufigsten.
 */
const VERWECHSLUNGEN: Record<string, string> = {
  O: '0',
  I: '1',
  L: '1',
};

/** Zeichen, die es im Vorrat nicht gibt und die daher nie gemeint sein können. */
const NICHT_IM_VORRAT = new Set(['0', '1']);

/** Gesamtlänge ohne Bindestriche. */
const LAENGE = 28;

/** Zeichen je Gruppe in der Anzeige. */
const GRUPPE = 4;

/**
 * Erzeugt einen neuen Sicherheitsschlüssel in der Anzeigeform mit
 * Bindestrichen. Genau so wird er dem Nutzer gezeigt und ausgedruckt.
 */
export function sicherheitsschluesselErzeugen(): string {
  const zufall = zufallsBytes(LAENGE - 1);
  let roh = '';
  for (const byte of zufall) {
    // Rest bei Division durch 32 wählt ein Zeichen aus dem Vorrat.
    // 256 ist durch 32 teilbar, deshalb ist jedes Zeichen gleich wahrscheinlich.
    roh += ZEICHEN[byte % ZEICHEN.length];
  }
  return formatieren(roh + pruefzeichen(roh));
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
function pruefzeichen(roh: string): string {
  const hash = sha256(textNachUtf8(roh));
  return ZEICHEN[hash[0]! % ZEICHEN.length]!;
}

/** Setzt die Bindestriche für die Anzeige. */
function formatieren(roh: string): string {
  const gruppen: string[] = [];
  for (let i = 0; i < roh.length; i += GRUPPE) {
    gruppen.push(roh.slice(i, i + GRUPPE));
  }
  return gruppen.join('-');
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
function bereinigen(eingabe: string): string {
  const ohneTrenner = eingabe.toUpperCase().replace(/[\s-]/g, '');

  let bereinigt = '';
  for (const zeichen of ohneTrenner) {
    const gemeint = VERWECHSLUNGEN[zeichen] ?? zeichen;
    if (NICHT_IM_VORRAT.has(gemeint)) continue;
    bereinigt += gemeint;
  }
  return bereinigt;
}

/**
 * Prüft eine Eingabe und gibt die bereinigte Form zurück.
 *
 * Wirft E-CR04 bei falscher Länge oder unbekannten Zeichen,
 * E-CR05 bei falscher Prüfziffer — das ist der Tippfehler-Fall, und die
 * Oberfläche sollte darauf mit "Bitte nochmal prüfen" reagieren, nicht mit
 * "Schlüssel ungültig".
 */
export function sicherheitsschluesselPruefen(eingabe: string): string {
  const roh = bereinigen(eingabe);

  if (roh.length !== LAENGE) {
    throw new KryptoFehler(
      KryptoFehlerCode.SICHERHEITSSCHLUESSEL_FORM,
      `Eingabe hat ${roh.length} Zeichen, erwartet werden ${LAENGE}.`,
    );
  }

  for (const zeichen of roh) {
    if (!ZEICHEN.includes(zeichen)) {
      throw new KryptoFehler(
        KryptoFehlerCode.SICHERHEITSSCHLUESSEL_FORM,
        'Eingabe enthält ein Zeichen, das nicht zum Vorrat gehört.',
      );
    }
  }

  const inhalt = roh.slice(0, LAENGE - 1);
  if (roh[LAENGE - 1] !== pruefzeichen(inhalt)) {
    throw new KryptoFehler(
      KryptoFehlerCode.SICHERHEITSSCHLUESSEL_PRUEFZIFFER,
      'Prüfzeichen stimmt nicht — vermutlich ein Tippfehler.',
    );
  }

  return roh;
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
export function sicherheitsschluesselAbleiten(geprueft: string): Uint8Array {
  return sha256(textNachUtf8('elefin/sicherheitsschluessel/v1' + geprueft));
}