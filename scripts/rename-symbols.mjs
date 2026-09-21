#!/usr/bin/env node
/**
 * scripts/rename-symbols.mjs
 *
 * Benennt Bezeichner im Code typbewusst um — dasselbe wie F2 in VS Code,
 * nur fuer eine ganze Liste auf einmal. Zeichenketten und Kommentare
 * werden NICHT angefasst, Eigenschaften (Objektfelder) ebenfalls nicht.
 *
 *   node scripts/rename-symbols.mjs          Probelauf mit scripts/rename-map.json
 *   node scripts/rename-symbols.mjs --apply  Umbenennung durchfuehren
 *   node scripts/rename-symbols.mjs --list   Alle Bezeichner nach scripts/names.txt
 *
 * Voraussetzung:  npm i -D ts-morph
 */

import tsMorph from 'ts-morph';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';

const { Project, SyntaxKind, Node } = tsMorph;

const ROOT = process.cwd();
const MAP_FILE = join(ROOT, 'scripts', 'rename-map.json');
const NAMES_FILE = join(ROOT, 'scripts', 'names.txt');

const MODE = process.argv.includes('--list')
  ? 'list'
  : process.argv.includes('--apply')
    ? 'apply'
    : 'dry';

const rel = (p) => relative(ROOT, p).split('\\').join('/');

/** Deklarationsarten, die gefahrlos umbenannt werden koennen. */
const KINDS = {
  [SyntaxKind.FunctionDeclaration]: 'fn',
  [SyntaxKind.ClassDeclaration]: 'class',
  [SyntaxKind.InterfaceDeclaration]: 'iface',
  [SyntaxKind.TypeAliasDeclaration]: 'type',
  [SyntaxKind.EnumDeclaration]: 'enum',
  [SyntaxKind.VariableDeclaration]: 'var',
  [SyntaxKind.Parameter]: 'param',
  [SyntaxKind.MethodDeclaration]: 'method',
  [SyntaxKind.TypeParameter]: 'tparam',
};

/**
 * Werden NICHT automatisch umbenannt: Objektfelder koennen in der
 * Datenbank oder im verschluesselten Inhalt landen. Nur zur Ansicht.
 */
const NUR_ANSICHT = {
  [SyntaxKind.PropertySignature]: 'feld',
  [SyntaxKind.PropertyDeclaration]: 'feld',
  [SyntaxKind.PropertyAssignment]: 'feld',
  [SyntaxKind.BindingElement]: 'destr',
};

// --- Projekt laden ---------------------------------------------------------

const project = new Project({ tsConfigFilePath: join(ROOT, 'tsconfig.json') });
const quellen = project
  .getSourceFiles()
  .filter((sf) => rel(sf.getFilePath()).startsWith('src/'));

function deklarationen(sf, name, arten = KINDS) {
  const treffer = [];
  for (const kind of Object.keys(arten)) {
    for (const d of sf.getDescendantsOfKind(Number(kind))) {
      const n = d.getNameNode?.();
      if (n && Node.isIdentifier(n) && n.getText() === name) treffer.push(d);
    }
  }
  return treffer;
}

// --- Modus: Liste ----------------------------------------------------------

if (MODE === 'list') {
  const bekannt = new Set();
  if (existsSync(MAP_FILE)) {
    for (const e of JSON.parse(readFileSync(MAP_FILE, 'utf8'))) bekannt.add(e.to);
  }

  const zeilen = [];
  const sammeln = (sf, arten) => {
    const gesehen = new Set();
    const out = [];
    for (const [kind, kurz] of Object.entries(arten)) {
      for (const d of sf.getDescendantsOfKind(Number(kind))) {
        const n = d.getNameNode?.();
        if (!n || !Node.isIdentifier(n)) continue;
        const name = n.getText();
        if (name.length <= 2 || bekannt.has(name)) continue;
        const schluessel = `${kurz} ${name}`;
        if (gesehen.has(schluessel)) continue;
        gesehen.add(schluessel);
        out.push(`  ${kurz.padEnd(7)}${name}`);
      }
    }
    return out;
  };

  for (const sf of quellen) {
    const a = sammeln(sf, KINDS);
    const b = sammeln(sf, NUR_ANSICHT);
    if (!a.length && !b.length) continue;
    zeilen.push(rel(sf.getFilePath()));
    zeilen.push(...a);
    if (b.length) {
      zeilen.push('  -- nur Ansicht, wird nicht automatisch umbenannt --');
      zeilen.push(...b);
    }
    zeilen.push('');
  }

  writeFileSync(NAMES_FILE, zeilen.join('\n'), 'utf8');
  console.log(`Geschrieben: ${rel(NAMES_FILE)}  (${zeilen.length} Zeilen)`);
  process.exit(0);
}

// --- Modus: Probelauf / Anwenden -------------------------------------------

if (!existsSync(MAP_FILE)) {
  console.error(`Fehler: ${rel(MAP_FILE)} fehlt.`);
  process.exit(1);
}

if (MODE === 'apply') {
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((z) => z.trim() && !z.startsWith('?? scripts/'));
  if (status.length) {
    console.error('Fehler: Arbeitsbaum nicht sauber (ausser neuen Dateien in scripts/).');
    console.error('Erst committen:');
    for (const z of status) console.error(`  ${z}`);
    process.exit(1);
  }
}

const eintraege = JSON.parse(readFileSync(MAP_FILE, 'utf8'));
let umbenannt = 0;
let warnungen = 0;

for (const e of eintraege) {
  const sf = project.getSourceFile(join(ROOT, e.file));
  if (!sf) {
    console.warn(`WARNUNG  Datei fehlt: ${e.file}`);
    warnungen++;
    continue;
  }

  // Zeichenketten-Werte, nur in genau dieser Datei (z. B. Knopf-Auspraegungen)
  if (e.literal) {
    const muster = new RegExp(`(['"])${e.literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g');
    const text = sf.getFullText();
    const anzahl = (text.match(muster) ?? []).length;
    if (!anzahl) {
      console.warn(`WARNUNG  '${e.literal}' nicht gefunden in ${e.file}`);
      warnungen++;
      continue;
    }
    console.log(`${MODE === 'apply' ? 'ersetzt ' : 'wuerde  '} '${e.literal}' -> '${e.to}'  ${e.file}  (${anzahl})`);
    if (MODE === 'apply') sf.replaceWithText(text.replace(muster, `$1${e.to}$1`));
    umbenannt++;
    continue;
  }

  const decls = deklarationen(sf, e.from);
  if (!decls.length) {
    console.warn(`WARNUNG  ${e.from} nicht deklariert in ${e.file}`);
    warnungen++;
    continue;
  }

  // Referenzen zaehlen und auf Namenskollisionen pruefen
  const refs = decls.flatMap((d) => d.getNameNode().findReferencesAsNodes());
  const betroffen = new Set([sf, ...refs.map((r) => r.getSourceFile())]);
  const kollision = [...betroffen].filter((f) =>
    f.getDescendantsOfKind(SyntaxKind.Identifier).some((i) => i.getText() === e.to),
  );

  console.log(
    `${MODE === 'apply' ? 'umbenannt' : 'wuerde   '} ${e.from} -> ${e.to}  ${e.file}  (${refs.length + decls.length} Stellen)`,
  );
  for (const f of kollision) {
    console.warn(`  WARNUNG  "${e.to}" existiert schon in ${rel(f.getFilePath())}`);
    warnungen++;
  }

  if (MODE === 'apply') {
    let schutz = 0;
    let offen;
    while ((offen = deklarationen(sf, e.from)).length && schutz++ < 50) {
      offen[0].getNameNode().rename(e.to, {
        renameInComments: false,
        renameInStrings: false,
        usePrefixAndSuffixText: false,
      });
    }
  }
  umbenannt++;
}

if (MODE === 'apply') await project.save();

console.log('');
console.log(`Eintraege:  ${umbenannt}`);
console.log(`Warnungen:  ${warnungen}`);
console.log('');
if (MODE === 'apply') {
  console.log('Fertig. Jetzt pruefen:');
  console.log('  npx tsc --noEmit');
  console.log('  npx vitest run');
} else {
  console.log('Probelauf. Nichts geaendert. Mit --apply ausfuehren.');
}
