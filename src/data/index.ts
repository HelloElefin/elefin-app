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

export type { Eintrag, NeuerEintrag } from './store';

export {
  DatenFehler,
  DatenFehlerCode,
  type DatenFehlerCodeWert,
} from './errors';

export {
  abmelden,
  allesLoeschen,
  hatKonto,
  type KontoSitzung,
  type LokaleSitzung,
  type Sitzung,
} from './session';

export { UMGEBUNG } from './supabase';