/**
 * Feldstruktur der Kategorie bank_accounts.
 *
 * Dieses Muster wird beim Entschlüsseln angewendet — es erzwingt, dass die
 * Struktur stimmt, bevor die App mit den Daten arbeitet.
 *
 * Grundsatz aus Regel 6: Wir speichern HINWEISE, wo etwas liegt, keine
 * Zugangsdaten. Deshalb gibt es hier kein Feld für PIN, Passwort oder TAN —
 * und es wird auch keines geben.
 *
 * Fast alle Felder sind optional. Grund: Jemand, der abends anfängt, weiß
 * die IBAN vielleicht nicht auswendig. Ein Formular, das ihn zwingt, sie
 * jetzt zu suchen, wird nicht ausgefüllt, sondern weggelegt. Pflicht ist
 * nur, was den Eintrag überhaupt auffindbar macht.
 */
import { z } from 'zod';

export const BankAccountInhalt = z.object({
  schemaVersion: z.number(),

  /** Pflicht: Ohne Bezeichnung ist der Eintrag in einer Liste wertlos. */
  bezeichnung: z.string().min(1).max(120),

  /** Name der Bank, z. B. "Erste Bank" oder "Sparkasse Köln". */
  institut: z.string().max(120).optional(),

    /**
   * Wem gehört das Konto? Leer heißt: dem Nutzer selbst.
   *
   * Wichtig bei gemeinsamen Konten und bei Konten, die auf jemand anderen
   * lauten — etwa ein Sparbuch für ein Kind. Im Todesfall entscheidet der
   * Inhaber darüber, was mit dem Konto passiert.
   */
  kontoinhaber: z.string().max(120).optional(),

  /** IBAN, wie eingegeben. Wird nicht auf Gültigkeit geprüft. */
  iban: z.string().max(42).optional(),

  /** Art des Kontos in Worten, z. B. "Gehaltskonto", "Sparbuch". */
  kontoart: z.string().max(80).optional(),

  /**
   * Wo liegen die Unterlagen? Das Kernstück von Elefin — nicht die Daten
   * selbst, sondern der Weg dorthin.
   */
  fundort: z.string().max(500).optional(),

  /** Freitext für alles, was sonst nirgends passt. */
  notiz: z.string().max(2000).optional(),
});

export type BankAccountInhalt = z.infer<typeof BankAccountInhalt>;