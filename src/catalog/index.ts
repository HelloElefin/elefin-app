/**
 * Fassade des Katalogs. Wie bei src/domain gilt: Der Rest der App
 * greift über '@/catalog' zu, nicht auf einzelne Dateien.
 */
export type {
  Catalog,
  CatalogField,
  CatalogOption,
  CatalogScreen,
  FieldType,
  ScreenKind,
} from './types';