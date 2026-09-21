/**
 * Fassade des Fachbereichs. Wie bei src/crypto gilt: Der Rest der App
 * greift über '@/domain' zu, nicht auf einzelne Dateien.
 */
export { CATEGORIES, isCategory, type Category } from './categories';

export type { Answer, AnswerState } from './answer-state';

export type {
  CaseFile,
  ChildrenStatus,
  DeclaredCount,
  EntryMode,
  InventoryDeclaration,
  MaritalStatus,
  Market,
} from './case-file';

export { BankAccountContent } from './bank-accounts';

export {
  formatIban,
  normalizeIban,
  validateIban,
  type IbanReason,
  type IbanValidation,
} from './iban';