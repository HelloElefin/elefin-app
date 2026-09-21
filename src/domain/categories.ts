/**
 * Die Kategorien von Elefin.
 *
 * Diese IDs sind UNVERÄNDERLICH. Sie stehen in der Datenbank in jeder
 * Eintragszeile. Wer eine ID ändert, macht alle Einträge dieser Kategorie
 * unauffindbar — es gibt keine Migration, die das repariert, weil die
 * Inhalte verschlüsselt sind.
 *
 * Anzeigenamen kommen aus src/i18n, Rechtsinhalte aus src/content/at
 * bzw. src/content/de. Hier stehen NUR die technischen Kennungen.
 *
 * Warum das im Code steht und nicht in einer Datenbanktabelle: Kategorien
 * sind Programmbestandteil, kein Inhalt. Eine Tabelle würde bedeuten, dass
 * jemand sie zur Laufzeit ändern könnte.
 */

/** Alle Kategorien, die Elefin kennt — auch die noch nicht ausgelieferten. */
export const KATEGORIEN = [
  'funeral_wishes',
  'emergency_contacts',
  'home_access',
  'pets',
  'document_locations',
  'bank_accounts',
  'insurances',
  'advance_directives',
  'medical',
  'digital_accounts',
  'contracts',
  'real_estate',
  'vehicles',
  'employment_pension',
  'memberships',
] as const;

export type Kategorie = (typeof KATEGORIEN)[number];

/**
 * Kategorien, die in der App tatsächlich sichtbar sind.
 *
 * Bewusst getrennt von KATEGORIEN: Die IDs sind vollständig durchdacht und
 * festgelegt, die Auslieferung erfolgt gestaffelt. Eine Kategorie
 * freizuschalten ist eine Zeile hier plus Texte und Felder — kein Umbau.
 *
 * Stand: Wir starten mit einer einzigen Kategorie, damit der komplette Weg
 * einmal durchläuft, bevor er vierzehnmal wiederholt wird.
 */
export const AKTIVE_KATEGORIEN: readonly Kategorie[] = ['bank_accounts'];

/** Prüft, ob ein beliebiger Text eine bekannte Kategorie ist. */
export function istKategorie(wert: string): wert is Kategorie {
  return (KATEGORIEN as readonly string[]).includes(wert);
}

/** Prüft, ob eine Kategorie derzeit ausgeliefert wird. */
export function istAktiv(kategorie: Kategorie): boolean {
  return AKTIVE_KATEGORIEN.includes(kategorie);
}