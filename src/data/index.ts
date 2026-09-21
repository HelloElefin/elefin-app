/**
 * Fassade der Datenschicht. Der Rest der App greift über '@/data' zu.
 */
export {
  anzahlJeKategorie,
  eintraegeLaden,
  eintragAendern,
  eintragAnlegen,
  eintragLaden,
  eintragLoeschen,
} from './entries';

export type { Entry, NewEntry } from './store';

export {
  DataError,
  DatenFehlerCode,
  type DatenFehlerCodeWert,
} from './errors';

export {
  signOut,
  deleteAll,
  hatKonto,
  type KontoSitzung,
  type LokaleSitzung,
  type Sitzung,
} from './session';

export { ENVIRONMENT } from './supabase';