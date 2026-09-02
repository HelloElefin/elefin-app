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
export type Pruefmuster<T> = {
  safeParse(wert: unknown): { success: true; data: T } | { success: false };
};

import { textNachUtf8, utf8NachText } from './bytes';
import { KryptoFehler, KryptoFehlerCode } from './fehler';
import {
  symEntschluesseln,
  symVerschluesseln,
  type VerpackterSchluessel,
} from './schluessel';

/**
 * Aktuelle Schema-Version für Eintragsinhalte.
 *
 * Erhöhen, sobald sich die Struktur eines Inhalts ändert. Alte Datensätze
 * behalten ihre alte Nummer, bis das Gerät sie migriert hat.
 */
export const AKTUELLE_SCHEMA_VERSION = 1;

/** Schema-Versionen, die diese App-Fassung lesen kann. */
const LESBARE_SCHEMA_VERSIONEN = new Set([1]);

/** Jeder verschlüsselte Inhalt hat mindestens dieses Feld. */
export type MitSchemaVersion = {
  readonly schemaVersion: number;
};

/**
 * Verschlüsselt einen Eintragsinhalt.
 *
 * eintragId wird mitsigniert, aber nicht verschlüsselt — sie steht ohnehin
 * unverschlüsselt in der Datenbank. Der Nutzen liegt allein darin, dass das
 * Chiffrat an diese Zeile gebunden ist.
 */
export function inhaltVerschluesseln(
  datenschluessel: Uint8Array,
  eintragId: string,
  inhalt: Record<string, unknown>,
): VerpackterSchluessel {
  const mitVersion = {
    ...inhalt,
    schemaVersion: AKTUELLE_SCHEMA_VERSION,
  };
  return symVerschluesseln(
    datenschluessel,
    textNachUtf8(JSON.stringify(mitVersion)),
    textNachUtf8(eintragId),
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
export function inhaltEntschluesseln<T extends MitSchemaVersion>(
  datenschluessel: Uint8Array,
  eintragId: string,
  verpackt: VerpackterSchluessel,
  muster: Pruefmuster<T>,
): T {
  const bytes = symEntschluesseln(
    datenschluessel,
    verpackt,
    textNachUtf8(eintragId),
  );

  let roh: unknown;
  try {
    roh = JSON.parse(utf8NachText(bytes));
  } catch {
    throw new KryptoFehler(
      KryptoFehlerCode.INHALT_UNGUELTIG,
      'Entschlüsselter Inhalt ist kein gültiges JSON.',
    );
  }

  // Erst die Version prüfen: Bei einem Datensatz aus einer neueren
  // App-Fassung wäre die Musterprüfung irreführend — nicht die Daten sind
  // kaputt, die App ist zu alt.
  const version = (roh as MitSchemaVersion | null)?.schemaVersion;
  if (typeof version !== 'number' || !LESBARE_SCHEMA_VERSIONEN.has(version)) {
    throw new KryptoFehler(
      KryptoFehlerCode.UNBEKANNTE_SCHEMA_VERSION,
      `Datensatz hat Schema-Version ${String(version)}, lesbar sind ${[...LESBARE_SCHEMA_VERSIONEN].join(', ')}.`,
    );
  }

  const ergebnis = muster.safeParse(roh);
  if (!ergebnis.success) {
    throw new KryptoFehler(
      KryptoFehlerCode.INHALT_UNGUELTIG,
      'Entschlüsselter Inhalt passt nicht zum erwarteten Muster.',
    );
  }

  return ergebnis.data;
}