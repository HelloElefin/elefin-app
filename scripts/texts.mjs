#!/usr/bin/env node
/**
 * scripts/texts.mjs — die Texte der App bearbeiten, ohne JSON anzufassen.
 *
 *   node scripts/texts.mjs export
 *       schreibt texte-de.csv — zum Bearbeiten in Excel
 *
 *   node scripts/texts.mjs import texte-de.csv            Probelauf
 *   node scripts/texts.mjs import texte-de.csv --apply    übernehmen
 *       liest die bearbeitete Tabelle zurück
 *
 *   node scripts/texts.mjs apply elefin-texte-….json            Probelauf
 *   node scripts/texts.mjs apply elefin-texte-….json --apply    übernehmen
 *       übernimmt die Änderungsdatei aus der Textseite im Browser
 *
 * Geändert wird ausschließlich src/i18n/de/common.json, und nur der Text.
 * Schlüssel werden nie angelegt, umbenannt oder gelöscht — das ist
 * Strukturarbeit und passiert im Katalog.
 *
 * Vor dem Schreiben wird geprüft:
 *   - Gibt es den Schlüssel?
 *   - Stimmen die Platzhalter wie {{count}} mit dem bisherigen Text überein?
 *   - Ist der Text leer?
 *   - (nur apply) Steht im Code noch derselbe Text wie beim Bearbeiten?
 *     Sonst hat ihn inzwischen jemand anderes geändert.
 * Gibt es auch nur einen Fehler, wird NICHTS geschrieben.
 *
 * Nur Node, keine Abhängigkeiten.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TEXTS_FILE = join(ROOT, 'src', 'i18n', 'de', 'common.json');
const CSV_FILE = join(ROOT, 'texte-de.csv');
const SEP = ';'; // Excel mit deutscher Einstellung erwartet Semikolon

const [command, file] = process.argv.slice(2);
const APPLY = process.argv.includes('--apply');

// --- Hilfsfunktionen -------------------------------------------------------

/** Liest eine Datei und bricht ab, wenn sie kein gültiges UTF-8 ist. */
function readUtf8(path) {
  const bytes = readFileSync(path);
  try {
    return new TextDecoder('utf-8', { fatal: true })
      .decode(bytes)
      .replace(/^\uFEFF/, '');
  } catch {
    fail(
      `${path} ist nicht als UTF-8 gespeichert. In Excel „Speichern unter" ` +
        `und als Dateityp „CSV UTF-8 (durch Trennzeichen getrennt)" wählen.`,
    );
  }
}

function fail(message) {
  console.error(`Fehler: ${message}`);
  process.exit(1);
}

/** Verschachteltes JSON -> flache Liste [schlüssel, text], in Dateireihenfolge. */
function flatten(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') out.push(...flatten(v, key));
    else out.push([key, v]);
  }
  return out;
}

/** Setzt einen Text im verschachtelten JSON. Die Reihenfolge bleibt erhalten. */
function setText(obj, key, value) {
  const parts = key.split('.');
  let node = obj;
  for (const p of parts.slice(0, -1)) node = node[p];
  node[parts.at(-1)] = value;
}

/** Die Platzhalter eines Textes, z. B. ['count'] für „{{count}} Konten". */
function placeholders(text) {
  return [...String(text).matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',');
}

/** Wo ein Text hingehört — nur zur Orientierung in der Tabelle. */
function area(key) {
  const [top, second] = key.split('.');
  if (top === 'flow') return `Screen ${second}`;
  if (top === 'question' || top === 'option') return `Kategorie ${second}`;
  if (top === 'block') return 'Blocküberschriften';
  if (top === 'common') return 'Allgemein';
  return 'Altbestand';
}

/** CSV nach RFC 4180, mit Semikolon. Versteht Anführungszeichen und Zeilenumbrüche im Feld. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === '') quoted = true; // nur am Feldanfang
    else if (c === SEP) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f !== ''));
}

function csvField(value) {
  const s = String(value);
  return /[";\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

// --- Prüfen und Schreiben ---------------------------------------------------

/**
 * Prüft eine Liste von Änderungen und schreibt sie, wenn alles stimmt.
 * changes: [{ key, to, from? }] — from nur bei apply.
 */
function check(changes, source) {
  const json = JSON.parse(readUtf8(TEXTS_FILE));
  const current = new Map(flatten(json));

  const errors = [];
  const ok = [];
  let unchanged = 0;

  for (const c of changes) {
    const now = current.get(c.key);
    if (now === undefined) {
      errors.push(`${c.key}: Schlüssel gibt es nicht`);
      continue;
    }
    if (c.to === now) {
      unchanged++;
      continue;
    }
    if (String(c.to).trim() === '') {
      errors.push(`${c.key}: Text ist leer`);
      continue;
    }
    if (c.from !== undefined && c.from !== now) {
      errors.push(
        `${c.key}: wurde inzwischen im Code geändert\n` +
          `      beim Bearbeiten: ${c.from}\n` +
          `      jetzt im Code:   ${now}\n` +
          `      neu:             ${c.to}`,
      );
      continue;
    }
    if (placeholders(c.to) !== placeholders(now)) {
      errors.push(
        `${c.key}: Platzhalter passen nicht — vorher {{${placeholders(now) || '–'}}}, ` +
          `jetzt {{${placeholders(c.to) || '–'}}}`,
      );
      continue;
    }
    ok.push({ key: c.key, from: now, to: c.to });
  }

  for (const c of ok) console.log(`  ${c.key}\n    alt: ${c.from}\n    neu: ${c.to}`);
  console.log('');
  console.log(`Quelle:       ${source}`);
  console.log(`Änderungen:   ${ok.length}`);
  console.log(`unverändert:  ${unchanged}`);
  console.log(`Fehler:       ${errors.length}`);

  if (errors.length) {
    console.log('');
    for (const e of errors) console.log(`  FEHLER  ${e}`);
    console.log('');
    console.log('Es wurde nichts geschrieben. Erst die Fehler beheben.');
    process.exit(1);
  }

  if (!ok.length) {
    console.log('\nNichts zu tun.');
    return;
  }

  if (!APPLY) {
    console.log('\nProbelauf. Nichts geändert. Mit --apply übernehmen.');
    return;
  }

  for (const c of ok) setText(json, c.key, c.to);
  writeFileSync(TEXTS_FILE, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  console.log(`\nGeschrieben: src/i18n/de/common.json`);
  console.log('Jetzt: npx tsc --noEmit, dann committen.');
}

// --- Befehle ----------------------------------------------------------------

if (!existsSync(TEXTS_FILE)) {
  fail('src/i18n/de/common.json nicht gefunden. Im Projektordner ausführen.');
}

if (command === 'export') {
  const rows = flatten(JSON.parse(readUtf8(TEXTS_FILE)));
  const lines = [['Schlüssel', 'Bereich', 'Text'].join(SEP)];
  for (const [key, text] of rows) {
    lines.push([key, area(key), text].map(csvField).join(SEP));
  }
  // BOM am Anfang, damit Excel die Umlaute richtig erkennt.
  writeFileSync(CSV_FILE, `\uFEFF${lines.join('\r\n')}\r\n`, 'utf8');
  console.log(`Geschrieben: texte-de.csv (${rows.length} Texte)`);
  console.log('Nur die Spalte „Text" bearbeiten. Speichern als „CSV UTF-8".');
} else if (command === 'import') {
  if (!file) fail('Welche Datei? z. B.: node scripts/texts.mjs import texte-de.csv');
  const rows = parseCsv(readUtf8(file));
  const header = rows.shift() ?? [];
  const keyCol = header.indexOf('Schlüssel');
  const textCol = header.indexOf('Text');
  if (keyCol < 0 || textCol < 0) {
    fail('In der ersten Zeile fehlen die Spalten „Schlüssel" und „Text".');
  }
  // Eine beschädigte Tabelle soll nicht still Zeilen verschlucken.
  const broken = rows.findIndex((r) => r.length !== header.length);
  if (broken >= 0) {
    fail(`Zeile ${broken + 2} hat ${rows[broken].length} statt ${header.length} Spalten. Datei beschädigt?`);
  }
  const inFile = new Set(rows.map((r) => r[keyCol]));
  const missing = flatten(JSON.parse(readUtf8(TEXTS_FILE)))
    .map(([k]) => k)
    .filter((k) => !inFile.has(k));
  if (missing.length) {
    fail(`${missing.length} Schlüssel fehlen in der Tabelle, z. B. ${missing[0]}. Zeilen gelöscht?`);
  }
  check(
    rows.map((r) => ({ key: r[keyCol], to: r[textCol] ?? '' })),
    file,
  );
} else if (command === 'apply') {
  if (!file) fail('Welche Datei? z. B.: node scripts/texts.mjs apply elefin-texte-2026-09-21.json');
  const data = JSON.parse(readUtf8(file));
  if (data.format !== 'elefin-text-changes/1' || !Array.isArray(data.changes)) {
    fail('Das ist keine Änderungsdatei der Textseite.');
  }
  check(data.changes, `${file} (${data.changes.length} Einträge)`);
} else {
  console.log('Befehle: export | import <datei.csv> | apply <datei.json>   (dazu --apply zum Schreiben)');
}
