/**
 * Was das Gerät sich merkt.
 *
 * Es gibt ZWEI Zustände:
 *
 *   LOKAL — kein Konto. Nur ein zufälliger Geräteschlüssel, der die lokale
 *   Datenbank schützt. Kein Generalschlüssel, kein Schlüsselpaar, weil
 *   nichts geteilt und nichts hochgeladen wird.
 *
 *   MIT KONTO — zusätzlich Generalschlüssel und privater X25519-Schlüssel.
 *
 * Alles liegt im Android-Keystore bzw. iOS-Schlüsselbund, nie als
 * gewöhnliche Datei.
 *
 * GRUNDREGEL: Die Gerätebindung ist Bequemlichkeit, kein Fundament. Was hier
 * liegt, ist eine Abkürzung für den Nutzer — kein Zugang, der ohne Passwort
 * oder Sicherheitsschlüssel entstehen könnte.
 *
 * Ausnahme ist der lokale Modus: Dort IST der Geräteschlüssel der einzige
 * Schlüssel. Das ist der Preis dafür, dass die App ohne Konto funktioniert,
 * und es ist ehrlich zu benennen: Wer das Gerät verliert, verliert die
 * lokalen Daten. Genau deshalb gibt es den PDF-Export und die Einladung,
 * ein Konto anzulegen.
 */
import * as SecureStore from 'expo-secure-store';

import { bytesNachText, textNachBytes, zufallsBytes } from '@/crypto';

import { DatenFehler, DatenFehlerCode } from './fehler';

const GERAETESCHLUESSEL = 'elefin.geraeteschluessel';
const GENERALSCHLUESSEL = 'elefin.generalschluessel';
const PRIVATER_SCHLUESSEL = 'elefin.privatschluessel';
const NUTZER_ID = 'elefin.nutzerid';

/** Der lokale Zustand: kein Konto, nur ein Geräteschlüssel. */
export type LokaleSitzung = {
  readonly art: 'lokal';
  readonly geraeteschluessel: Uint8Array;
};

/** Der angemeldete Zustand. */
export type KontoSitzung = {
  readonly art: 'konto';
  readonly nutzerId: string;
  readonly generalschluessel: Uint8Array;
  readonly privatSchluessel: Uint8Array;
};

export type Sitzung = LokaleSitzung | KontoSitzung;

/**
 * Holt den Geräteschlüssel und legt ihn beim ersten Aufruf an.
 *
 * Wird beim allerersten App-Start aufgerufen, noch vor jedem Onboarding.
 * Ab diesem Moment kann die App lokal verschlüsselt speichern.
 */
export async function geraeteschluesselHolen(): Promise<Uint8Array> {
  const vorhanden = await SecureStore.getItemAsync(GERAETESCHLUESSEL);
  if (vorhanden !== null) {
    return textNachBytes(vorhanden);
  }

  const neu = zufallsBytes(32);
  await SecureStore.setItemAsync(GERAETESCHLUESSEL, bytesNachText(neu));
  return neu;
}

/** Legt die Kontodaten ab. Nach jedem erfolgreichen Entsperren. */
export async function kontoSitzungSpeichern(
  sitzung: Omit<KontoSitzung, 'art'>,
): Promise<void> {
  await SecureStore.setItemAsync(NUTZER_ID, sitzung.nutzerId);
  await SecureStore.setItemAsync(
    GENERALSCHLUESSEL,
    bytesNachText(sitzung.generalschluessel),
  );
  await SecureStore.setItemAsync(
    PRIVATER_SCHLUESSEL,
    bytesNachText(sitzung.privatSchluessel),
  );
}

/**
 * Ermittelt den aktuellen Zustand.
 *
 * Gibt es Kontodaten, gilt der Kontozustand. Sonst der lokale — der
 * Geräteschlüssel wird dabei bei Bedarf angelegt. Diese Funktion gibt also
 * immer eine Sitzung zurück, nie null.
 */
export async function sitzungLaden(): Promise<Sitzung> {
  const nutzerId = await SecureStore.getItemAsync(NUTZER_ID);
  const general = await SecureStore.getItemAsync(GENERALSCHLUESSEL);
  const privat = await SecureStore.getItemAsync(PRIVATER_SCHLUESSEL);

  if (nutzerId !== null && general !== null && privat !== null) {
    return {
      art: 'konto',
      nutzerId,
      generalschluessel: textNachBytes(general),
      privatSchluessel: textNachBytes(privat),
    };
  }

  return {
    art: 'lokal',
    geraeteschluessel: await geraeteschluesselHolen(),
  };
}

/**
 * Gibt den Schlüssel, mit dem Datenschlüssel verpackt werden.
 *
 * Lokal ist das der Geräteschlüssel, mit Konto der Generalschlüssel. Für
 * die Ablage ist der Unterschied damit erledigt — sie verpackt einfach mit
 * dem, was sie hier bekommt.
 */
export async function verpackungsSchluesselHolen(): Promise<Uint8Array> {
  const sitzung = await sitzungLaden();
  return sitzung.art === 'konto'
    ? sitzung.generalschluessel
    : sitzung.geraeteschluessel;
}

/**
 * Fordert eine Kontositzung. Wirft E-DB03, wenn nur der lokale Zustand
 * vorliegt. Für alles, was ohne Konto nicht geht: Freigaben, Umschläge,
 * Serverzugriff.
 */
export async function kontoSitzungFordern(): Promise<KontoSitzung> {
  const sitzung = await sitzungLaden();
  if (sitzung.art !== 'konto') {
    throw new DatenFehler(
      DatenFehlerCode.NICHT_ANGEMELDET,
      'Dieser Vorgang benötigt ein Konto.',
    );
  }
  return sitzung;
}

/** Ob ein Konto eingerichtet und entsperrt ist. */
export async function hatKonto(): Promise<boolean> {
  return (await SecureStore.getItemAsync(GENERALSCHLUESSEL)) !== null;
}

/**
 * Meldet ab: löscht die Kontodaten, behält den Geräteschlüssel.
 *
 * Der Geräteschlüssel bleibt, weil lokale Daten weiter lesbar sein sollen —
 * Abmelden ist nicht dasselbe wie Alles-Löschen.
 */
export async function abmelden(): Promise<void> {
  await SecureStore.deleteItemAsync(NUTZER_ID);
  await SecureStore.deleteItemAsync(GENERALSCHLUESSEL);
  await SecureStore.deleteItemAsync(PRIVATER_SCHLUESSEL);
}

/**
 * Löscht restlos alles, auch den Geräteschlüssel.
 *
 * Danach sind die lokalen Daten unwiederbringlich unlesbar. Nur für
 * "Alle Daten löschen" im Einstellungsbereich.
 */
export async function allesLoeschen(): Promise<void> {
  await abmelden();
  await SecureStore.deleteItemAsync(GERAETESCHLUESSEL);
}