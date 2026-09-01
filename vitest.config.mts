import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Testumgebung für src/crypto und src/domain.
 *
 * Diese Tests laufen auf dem PC, nicht auf dem Handy. Möglich ist das, weil
 * beide Ordner reine Rechenfunktionen enthalten — keine Oberfläche, keine
 * Datenbank, kein natives Zubehör.
 *
 * Ausgenommen ist src/crypto/ableitung.ts: Die ruft scrypt nativ auf und
 * lässt sich nur auf dem Gerät prüfen.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});