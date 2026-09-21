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

import { DataError, DataErrorCode } from './errors';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** 'dev' oder 'prod'. Nur zur Anzeige, nie für Zugriffsentscheidungen. */
export const ENVIRONMENT = process.env.EXPO_PUBLIC_UMGEBUNG ?? 'unbekannt';

/**
 * Ablage für die Anmeldesitzung von Supabase Auth.
 *
 * Standardmäßig würde Supabase sie unverschlüsselt ablegen. Hier landet sie
 * im Android-Keystore bzw. im iOS-Schlüsselbund.
 *
 * ACHTUNG: Das ist NUR die Anmeldesitzung, nicht der Generalschlüssel. Der
 * wird getrennt verwaltet, in sitzung.ts.
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

let client: SupabaseClient | null = null;

/**
 * Gibt den Supabase-Klienten zurück und legt ihn beim ersten Aufruf an.
 *
 * Wirft E-DB01, wenn die .env fehlt — mit einem Hinweis, der beim Suchen
 * hilft, aber keine Zugangsdaten enthält.
 */
export function supabase(): SupabaseClient {
  if (client !== null) return client;

  if (URL === undefined || URL === '' || ANON_KEY === undefined || ANON_KEY === '') {
    throw new DataError(
      DataErrorCode.CONFIG_MISSING,
      'EXPO_PUBLIC_SUPABASE_URL oder EXPO_PUBLIC_SUPABASE_ANON_KEY fehlt. ' +
        '.env prüfen und die App mit "npx expo start --dev-client --clear" neu starten.',
    );
  }

  client = createClient(URL, ANON_KEY, {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      // In einer nativen App gibt es keine URL, aus der eine Sitzung käme.
      detectSessionInUrl: false,
    },
  });

  return client;
}

/**
 * Prüft, ob die Verbindung überhaupt zustande kommt.
 *
 * Für einen Diagnosebildschirm während der Entwicklung. Gibt bewusst kein
 * Detail über die Antwort zurück — nur ob es geklappt hat und wie lange es
 * gedauert hat.
 */
export async function testConnection(): Promise<{
  reachable: boolean;
  durationMs: number;
}> {
  const start = Date.now();
  try {
    // Eine Abfrage, die immer erlaubt ist und nichts zurückgibt: RLS lässt
    // ohne Anmeldung keine Zeile durch, aber der Server antwortet.
    await supabase().from('profile').select('id').limit(1);
    return { reachable: true, durationMs: Date.now() - start };
  } catch {
    return { reachable: false, durationMs: Date.now() - start };
  }
}