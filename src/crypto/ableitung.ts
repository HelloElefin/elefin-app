/**
 * Schlüsselableitung aus einem Passwort (scrypt, nativ).
 *
 * Diese Datei ist die EINZIGE im Krypto-Ordner, die einen nativen Baustein
 * aufruft. Alles andere rechnet in reinem JavaScript. Die Trennung ist
 * Absicht: Wenn der native Teil bei einer Expo-Version bricht, ist genau
 * eine Datei betroffen — und Tests für den Rest laufen ohne Gerät.
 *
 * Warum die Ableitung überhaupt langsam sein muss: Sie ist die einzige
 * Hürde zwischen einem geratenen Passwort und dem Generalschlüssel. Wäre
 * sie schnell, könnte ein Angreifer mit dem gestohlenen Chiffrat Milliarden
 * Passwörter pro Sekunde durchprobieren. scrypt zwingt ihn, für jeden
 * einzelnen Versuch 128 MiB Arbeitsspeicher zu belegen.
 */
import { scrypt } from 'react-native-quick-crypto';

import { SCHLUESSEL_LAENGE, type ScryptKosten } from './schluessel';

/**
 * Leitet aus Passwort und Salt einen 32-Byte-Schlüssel ab.
 *
 * Derselbe Aufruf mit denselben Werten ergibt IMMER denselben Schlüssel —
 * darauf beruht die Anmeldung auf einem zweiten Gerät. Deshalb werden Salt
 * und Kosten pro Nutzer gespeichert und niemals verändert, solange das
 * Passwort dasselbe bleibt.
 *
 * Dauert je nach Gerät 0,4 bis 1,5 Sekunden. Die Oberfläche friert dabei
 * nicht ein, weil die Rechnung auf einem eigenen Thread läuft — trotzdem
 * gehört an jede Aufrufstelle eine Fortschrittsanzeige.
 */
export function passwortSchluesselAbleiten(
  passwort: string,
  salt: Uint8Array,
  kosten: ScryptKosten,
): Promise<Uint8Array> {
  return new Promise((aufloesen, ablehnen) => {
    scrypt(
      passwort,
      salt,
      SCHLUESSEL_LAENGE,
      {
        N: kosten.N,
        r: kosten.r,
        p: kosten.p,
        // Muss über dem tatsächlichen Bedarf liegen, sonst bricht scrypt ab.
        maxmem: 512 * 1024 * 1024,
      },
      (fehler, ergebnis) => {
        if (fehler) {
          ablehnen(fehler);
          return;
        }
        if (!ergebnis) {
          ablehnen(new Error('scrypt lieferte kein Ergebnis.'));
          return;
        }
        aufloesen(new Uint8Array(ergebnis));
      },
    );
  });
}