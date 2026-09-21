import { describe, expect, it } from 'vitest';

import { formatIban, validateIban } from './iban';

describe('IBAN-Prüfung', () => {
  it('erkennt gültige österreichische und deutsche IBANs', () => {
    expect(validateIban('AT61 1904 3002 3457 3201').valid).toBe(true);
    expect(validateIban('DE89 3704 0044 0532 0130 00').valid).toBe(true);
  });

  it('ignoriert Leerzeichen und Kleinschreibung', () => {
    expect(validateIban('at611904300234573201').valid).toBe(true);
  });

  it('erkennt einen Zahlendreher', () => {
    const result = validateIban('AT61 1904 3002 3457 3210');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('pruefsumme');
  });

  it('erkennt eine falsche Länge', () => {
    const result = validateIban('AT61 1904 3002 3457');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('falsche_laenge');
  });

  it('meldet ein leeres Feld gesondert', () => {
    const result = validateIban('   ');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('leer');
  });

  it('formatiert in Vierergruppen', () => {
    expect(formatIban('AT611904300234573201')).toBe(
      'AT61 1904 3002 3457 3201',
    );
  });
});