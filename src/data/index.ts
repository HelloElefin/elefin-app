/**
 * Fassade der Datenschicht. Der Rest der App greift über '@/data' zu.
 */
export {
  countByCategory,
  loadEntries,
  updateEntry,
  createEntry,
  loadEntry,
  deleteEntry,
} from './entries';

export type { Entry, NewEntry } from './store';

export {
  DataError,
  DataErrorCode,
  type DataErrorCodeValue,
} from './errors';

export {
  signOut,
  deleteAll,
  hasAccount,
  type AccountSession,
  type LocalSession,
  type AppSession,
} from './session';

export { ENVIRONMENT } from './supabase';