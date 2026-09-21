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
export function secureRandomBytes(count: number): Uint8Array {
  return randomBytes(count);
}

/** Bytes -> base64-Text. Für alles, was in einer Textspalte landet. */
export function bytesToText(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/** base64-Text -> Bytes. Kehrt bytesNachText um. */
export function textToBytes(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    // charCodeAt liefert immer eine Zahl, weil i innerhalb der Länge liegt.
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Text -> Bytes (UTF-8). Für Passwörter und andere Zeichenketten. */
export function textToUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** Bytes (UTF-8) -> Text. Kehrt textNachUtf8 um. */
export function utf8ToText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Hängt mehrere Byte-Folgen aneinander.
 * Wird gebraucht, um Umschläge zusammenzusetzen und wieder zu zerlegen.
 */
export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let position = 0;
  for (const part of parts) {
    result.set(part, position);
    position += part.length;
  }
  return result;
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
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    // Das Ausrufezeichen sagt TypeScript: An dieser Stelle existiert der Wert.
    // Das ist hier sicher, weil i kleiner als a.length ist und beide gleich lang sind.
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}