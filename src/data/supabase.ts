/**
 * Die Verbindung zu Supabase.
 *
 * Einzige Stelle im gesamten Projekt, die einen Supabase-Klienten anlegt.
 * Alles andere in src/data benutzt diesen hier.
 *
 * Die frühe Konfigurationsprüfung ist Erfahrung aus dem Machbarkeitstest:
 * Fehlt die .env, bekommt man sonst nur "Network request failed" und sucht
 * eine Stunde an der falschen Stelle.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { DatenFehler, DatenFehlerCode } from './fehler';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** 'dev' oder 'prod'. Nur zur Anzeige, nie für Zugriffsentscheidungen. */
export const UMGEBUNG = process.env.EXPO_PUBLIC_UMGEBUNG ?? 'unbekannt';

/**
 * Ablage für die Anmeldesitzung von Supabase Auth.
 *
 * Standardmäßig würde Supabase sie unverschlüsselt ablegen. Hier landet sie
 * im Android-Keystore bzw. im iOS-Schlüsselbund.
 *
 * ACHTUNG: Das ist NUR die Anmeldesitzung, nicht der Generalschlüssel. Der
 * wird getrennt verwaltet, in sitzung.ts.
 */
const SicherAblegen = {
  getItem: (schluessel: string) => SecureStore.getItemAsync(schluessel),
  setItem: (schluessel: string, wert: string) =>
    SecureStore.setItemAsync(schluessel, wert),
  removeItem: (schluessel: string) => SecureStore.deleteItemAsync(schluessel),
};

let klient: SupabaseClient | null = null;

/**
 * Gibt den Supabase-Klienten zurück und legt ihn beim ersten Aufruf an.
 *
 * Wirft E-DB01, wenn die .env fehlt — mit einem Hinweis, der beim Suchen
 * hilft, aber keine Zugangsdaten enthält.
 */
export function supabase(): SupabaseClient {
  if (klient !== null) return klient;

  if (URL === undefined || URL === '' || ANON_KEY === undefined || ANON_KEY === '') {
    throw new DatenFehler(
      DatenFehlerCode.KONFIGURATION_FEHLT,
      'EXPO_PUBLIC_SUPABASE_URL oder EXPO_PUBLIC_SUPABASE_ANON_KEY fehlt. ' +
        '.env prüfen und die App mit "npx expo start --dev-client --clear" neu starten.',
    );
  }

  klient = createClient(URL, ANON_KEY, {
    auth: {
      storage: SicherAblegen,
      autoRefreshToken: true,
      persistSession: true,
      // In einer nativen App gibt es keine URL, aus der eine Sitzung käme.
      detectSessionInUrl: false,
    },
  });

  return klient;
}

/**
 * Prüft, ob die Verbindung überhaupt zustande kommt.
 *
 * Für einen Diagnosebildschirm während der Entwicklung. Gibt bewusst kein
 * Detail über die Antwort zurück — nur ob es geklappt hat und wie lange es
 * gedauert hat.
 */
export async function verbindungTesten(): Promise<{
  erreichbar: boolean;
  dauerMs: number;
}> {
  const start = Date.now();
  try {
    // Eine Abfrage, die immer erlaubt ist und nichts zurückgibt: RLS lässt
    // ohne Anmeldung keine Zeile durch, aber der Server antwortet.
    await supabase().from('profile').select('id').limit(1);
    return { erreichbar: true, dauerMs: Date.now() - start };
  } catch {
    return { erreichbar: false, dauerMs: Date.now() - start };
  }
}