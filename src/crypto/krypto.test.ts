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

import { zufallsBytes } from './bytes';
import { KryptoFehler, KryptoFehlerCode } from './fehler';
import {
  AKTUELLE_SCHEMA_VERSION,
  inhaltEntschluesseln,
  inhaltVerschluesseln,
} from './inhalt';
import {
  datenschluesselErzeugen,
  generalschluesselAuspacken,
  generalschluesselErzeugen,
  generalschluesselVerpacken,
} from './schluessel';
import {
  sicherheitsschluesselAbleiten,
  sicherheitsschluesselErzeugen,
  sicherheitsschluesselPruefen,
} from './sicherheitsschluessel';
import {
  schluesselpaarErzeugen,
  umschlagAuspacken,
  umschlagVerpacken,
} from './umschlag';

/** Muster für die Testinhalte. In der echten App kommen die aus src/domain. */
const TestInhalt = z.object({
  schemaVersion: z.number(),
  titel: z.string(),
  text: z.string(),
});

describe('Verschlüsseln und Entschlüsseln', () => {
  it('ergibt wieder das Original', () => {
    const schluessel = datenschluesselErzeugen();
    const eintragId = 'eintrag-1';
    const original = { titel: 'Sparkonto', text: 'AT12 3456 7890' };

    const verpackt = inhaltVerschluesseln(schluessel, eintragId, original);
    const zurueck = inhaltEntschluesseln(
      schluessel,
      eintragId,
      verpackt,
      TestInhalt,
    );

    expect(zurueck.titel).toBe(original.titel);
    expect(zurueck.text).toBe(original.text);
    expect(zurueck.schemaVersion).toBe(AKTUELLE_SCHEMA_VERSION);
  });

  it('schlägt mit einem falschen Schlüssel fehl', () => {
    const richtig = datenschluesselErzeugen();
    const falsch = datenschluesselErzeugen();
    const eintragId = 'eintrag-1';

    const verpackt = inhaltVerschluesseln(richtig, eintragId, {
      titel: 'Sparkonto',
      text: 'AT12 3456 7890',
    });

    expect(() =>
      inhaltEntschluesseln(falsch, eintragId, verpackt, TestInhalt),
    ).toThrow(KryptoFehler);
  });

  it('schlägt fehl, wenn das Chiffrat in eine andere Zeile verschoben wird', () => {
    const schluessel = datenschluesselErzeugen();

    const verpackt = inhaltVerschluesseln(schluessel, 'eintrag-1', {
      titel: 'Sparkonto',
      text: 'AT12 3456 7890',
    });

    // Derselbe Schlüssel, aber eine fremde Eintrags-ID.
    expect(() =>
      inhaltEntschluesseln(schluessel, 'eintrag-2', verpackt, TestInhalt),
    ).toThrow(KryptoFehler);
  });
});

describe('Umschläge', () => {
  it('lassen sich vom Empfänger öffnen', () => {
    const anna = schluesselpaarErzeugen();
    const datenschluessel = datenschluesselErzeugen();

    const umschlag = umschlagVerpacken(datenschluessel, anna.oeffentlich);
    const ausgepackt = umschlagAuspacken(umschlag, anna.privat);

    expect(ausgepackt).toEqual(datenschluessel);
  });

  it('sind für Dritte nicht lesbar', () => {
    const anna = schluesselpaarErzeugen();
    const schwester = schluesselpaarErzeugen();
    const datenschluessel = datenschluesselErzeugen();

    // Für Anna verpackt — die Schwester darf nicht herankommen.
    const umschlag = umschlagVerpacken(datenschluessel, anna.oeffentlich);

    expect(() => umschlagAuspacken(umschlag, schwester.privat)).toThrow(
      KryptoFehler,
    );
  });

  it('erzeugen für denselben Inhalt jedes Mal ein anderes Ergebnis', () => {
    const anna = schluesselpaarErzeugen();
    const datenschluessel = datenschluesselErzeugen();

    const a = umschlagVerpacken(datenschluessel, anna.oeffentlich);
    const b = umschlagVerpacken(datenschluessel, anna.oeffentlich);

    // Zwei gleiche Umschläge würden verraten, dass derselbe Schlüssel
    // zweimal verpackt wurde — also dass zwei Einträge zusammengehören.
    expect(a).not.toBe(b);
  });
});

describe('Generalschlüssel', () => {
  it('öffnet sich mit jeder seiner Verpackungen gleichermaßen', () => {
    const generalschluessel = generalschluesselErzeugen();

    // Zwei verschiedene Kisten, in der echten App: Passwort und
    // Sicherheitsschlüssel. Hier stehen zwei Zufallsschlüssel dafür,
    // weil die Ableitung selbst nicht Gegenstand dieses Tests ist.
    const ausPasswort = zufallsBytes(32);
    const ausSicherheitsschluessel = zufallsBytes(32);

    const kiste1 = generalschluesselVerpacken(generalschluessel, ausPasswort);
    const kiste2 = generalschluesselVerpacken(
      generalschluessel,
      ausSicherheitsschluessel,
    );

    expect(generalschluesselAuspacken(kiste1, ausPasswort)).toEqual(
      generalschluessel,
    );
    expect(
      generalschluesselAuspacken(kiste2, ausSicherheitsschluessel),
    ).toEqual(generalschluessel);
  });

  it('bleibt bei einem Passwortwechsel derselbe', () => {
    const generalschluessel = generalschluesselErzeugen();
    const altesPasswort = zufallsBytes(32);
    const neuesPasswort = zufallsBytes(32);

    const alteKiste = generalschluesselVerpacken(
      generalschluessel,
      altesPasswort,
    );

    // Passwortwechsel: auspacken, mit dem neuen Schlüssel neu verpacken.
    const ausgepackt = generalschluesselAuspacken(alteKiste, altesPasswort);
    const neueKiste = generalschluesselVerpacken(ausgepackt, neuesPasswort);

    // Entscheidend: Es ist derselbe Generalschlüssel. Deshalb bleiben alle
    // bestehenden Freigaben gültig und nichts muss neu verschlüsselt werden.
    expect(generalschluesselAuspacken(neueKiste, neuesPasswort)).toEqual(
      generalschluessel,
    );
  });
});

describe('Sicherheitsschlüssel', () => {
  it('hat die vereinbarte Form', () => {
    const schluessel = sicherheitsschluesselErzeugen();

    expect(schluessel).toMatch(/^[2-9A-HJ-NP-Z*+]{4}(-[2-9A-HJ-NP-Z*+]{4}){6}$/);
  });

  it('wird trotz Bindestrichen und Kleinschreibung erkannt', () => {
    const schluessel = sicherheitsschluesselErzeugen();

    const geprueft = sicherheitsschluesselPruefen(schluessel);
    const gleichwertig = sicherheitsschluesselPruefen(
      schluessel.toLowerCase().replace(/-/g, ' '),
    );

    expect(gleichwertig).toBe(geprueft);
  });

  it('erkennt einen Tippfehler an der Prüfziffer', () => {
    const schluessel = sicherheitsschluesselErzeugen();

    // Erstes Zeichen verändern, aber im gültigen Vorrat bleiben.
    const ersteZeichen = schluessel[0] === '2' ? '3' : '2';
    const vertippt = ersteZeichen + schluessel.slice(1);

    try {
      sicherheitsschluesselPruefen(vertippt);
      expect.unreachable('Hätte einen Fehler werfen müssen.');
    } catch (fehler) {
      expect(fehler).toBeInstanceOf(KryptoFehler);
      expect((fehler as KryptoFehler).code).toBe(
        KryptoFehlerCode.SICHERHEITSSCHLUESSEL_PRUEFZIFFER,
      );
    }
  });

  it('ergibt für denselben Schlüssel immer dieselbe Ableitung', () => {
    const schluessel = sicherheitsschluesselErzeugen();
    const geprueft = sicherheitsschluesselPruefen(schluessel);

    // Das ist die Grundlage dafür, dass der Ausdruck auf einem beliebigen
    // Gerät funktioniert — auch Jahre später.
    expect(sicherheitsschluesselAbleiten(geprueft)).toEqual(
      sicherheitsschluesselAbleiten(geprueft),
    );
  });
});