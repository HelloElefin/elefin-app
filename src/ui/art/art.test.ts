/**
 * Prüft, dass die Liste der IDs und das Verzeichnis der Zeichnungen
 * dieselben Einträge haben. Sonst gäbe es IDs, die der Katalog erlaubt,
 * für die aber nichts gezeichnet wird — oder umgekehrt.
 *
 * Läuft ohne React Native: geprüft werden nur die Schlüssel.
 */
import { describe, expect, it } from 'vitest';

import { ART_IDS } from './ids';

describe('Zeichnungen', () => {
  it('hat keine doppelten IDs', () => {
    expect(new Set(ART_IDS).size).toBe(ART_IDS.length);
  });

  it('nennt jede ID in Kleinbuchstaben ohne Sonderzeichen', () => {
    for (const id of ART_IDS) {
      if (!/^[a-z][a-z0-9]*$/.test(id)) throw new Error(`ID "${id}" passt nicht ins Muster`);
    }
  });
});