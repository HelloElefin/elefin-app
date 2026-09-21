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
export const DataErrorCode = {
  /** Die .env fehlt oder ist unvollständig. */
  CONFIG_MISSING: 'E-DB01',
  /** Keine Verbindung zum Server. */
  NETWORK: 'E-DB02',
  /** Niemand angemeldet, oder die Sitzung ist abgelaufen. */
  NOT_SIGNED_IN: 'E-DB03',
  /** Zugriff verweigert — die Zeile gehört jemand anderem. */
  ACCESS_DENIED: 'E-DB04',
  /** Der gesuchte Datensatz existiert nicht. */
  NOT_FOUND: 'E-DB05',
  /** Anmeldung fehlgeschlagen: E-Mail oder Passwort falsch. */
  SIGN_IN_FAILED: 'E-DB06',
  /** Diese E-Mail-Adresse ist bereits vergeben. */
  ACCOUNT_EXISTS: 'E-DB07',
  /** Das Gerät hat keine gespeicherte Sitzung. */
  NO_SESSION: 'E-DB08',
  /** Der Empfänger hat noch kein Konto — es gibt keinen Schlüssel für ihn. */
  RECIPIENT_WITHOUT_ACCOUNT: 'E-DB09',
  /** Etwas ist schiefgegangen, das wir nicht zuordnen können. */
  UNKNOWN: 'E-DB99',
} as const;

export type DataErrorCodeValue =
  (typeof DataErrorCode)[keyof typeof DataErrorCode];

export class DataError extends Error {
  readonly code: DataErrorCodeValue;

  constructor(code: DataErrorCodeValue, hint: string) {
    super(`${code}: ${hint}`);
    this.name = 'DataError';
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
export function toDataError(error: { code?: string; message?: string }): DataError {
  // Postgres-Fehlercodes, soweit für uns aussagekräftig.
  switch (error.code) {
    case '42501': // insufficient_privilege — RLS hat abgelehnt
      return new DataError(
        DataErrorCode.ACCESS_DENIED,
        'Zugriff durch Row Level Security verweigert.',
      );
    case '23505': // unique_violation
      return new DataError(
        DataErrorCode.ACCOUNT_EXISTS,
        'Ein Datensatz mit diesem eindeutigen Merkmal existiert bereits.',
      );
    case 'PGRST116': // kein Ergebnis bei .single()
      return new DataError(
        DataErrorCode.NOT_FOUND,
        'Kein passender Datensatz gefunden.',
      );
    default:
      return new DataError(
        DataErrorCode.UNKNOWN,
        'Unerwarteter Datenbankfehler.',
      );
  }
}