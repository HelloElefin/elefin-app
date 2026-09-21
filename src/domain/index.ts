/**
 * Fassade des Fachbereichs. Wie bei src/crypto gilt: Der Rest der App
 * greift über '@/domain' zu, nicht auf einzelne Dateien.
 */
export {
  AKTIVE_KATEGORIEN,
  KATEGORIEN,
  istAktiv,
  istKategorie,
  type Kategorie,
} from './categories';

export { BankAccountInhalt } from './bank-accounts';

export {
  ibanFormatieren,
  ibanNormalisieren,
  ibanPruefen,
  type IbanGrund,
  type IbanPruefung,
} from './iban';