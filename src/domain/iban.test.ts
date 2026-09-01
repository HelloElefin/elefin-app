import { describe, expect, it } from 'vitest';

import { ibanFormatieren, ibanPruefen } from './iban';

describe('IBAN-Prüfung', () => {
  it('erkennt gültige österreichische und deutsche IBANs', () => {
    expect(ibanPruefen('AT61 1904 3002 3457 3201').gueltig).toBe(true);
    expect(ibanPruefen('DE89 3704 0044 0532 0130 00').gueltig).toBe(true);
  });

  it('ignoriert Leerzeichen und Kleinschreibung', () => {
    expect(ibanPruefen('at611904300234573201').gueltig).toBe(true);
  });

  it('erkennt einen Zahlendreher', () => {
    const ergebnis = ibanPruefen('AT61 1904 3002 3457 3210');
    expect(ergebnis.gueltig).toBe(false);
    if (!ergebnis.gueltig) expect(ergebnis.grund).toBe('pruefsumme');
  });

  it('erkennt eine falsche Länge', () => {
    const ergebnis = ibanPruefen('AT61 1904 3002 3457');
    expect(ergebnis.gueltig).toBe(false);
    if (!ergebnis.gueltig) expect(ergebnis.grund).toBe('falsche_laenge');
  });

  it('meldet ein leeres Feld gesondert', () => {
    const ergebnis = ibanPruefen('   ');
    expect(ergebnis.gueltig).toBe(false);
    if (!ergebnis.gueltig) expect(ergebnis.grund).toBe('leer');
  });

  it('formatiert in Vierergruppen', () => {
    expect(ibanFormatieren('AT611904300234573201')).toBe(
      'AT61 1904 3002 3457 3201',
    );
  });
});