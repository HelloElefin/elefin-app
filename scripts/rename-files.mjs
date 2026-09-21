#!/usr/bin/env node
/**
 * scripts/rename-files.mjs
 *
 * Benennt die deutschen Dateinamen auf Englisch um und zieht alle
 * Importpfade nach. Bezeichner im Code werden NICHT angefasst — dafuer
 * "Rename Symbol" (F2) in VS Code verwenden.
 *
 *   node scripts/rename-files.mjs          Probelauf, aendert nichts
 *   node scripts/rename-files.mjs --apply  fuehrt die Umbenennung durch
 *
 * Voraussetzung: sauberer Arbeitsbaum (git status leer).
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const APPLY = process.argv.includes('--apply');

/** alt -> neu, relativ zur Projektwurzel, POSIX-Schreibweise */
const MAP = {
  'src/crypto/fehler.ts': 'src/crypto/errors.ts',
  'src/crypto/schluessel.ts': 'src/crypto/keys.ts',
  'src/crypto/ableitung.ts': 'src/crypto/derivation.ts',
  'src/crypto/umschlag.ts': 'src/crypto/envelope.ts',
  'src/crypto/sicherheitsschluessel.ts': 'src/crypto/recovery-key.ts',
  'src/crypto/inhalt.ts': 'src/crypto/content.ts',
  'src/crypto/krypto.test.ts': 'src/crypto/crypto.test.ts',

  'src/domain/kategorien.ts': 'src/domain/categories.ts',

  'src/data/fehler.ts': 'src/data/errors.ts',
  'src/data/sitzung.ts': 'src/data/session.ts',
  'src/data/ablage.ts': 'src/data/store.ts',
  'src/data/ablage-lokal.ts': 'src/data/local-store.ts',
  'src/data/eintraege.ts': 'src/data/entries.ts',

  'src/ui/Feld.tsx': 'src/ui/Field.tsx',
  'src/ui/Knopf.tsx': 'src/ui/Button.tsx',
};

// ---------------------------------------------------------------------------

const posix = (p) => p.split('\\').join('/');
const rel = (abs) => posix(relative(ROOT, abs));

/** absolute alte -> absolute neue Pfade */
const ABS = new Map(
  Object.entries(MAP).map(([alt, neu]) => [join(ROOT, alt), join(ROOT, neu)]),
);

/** Loest einen Import-Bezeichner auf eine Datei auf. null = Paket oder unbekannt. */
function aufloesen(spec, vonVerzeichnis) {
  let basis;
  if (spec.startsWith('@/')) basis = resolve(SRC, spec.slice(2));
  else if (spec.startsWith('.')) basis = resolve(vonVerzeichnis, spec);
  else return null;

  const kandidaten = [
    basis,
    `${basis}.ts`,
    `${basis}.tsx`,
    join(basis, 'index.ts'),
    join(basis, 'index.tsx'),
  ];
  for (const k of kandidaten) {
    if (ABS.has(k)) return k;
    if (existsSync(k) && statSync(k).isFile() && ABS.has(k)) return k;
  }
  return null;
}

/** Baut den neuen Bezeichner im Stil des alten (Alias bleibt Alias). */
function neuerSpec(altSpec, neuesZiel, importeurVerzeichnisNeu) {
  const ohneEndung = neuesZiel.replace(/\.(tsx?|mts)$/, '');
  if (altSpec.startsWith('@/')) {
    return `@/${posix(relative(SRC, ohneEndung))}`;
  }
  let r = posix(relative(importeurVerzeichnisNeu, ohneEndung));
  if (!r.startsWith('.')) r = `./${r}`;
  return r;
}

// --- Dateien einsammeln ----------------------------------------------------

let dateien;
try {
  dateien = execFileSync('git', ['ls-files', '*.ts', '*.tsx', '*.mts'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .map((p) => join(ROOT, p));
} catch {
  console.error('Fehler: git ls-files fehlgeschlagen. Laeuft das Skript im Repo?');
  process.exit(1);
}

// --- Sauberkeit pruefen ----------------------------------------------------

if (APPLY) {
  const status = execFileSync('git', ['status', '--porcelain'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  if (status) {
    console.error('Fehler: Arbeitsbaum nicht sauber. Erst committen oder stashen.');
    process.exit(1);
  }
}

// --- Fehlende Quelldateien melden -----------------------------------------

const fehlend = [...ABS.keys()].filter((p) => !existsSync(p));
if (fehlend.length) {
  console.warn('Nicht gefunden, wird uebersprungen:');
  for (const p of fehlend) console.warn(`  ${rel(p)}`);
  console.warn('');
  for (const p of fehlend) ABS.delete(p);
}

// --- Schritt 1: Importpfade umschreiben -----------------------------------

const MUSTER = [
  /(\bfrom\s*['"])([^'"]+)(['"])/g,
  /(\bimport\s*\(\s*['"])([^'"]+)(['"]\s*\))/g,
  /(\brequire\s*\(\s*['"])([^'"]+)(['"]\s*\))/g,
  /(\bvi\.mock\s*\(\s*['"])([^'"]+)(['"])/g,
  /(\bexport\s+\*\s+from\s*['"])([^'"]+)(['"])/g,
];

let dateienGeaendert = 0;
let importeGeaendert = 0;

for (const datei of dateien) {
  const alterInhalt = readFileSync(datei, 'utf8');
  const vonAlt = dirname(datei);
  // Wird der Importeur selbst verschoben, gilt fuer relative Pfade sein neues Verzeichnis.
  const vonNeu = ABS.has(datei) ? dirname(ABS.get(datei)) : vonAlt;

  let inhalt = alterInhalt;
  let trefferHier = 0;

  for (const muster of MUSTER) {
    inhalt = inhalt.replace(muster, (ganz, vor, spec, nach) => {
      const ziel = aufloesen(spec, vonAlt);
      if (!ziel) return ganz;
      const ersetzt = neuerSpec(spec, ABS.get(ziel), vonNeu);
      if (ersetzt === spec) return ganz;
      trefferHier++;
      return `${vor}${ersetzt}${nach}`;
    });
  }

  if (trefferHier > 0) {
    dateienGeaendert++;
    importeGeaendert += trefferHier;
    console.log(`${APPLY ? 'geaendert' : 'wuerde aendern'}  ${rel(datei)}  (${trefferHier})`);
    if (APPLY) writeFileSync(datei, inhalt, 'utf8');
  }
}

// --- Schritt 2: Dateien verschieben ---------------------------------------

console.log('');
for (const [alt, neu] of ABS) {
  console.log(`${APPLY ? 'git mv' : 'wuerde verschieben'}  ${rel(alt)}  ->  ${rel(neu)}`);
  if (APPLY) {
    execFileSync('git', ['mv', rel(alt), rel(neu)], { cwd: ROOT });
  }
}

// --- Bilanz ----------------------------------------------------------------

console.log('');
console.log(`Dateien verschoben:  ${ABS.size}`);
console.log(`Importe angepasst:   ${importeGeaendert} in ${dateienGeaendert} Dateien`);

if (!APPLY) {
  console.log('');
  console.log('Probelauf. Nichts geaendert. Mit --apply ausfuehren.');
} else {
  console.log('');
  console.log('Fertig. Jetzt pruefen:');
  console.log('  npx tsc --noEmit');
  console.log('  npx vitest run');
  console.log('');
  console.log('Danach die Bezeichner im Code mit F2 in VS Code umbenennen.');
}
