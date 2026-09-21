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
  bytesEqual,
  bytesToBase64,
  concatBytes,
  base64ToBytes,
  textToUtf8,
  utf8ToText,
  secureRandomBytes,
} from './bytes';

// --- Fehler ---
export {
  CryptoError,
  CryptoErrorCode,
  type CryptoErrorCodeValue,
} from './errors';

// --- Generalschlüssel und symmetrische Verschlüsselung ---
export {
  NONCE_LENGTH,
  SALT_LENGTH,
  KEY_LENGTH,
  SCRYPT_DEFAULTS,
  generateDataKey,
  unwrapMasterKey,
  generateMasterKey,
  wrapMasterKey,
  generateSalt,
  symDecrypt,
  symEncrypt,
  type ScryptCost,
  type WrappedKey,
} from './keys';

// --- Ableitung aus dem Passwort (nativ, langsam mit Absicht) ---
export { derivePasswordKey } from './derivation';

// --- Umschläge für andere Personen ---
export {
  X25519_LENGTH,
  generateKeyPair,
  openEnvelope,
  sealEnvelope,
  type KeyPair,
} from './envelope';

// --- Sicherheitsschlüssel zum Ausdrucken ---
export {
  deriveFromRecoveryKey,
  generateRecoveryKey,
  validateRecoveryKey,
} from './recovery-key';

// --- Eintragsinhalte ---
export {
  CURRENT_SCHEMA_VERSION,
  decryptContent,
  encryptContent,
  type WithSchemaVersion,
  type Validator,
} from './content';