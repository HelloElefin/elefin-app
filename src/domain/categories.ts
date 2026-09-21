/**
 * Die Kategorien von Elefin.
 *
 * Diese IDs sind UNVERÄNDERLICH. Sie stehen in der Datenbank in jeder
 * Eintragszeile. Wer eine ID ändert, macht alle Einträge dieser Kategorie
 * unauffindbar — es gibt keine Migration, die das repariert, weil die
 * Inhalte verschlüsselt sind. Neue IDs dürfen dazukommen. Eine gestrichene
 * ID wird nie wieder vergeben.
 *
 * Anzeigenamen kommen aus src/i18n, Rechtsinhalte aus src/content/at
 * bzw. src/content/de. Hier stehen NUR die technischen Kennungen.
 *
 * Warum das im Code steht und nicht in einer Datenbanktabelle: Kategorien
 * sind Programmbestandteil, kein Inhalt. Eine Tabelle würde bedeuten, dass
 * jemand sie zur Laufzeit ändern könnte.
 *
 * Stand 21.9.2026 — 21 IDs.
 * Neu gegenüber der ersten Fassung: case_profile, securities, safe_deposit,
 * valuables, power_of_attorney, living_will, last_will.
 * Gestrichen: advance_directives — aufgeteilt in die drei Vorsorgedokumente.
 * Es gab nie Daten damit. Die ID ist gesperrt.
 * Ebenfalls gestrichen: AKTIVE_KATEGORIEN und istAktiv. Seit 16.9. wird der
 * lokale Flow über alle Kategorien gebaut, nicht mehr gestaffelt.
 */
export const CATEGORIES = [
  // Technisch
  'case_profile', // Akten-Kopf: Situation und Inventar. Keine Kachel.

  // Sofort wichtig
  'emergency_contacts', // Notfallkontakte
  'funeral_wishes', // Bestattung und Organspende
  'document_locations', // Fundorte der Unterlagen

  // Geld und Werte
  'bank_accounts', // Konten und Sparbücher
  'securities', // Depot und Wertpapiere
  'safe_deposit', // Schließfach
  'valuables', // Schmuck, Gold, Sammlungen

  // Besitz
  'real_estate', // Immobilien
  'vehicles', // Fahrzeuge
  'pets', // Haustiere

  // Absicherung und Verträge
  'insurances', // Versicherungen
  'digital_accounts', // Digitale Konten und Abos
  'contracts', // Laufende Verträge

  // Vorsorgedokumente
  'power_of_attorney', // Vorsorgevollmacht
  'living_will', // Patientenverfügung
  'last_will', // Testament

  // Weitere
  'home_access', // Zugang zum Zuhause
  'medical', // Ärzte und Medizinisches
  'employment_pension', // Arbeitgeber und Pension
  'memberships', // Mitgliedschaften
] as const;

/** Eine gültige Kategorie-ID. */
export type Category = (typeof CATEGORIES)[number];

/**
 * Prüft, ob ein beliebiger Wert eine bekannte Kategorie ist.
 *
 * Nimmt bewusst unknown statt string: In Schritt 2 kommen die IDs auch aus
 * dem Katalog (JSON), und dort ist vorab nicht sicher, dass es Text ist.
 */
export function isCategory(value: unknown): value is Category {
  return (
    typeof value === 'string' &&
    (CATEGORIES as readonly string[]).includes(value)
  );
}