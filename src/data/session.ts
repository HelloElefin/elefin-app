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

import { bytesToText, textToBytes, secureRandomBytes } from '@/crypto';

import { DataError, DataErrorCode } from './errors';

const DEVICE_KEY = 'elefin.geraeteschluessel';
const MASTER_KEY = 'elefin.generalschluessel';
const PRIVATE_KEY = 'elefin.privatschluessel';
const USER_ID = 'elefin.nutzerid';

/** Der lokale Zustand: kein Konto, nur ein Geräteschlüssel. */
export type LocalSession = {
  readonly kind: 'lokal';
  readonly deviceKey: Uint8Array;
};

/** Der angemeldete Zustand. */
export type AccountSession = {
  readonly kind: 'konto';
  readonly userId: string;
  readonly masterKey: Uint8Array;
  readonly privateKey: Uint8Array;
};

export type AppSession = LocalSession | AccountSession;

/**
 * Holt den Geräteschlüssel und legt ihn beim ersten Aufruf an.
 *
 * Wird beim allerersten App-Start aufgerufen, noch vor jedem Onboarding.
 * Ab diesem Moment kann die App lokal verschlüsselt speichern.
 */
export async function getDeviceKey(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(DEVICE_KEY);
  if (existing !== null) {
    return textToBytes(existing);
  }

  const created = secureRandomBytes(32);
  await SecureStore.setItemAsync(DEVICE_KEY, bytesToText(created));
  return created;
}

/** Legt die Kontodaten ab. Nach jedem erfolgreichen Entsperren. */
export async function saveAccountSession(
  session: Omit<AccountSession, 'kind'>,
): Promise<void> {
  await SecureStore.setItemAsync(USER_ID, session.userId);
  await SecureStore.setItemAsync(
    MASTER_KEY,
    bytesToText(session.masterKey),
  );
  await SecureStore.setItemAsync(
    PRIVATE_KEY,
    bytesToText(session.privateKey),
  );
}

/**
 * Ermittelt den aktuellen Zustand.
 *
 * Gibt es Kontodaten, gilt der Kontozustand. Sonst der lokale — der
 * Geräteschlüssel wird dabei bei Bedarf angelegt. Diese Funktion gibt also
 * immer eine Sitzung zurück, nie null.
 */
export async function loadSession(): Promise<AppSession> {
  const userId = await SecureStore.getItemAsync(USER_ID);
  const masterKey = await SecureStore.getItemAsync(MASTER_KEY);
  const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY);

  if (userId !== null && masterKey !== null && privateKey !== null) {
    return {
      kind: 'konto',
      userId: userId,
      masterKey: textToBytes(masterKey),
      privateKey: textToBytes(privateKey),
    };
  }

  return {
    kind: 'lokal',
    deviceKey: await getDeviceKey(),
  };
}

/**
 * Gibt den Schlüssel, mit dem Datenschlüssel verpackt werden.
 *
 * Lokal ist das der Geräteschlüssel, mit Konto der Generalschlüssel. Für
 * die Ablage ist der Unterschied damit erledigt — sie verpackt einfach mit
 * dem, was sie hier bekommt.
 */
export async function getWrappingKey(): Promise<Uint8Array> {
  const session = await loadSession();
  return session.kind === 'konto'
    ? session.masterKey
    : session.deviceKey;
}

/**
 * Fordert eine Kontositzung. Wirft E-DB03, wenn nur der lokale Zustand
 * vorliegt. Für alles, was ohne Konto nicht geht: Freigaben, Umschläge,
 * Serverzugriff.
 */
export async function requireAccountSession(): Promise<AccountSession> {
  const session = await loadSession();
  if (session.kind !== 'konto') {
    throw new DataError(
      DataErrorCode.NOT_SIGNED_IN,
      'Dieser Vorgang benötigt ein Konto.',
    );
  }
  return session;
}

/** Ob ein Konto eingerichtet und entsperrt ist. */
export async function hasAccount(): Promise<boolean> {
  return (await SecureStore.getItemAsync(MASTER_KEY)) !== null;
}

/**
 * Meldet ab: löscht die Kontodaten, behält den Geräteschlüssel.
 *
 * Der Geräteschlüssel bleibt, weil lokale Daten weiter lesbar sein sollen —
 * Abmelden ist nicht dasselbe wie Alles-Löschen.
 */
export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_ID);
  await SecureStore.deleteItemAsync(MASTER_KEY);
  await SecureStore.deleteItemAsync(PRIVATE_KEY);
}

/**
 * Löscht restlos alles, auch den Geräteschlüssel.
 *
 * Danach sind die lokalen Daten unwiederbringlich unlesbar. Nur für
 * "Alle Daten löschen" im Einstellungsbereich.
 */
export async function deleteAll(): Promise<void> {
  await signOut();
  await SecureStore.deleteItemAsync(DEVICE_KEY);
}