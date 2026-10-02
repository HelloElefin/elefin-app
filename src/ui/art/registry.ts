/**
 * Das Verzeichnis: eine ID, eine Zeichnung.
 *
 * Alles außerhalb dieses Ordners kennt nur IDs, nie die Zeichnung selbst.
 * Deshalb kann eine Zeichnung ausgetauscht oder ergänzt werden, ohne dass
 * ein Screen davon erfährt. Die IDs stehen im Katalog und sind Daten —
 * sie werden nicht umbenannt.
 */
import type { ComponentType } from 'react';

import {
  Briefkasten,
  Checkliste,
  Dose,
  Fueller,
  Haus,
  Menschen,
  Napf,
  Ordner,
  Schliessfach,
  Schublade,
  Verlauf,
  Wolke,
  Zettel,
  type DrawingProps,
} from './drawings';
import type { ArtId } from './ids';

export const DRAWINGS: Record<ArtId, ComponentType<DrawingProps>> = {
  dose: Dose,
  haus: Haus,
  napf: Napf,
  ordner: Ordner,
  briefkasten: Briefkasten,
  fueller: Fueller,
  zettel: Zettel,
  schublade: Schublade,
  schliessfach: Schliessfach,
  checkliste: Checkliste,
  menschen: Menschen,
  wolke: Wolke,
  verlauf: Verlauf,
};