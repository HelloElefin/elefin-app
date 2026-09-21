/**
 * Fehler aus der Datenschicht.
 *
 * Supabase liefert Fehlermeldungen im Klartext — teils mit Tabellen- und
 * Spaltennamen, gelegentlich mit Werten. Nach Regel 5 darf davon nichts in
 * ein Protokoll oder auf einen Bildschirm gelangen.
 *
 * Deshalb übersetzt diese Schicht jeden Datenbankfehler in einen Code.
 * Was Supabase gesagt hat, bleibt hier drin.
 */

/** Fehlercodes der Datenschicht. Bereich DB. */
export const DatenFehlerCode = {
  /** Die .env fehlt oder ist unvollständig. */
  KONFIGURATION_FEHLT: 'E-DB01',
  /** Keine Verbindung zum Server. */
  NETZWERK: 'E-DB02',
  /** Niemand angemeldet, oder die Sitzung ist abgelaufen. */
  NICHT_ANGEMELDET: 'E-DB03',
  /** Zugriff verweigert — die Zeile gehört jemand anderem. */
  KEIN_ZUGRIFF: 'E-DB04',
  /** Der gesuchte Datensatz existiert nicht. */
  NICHT_GEFUNDEN: 'E-DB05',
  /** Anmeldung fehlgeschlagen: E-Mail oder Passwort falsch. */
  ANMELDUNG_FEHLGESCHLAGEN: 'E-DB06',
  /** Diese E-Mail-Adresse ist bereits vergeben. */
  KONTO_EXISTIERT: 'E-DB07',
  /** Das Gerät hat keine gespeicherte Sitzung. */
  KEINE_SITZUNG: 'E-DB08',
  /** Der Empfänger hat noch kein Konto — es gibt keinen Schlüssel für ihn. */
  EMPFAENGER_OHNE_KONTO: 'E-DB09',
  /** Etwas ist schiefgegangen, das wir nicht zuordnen können. */
  UNBEKANNT: 'E-DB99',
} as const;

export type DatenFehlerCodeWert =
  (typeof DatenFehlerCode)[keyof typeof DatenFehlerCode];

export class DatenFehler extends Error {
  readonly code: DatenFehlerCodeWert;

  constructor(code: DatenFehlerCodeWert, hinweis: string) {
    super(`${code}: ${hinweis}`);
    this.name = 'DatenFehler';
    this.code = code;
  }
}

/**
 * Übersetzt einen Supabase-Fehler in einen Code.
 *
 * Der ursprüngliche Text wird bewusst VERWORFEN, nicht angehängt. Er könnte
 * Spaltennamen und Werte enthalten, und was nicht mitgeschleppt wird, kann
 * auch nicht versehentlich protokolliert werden.
 */
export function datenbankFehler(fehler: { code?: string; message?: string }): DatenFehler {
  // Postgres-Fehlercodes, soweit für uns aussagekräftig.
  switch (fehler.code) {
    case '42501': // insufficient_privilege — RLS hat abgelehnt
      return new DatenFehler(
        DatenFehlerCode.KEIN_ZUGRIFF,
        'Zugriff durch Row Level Security verweigert.',
      );
    case '23505': // unique_violation
      return new DatenFehler(
        DatenFehlerCode.KONTO_EXISTIERT,
        'Ein Datensatz mit diesem eindeutigen Merkmal existiert bereits.',
      );
    case 'PGRST116': // kein Ergebnis bei .single()
      return new DatenFehler(
        DatenFehlerCode.NICHT_GEFUNDEN,
        'Kein passender Datensatz gefunden.',
      );
    default:
      return new DatenFehler(
        DatenFehlerCode.UNBEKANNT,
        'Unerwarteter Datenbankfehler.',
      );
  }
}