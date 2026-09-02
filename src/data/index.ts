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
} from './eintraege';

export type { Eintrag, NeuerEintrag } from './ablage';

export {
  DatenFehler,
  DatenFehlerCode,
  type DatenFehlerCodeWert,
} from './fehler';

export {
  abmelden,
  allesLoeschen,
  hatKonto,
  type KontoSitzung,
  type LokaleSitzung,
  type Sitzung,
} from './sitzung';

export { UMGEBUNG } from './supabase';