/**
 * Die Fassade des Krypto-Bereichs.
 *
 * Nur was hier steht, darf der Rest der App benutzen. Kein anderer Ordner
 * importiert jemals direkt aus src/crypto/schluessel oder src/crypto/umschlag —
 * immer über '@/crypto'.
 *
 * Der Nutzen zeigt sich beim Umbau: Wenn ihr scrypt später gegen Argon2id
 * tauscht oder die Umschlag-Version erhöht, ändert sich hinter dieser
 * Fassade alles und davor nichts. Und ein externer Prüfer sieht auf einen
 * Blick, welche Oberfläche der Bereich überhaupt hat.
 *
 * Bewusst NICHT exportiert: die internen Ableitungsfunktionen, die
 * Umschlag-Version, der Zeichenvorrat. Das ist Innenleben.
 */

// --- Grundlagen ---
export {
  bytesGleich,
  bytesNachText,
  bytesVerbinden,
  textNachBytes,
  textNachUtf8,
  utf8NachText,
  zufallsBytes,
} from './bytes';

// --- Fehler ---
export {
  KryptoFehler,
  KryptoFehlerCode,
  type KryptoFehlerCodeWert,
} from './fehler';

// --- Generalschlüssel und symmetrische Verschlüsselung ---
export {
  NONCE_LAENGE,
  SALT_LAENGE,
  SCHLUESSEL_LAENGE,
  SCRYPT_STANDARD,
  datenschluesselErzeugen,
  generalschluesselAuspacken,
  generalschluesselErzeugen,
  generalschluesselVerpacken,
  saltErzeugen,
  symEntschluesseln,
  symVerschluesseln,
  type ScryptKosten,
  type VerpackterSchluessel,
} from './schluessel';

// --- Ableitung aus dem Passwort (nativ, langsam mit Absicht) ---
export { passwortSchluesselAbleiten } from './ableitung';

// --- Umschläge für andere Personen ---
export {
  X25519_LAENGE,
  schluesselpaarErzeugen,
  umschlagAuspacken,
  umschlagVerpacken,
  type Schluesselpaar,
} from './umschlag';

// --- Sicherheitsschlüssel zum Ausdrucken ---
export {
  sicherheitsschluesselAbleiten,
  sicherheitsschluesselErzeugen,
  sicherheitsschluesselPruefen,
} from './sicherheitsschluessel';

// --- Eintragsinhalte ---
export {
  AKTUELLE_SCHEMA_VERSION,
  inhaltEntschluesseln,
  inhaltVerschluesseln,
  type MitSchemaVersion,
  type Pruefmuster,
} from './inhalt';