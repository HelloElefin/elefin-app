/**
 * Den Fragenkatalog laden und prüfen.
 *
 * catalog.json ist eine Datei wie jede andere: TypeScript weiß beim
 * Übersetzen nur, dass dort irgendwelche Texte stehen — nicht, dass 'kind'
 * wirklich 'frame' oder 'question' ist. Diese Datei prüft das einmal beim
 * Start und gibt danach einen sauber typisierten Katalog zurück.
 *
 * Stimmt etwas nicht, bricht die App sofort mit einer deutlichen Meldung ab,
 * statt später an irgendeinem Screen etwas Leeres anzuzeigen. Der Katalog
 * liegt im Programm, nicht beim Nutzer — ein Fehler darin ist immer unser
 * Fehler und muss beim ersten Start auffallen.
 */
import { z } from 'zod';

import { isCategory, type Category } from '@/domain';

import catalogJson from './catalog.json';
import type { Catalog } from './types';

/** Fehler im Katalog. Enthält nie Nutzerinhalte — der Katalog ist Programmcode. */
export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogError';
  }
}

/** Eine Kategorie-ID, die es wirklich gibt (aus src/domain/categories.ts). */
const categoryId = z.custom<Category>(isCategory, 'keine bekannte Kategorie-ID');

const optionSchema = z.object({
  value: z.string().min(1),
});

const fieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['text', 'choice', 'multi']),
  options: z.array(optionSchema).optional(),
  allowUnknown: z.boolean(),
  inDisclosure: z.boolean(),
});

const screenSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['frame', 'question']),
  block: z.string().min(1),
  category: categoryId.optional(),
  showIf: categoryId.optional(),
  repeatable: z.boolean(),
  trustNote: z.boolean().optional(),
  fields: z.array(fieldSchema),
});

const catalogSchema = z.object({
  schemaVersion: z.number(),
  screens: z.array(screenSchema).min(1),
});

/**
 * Prüft beliebige Daten und gibt sie als Katalog zurück.
 *
 * Getrennt von loadCatalog, damit die Tests auch kleine erfundene Kataloge
 * durchschicken können.
 */
export function parseCatalog(raw: unknown): Catalog {
  const result = catalogSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => {
      const where = issue.path.length > 0 ? issue.path.join('.') : 'Katalog';
      return `  ${where}: ${issue.message}`;
    });
    throw new CatalogError(`Der Fragenkatalog ist fehlerhaft:\n${lines.join('\n')}`);
  }
  return result.data;
}

let geprueft: Catalog | null = null;

/**
 * Der Katalog der App. Beim ersten Aufruf geprüft, danach gemerkt.
 */
export function loadCatalog(): Catalog {
  geprueft ??= parseCatalog(catalogJson);
  return geprueft;
}

/** Einen Screen über seine ID holen. Wirft, wenn es ihn nicht gibt. */
export function screenById(catalog: Catalog, id: string) {
  const screen = catalog.screens.find((s) => s.id === id);
  if (!screen) throw new CatalogError(`Screen "${id}" gibt es im Katalog nicht.`);
  return screen;
}