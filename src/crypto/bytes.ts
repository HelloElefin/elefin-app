/**
 * Umwandlung zwischen Bytes und Text, plus sicherer Zufall.
 *
 * Warum das eine eigene Datei ist: Diese Funktionen haben nichts mit
 * Kryptografie zu tun, werden aber überall darin gebraucht. Getrennt
 * gehalten bleibt der eigentliche Krypto-Code lesbar.
 *
 * Grundregel für den ganzen Ordner:
 *   Gerechnet wird IMMER mit Uint8Array (rohen Bytes).
 *   Gespeichert wird IMMER als base64-Text.
 * Die Umwandlung passiert nur an der Grenze, nie mittendrin.
 */
import { randomBytes } from '@noble/hashes/utils.js';

/**
 * Sicherer Zufall vom Betriebssystem.
 *
 * Kommt über react-native-get-random-values, das in _layout.tsx als
 * allererste Zeile importiert wird. Fehlt dieser Import, wirft die
 * Funktion einen Fehler — das ist gewollt und besser als schwacher
 * Zufall, den niemand bemerkt.
 *
 * Niemals Math.random() für irgendetwas Kryptografisches verwenden.
 */
export function zufallsBytes(anzahl: number): Uint8Array {
  return randomBytes(anzahl);
}

/** Bytes -> base64-Text. Für alles, was in einer Textspalte landet. */
export function bytesNachText(bytes: Uint8Array): string {
  let binaer = '';
  for (const byte of bytes) {
    binaer += String.fromCharCode(byte);
  }
  return btoa(binaer);
}

/** base64-Text -> Bytes. Kehrt bytesNachText um. */
export function textNachBytes(text: string): Uint8Array {
  const binaer = atob(text);
  const bytes = new Uint8Array(binaer.length);
  for (let i = 0; i < binaer.length; i++) {
    // charCodeAt liefert immer eine Zahl, weil i innerhalb der Länge liegt.
    bytes[i] = binaer.charCodeAt(i);
  }
  return bytes;
}

/** Text -> Bytes (UTF-8). Für Passwörter und andere Zeichenketten. */
export function textNachUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** Bytes (UTF-8) -> Text. Kehrt textNachUtf8 um. */
export function utf8NachText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Hängt mehrere Byte-Folgen aneinander.
 * Wird gebraucht, um Umschläge zusammenzusetzen und wieder zu zerlegen.
 */
export function bytesVerbinden(...teile: Uint8Array[]): Uint8Array {
  const gesamt = teile.reduce((summe, teil) => summe + teil.length, 0);
  const ergebnis = new Uint8Array(gesamt);
  let position = 0;
  for (const teil of teile) {
    ergebnis.set(teil, position);
    position += teil.length;
  }
  return ergebnis;
}

/**
 * Vergleicht zwei Byte-Folgen in konstanter Zeit.
 *
 * Ein gewöhnlicher Vergleich bricht beim ersten Unterschied ab. Aus der
 * Zeit, die er braucht, lässt sich ableiten, wie viele Zeichen schon
 * stimmten — damit kann ein Angreifer einen Wert Zeichen für Zeichen
 * erraten. Diese Fassung braucht immer gleich lange.
 *
 * Für Prüfsummen und Vergleiche von Geheimnissen verwenden, nicht für
 * gewöhnliche Daten.
 */
export function bytesGleich(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let unterschied = 0;
  for (let i = 0; i < a.length; i++) {
    // Das Ausrufezeichen sagt TypeScript: An dieser Stelle existiert der Wert.
    // Das ist hier sicher, weil i kleiner als a.length ist und beide gleich lang sind.
    unterschied |= a[i]! ^ b[i]!;
  }
  return unterschied === 0;
}