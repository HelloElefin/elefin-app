/**
 * Fassade des Fachbereichs. Wie bei src/crypto gilt: Der Rest der App
 * greift über '@/domain' zu, nicht auf einzelne Dateien.
 */
export {
  AKTIVE_KATEGORIEN,
  CATEGORIES,
  istAktiv,
  isCategory,
  type Category,
} from './categories';

export { BankAccountContent } from './bank-accounts';

export {
  formatIban,
  normalizeIban,
  validateIban,
  type IbanReason,
  type IbanValidation,
} from './iban';