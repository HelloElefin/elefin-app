/**
 * Ver- und Entschlüsseln der Eintragsinhalte.
 *
 * Zwei Festlegungen, die hier umgesetzt werden und die später nicht
 * nachrüstbar sind:
 *
 * 1. JEDER verschlüsselte Datensatz enthält im Klartext-Inhalt ein Feld
 *    schemaVersion. Verschlüsselte Daten lassen sich nicht serverseitig
 *    migrieren — ihr kommt nicht heran. Ohne dieses Feld ist jede spätere
 *    Strukturänderung ein Datenverlust. Migrationen laufen auf dem Gerät,
 *    beim nächsten Öffnen.
 *
 * 2. Die Eintrags-ID wird MITSIGNIERT. Damit lässt sich ein Chiffrat nicht
 *    von einer Zeile in eine andere verschieben — es entschlüsselt nur an
 *    dem Platz, für den es erzeugt wurde.
 *
 * Diese Datei kennt bewusst KEINE Fachlogik. Sie weiß nicht, was ein
 * Bankkonto ist. Sie bekommt ein Prüfmuster übergeben und wendet es an.
 * Die Muster selbst liegen in src/domain.
 */
/**
 * Ein Prüfmuster, wie es zod liefert.
 *
 * Bewusst schmal beschrieben statt den vollen zod-Typ zu verlangen: Der
 * Krypto-Bereich braucht nur safeParse und soll nicht an ein bestimmtes
 * Prüfwerkzeug gebunden sein. Das hält ihn klein und in Tests leicht
 * ersetzbar.
 */
export type Validator<T> = {
  safeParse(value: unknown): { success: true; data: T } | { success: false };
};

import { textToUtf8, utf8ToText } from './bytes';
import { CryptoError, CryptoErrorCode } from './errors';
import {
  symDecrypt,
  symEncrypt,
  type WrappedKey,
} from './keys';

/**
 * Aktuelle Schema-Version für Eintragsinhalte.
 *
 * Erhöhen, sobald sich die Struktur eines Inhalts ändert. Alte Datensätze
 * behalten ihre alte Nummer, bis das Gerät sie migriert hat.
 */
export const CURRENT_SCHEMA_VERSION = 1;

/** Schema-Versionen, die diese App-Fassung lesen kann. */
const READABLE_SCHEMA_VERSIONS = new Set([1]);

/** Jeder verschlüsselte Inhalt hat mindestens dieses Feld. */
export type WithSchemaVersion = {
  readonly schemaVersion: number;
};

/**
 * Verschlüsselt einen Eintragsinhalt.
 *
 * entryId wird mitsigniert, aber nicht verschlüsselt — sie steht ohnehin
 * unverschlüsselt in der Datenbank. Der Nutzen liegt allein darin, dass das
 * Chiffrat an diese Zeile gebunden ist.
 */
export function encryptContent(
  dataKey: Uint8Array,
  entryId: string,
  content: Record<string, unknown>,
): WrappedKey {
  const withVersion = {
    ...content,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
  return symEncrypt(
    dataKey,
    textToUtf8(JSON.stringify(withVersion)),
    textToUtf8(entryId),
  );
}

/**
 * Entschlüsselt einen Eintragsinhalt und prüft ihn gegen ein Muster.
 *
 * Warum die Prüfung: Entschlüsseln liefert Bytes, JSON.parse liefert
 * irgendein Objekt. Ohne Prüfung würde die App mit Daten weiterarbeiten,
 * deren Form sie nur annimmt — und der Fehler fiele erst irgendwo tief in
 * der Oberfläche auf. Das Muster erzwingt, dass die Struktur stimmt, bevor
 * irgendetwas damit geschieht.
 *
 * Wirft E-CR01 bei falschem Schlüssel oder fremder Eintrags-ID,
 * E-CR06 bei unbekannter Schema-Version,
 * E-CR07 wenn die Struktur nicht zum Muster passt.
 */
export function decryptContent<T extends WithSchemaVersion>(
  dataKey: Uint8Array,
  entryId: string,
  wrapped: WrappedKey,
  validator: Validator<T>,
): T {
  const bytes = symDecrypt(
    dataKey,
    wrapped,
    textToUtf8(entryId),
  );

  let raw: unknown;
  try {
    raw = JSON.parse(utf8ToText(bytes));
  } catch {
    throw new CryptoError(
      CryptoErrorCode.CONTENT_INVALID,
      'Entschlüsselter Inhalt ist kein gültiges JSON.',
    );
  }

  // Erst die Version prüfen: Bei einem Datensatz aus einer neueren
  // App-Fassung wäre die Musterprüfung irreführend — nicht die Daten sind
  // kaputt, die App ist zu alt.
  const version = (raw as WithSchemaVersion | null)?.schemaVersion;
  if (typeof version !== 'number' || !READABLE_SCHEMA_VERSIONS.has(version)) {
    throw new CryptoError(
      CryptoErrorCode.UNKNOWN_SCHEMA_VERSION,
      `Datensatz hat Schema-Version ${String(version)}, lesbar sind ${[...READABLE_SCHEMA_VERSIONS].join(', ')}.`,
    );
  }

  const result = validator.safeParse(raw);
  if (!result.success) {
    throw new CryptoError(
      CryptoErrorCode.CONTENT_INVALID,
      'Entschlüsselter Inhalt passt nicht zum erwarteten Muster.',
    );
  }

  return result.data;
}