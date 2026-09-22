/**
 * Prüfungen des Fragenkatalogs.
 *
 * Diese Tests sind das Sicherheitsnetz für Schritt 2 und alles danach: Der
 * Katalog wächst, Texte werden umformuliert, Screens kommen dazu. Ein
 * vergessener Textschlüssel fällt hier auf — und nicht erst im Gespräch mit
 * einer Testnutzerin, die auf einen leeren Screen schaut.
 *
 * Geprüft wird nur Deutsch. Englisch ist bewusst zurückgestellt, bis der
 * Katalog nach der Testrunde steht.
 */
import { describe, expect, it } from 'vitest';

import { CATEGORIES, isCategory } from '@/domain';

import de from '../i18n/de/common.json';
import { loadCatalog, parseCatalog } from './load';
import type { CatalogScreen } from './types';

const catalog = loadCatalog();

/** Alle Textschlüssel der deutschen Sprachdatei, flach: "flow.start.title" usw. */
function textKeys(obj: unknown, prefix = '', out = new Set<string>()): Set<string> {
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') textKeys(v, key, out);
    else out.add(key);
  }
  return out;
}
const keys = textKeys(de);

/** Blöcke ohne eigene Überschrift: der Startscreen und der Abschluss. */
const BLOCKS_OHNE_TITEL = ['intro', 'finish'];

const kebab = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const snake = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

function fieldsOf(screen: CatalogScreen) {
  return screen.fields.map((f) => ({ screen, field: f }));
}
const alleFelder = catalog.screens.flatMap(fieldsOf);

describe('Katalog: Aufbau', () => {
  it('lädt und ist gültig', () => {
    expect(catalog.screens.length).toBeGreaterThan(0);
  });

  it('weist einen falschen Katalog zurück', () => {
    expect(() =>
      parseCatalog({ schemaVersion: 1, screens: [{ id: 'x', kind: 'kein-typ', block: 'b', repeatable: false, fields: [] }] }),
    ).toThrow();
  });

  it('kennt keine erfundenen Kategorien', () => {
    expect(() =>
      parseCatalog({
        schemaVersion: 1,
        screens: [{ id: 'x', kind: 'question', block: 'b', category: 'gibt_es_nicht', repeatable: false, fields: [] }],
      }),
    ).toThrow();
  });

  it('hat eindeutige Screen-IDs in kebab-case', () => {
    const gesehen = new Set<string>();
    for (const s of catalog.screens) {
      if (gesehen.has(s.id)) throw new Error(`Screen-ID "${s.id}" kommt zweimal vor`);
      gesehen.add(s.id);
      if (!kebab.test(s.id)) throw new Error(`Screen-ID "${s.id}" ist nicht kebab-case`);
    }
    expect(gesehen.size).toBe(catalog.screens.length);
  });

  it('nutzt für Felder und Optionen snake_case', () => {
    for (const { screen, field } of alleFelder) {
      if (!snake.test(field.id)) throw new Error(`${screen.id}: Feld "${field.id}" ist nicht snake_case`);
      for (const o of field.options ?? []) {
        if (!snake.test(o.value)) throw new Error(`${screen.id}.${field.id}: Option "${o.value}" ist nicht snake_case`);
      }
    }
  });

  it('gibt Feld-IDs je Kategorie nur einmal', () => {
    const belegt = new Map<string, string>();
    for (const { screen, field } of alleFelder) {
      const schluessel = `${screen.category}.${field.id}`;
      const schonIn = belegt.get(schluessel);
      if (schonIn) {
        throw new Error(`Feld "${field.id}" gibt es in ${screen.category} zweimal: ${schonIn} und ${screen.id}`);
      }
      belegt.set(schluessel, screen.id);
    }
  });

  it('hat Optionen genau bei Auswahlfeldern', () => {
    for (const { screen, field } of alleFelder) {
      const hatOptionen = (field.options ?? []).length > 0;
      const brauchtOptionen = field.type !== 'text';
      if (hatOptionen !== brauchtOptionen) {
        throw new Error(`${screen.id}.${field.id}: Typ "${field.type}" passt nicht zu ${hatOptionen ? '' : 'fehlenden '}Optionen`);
      }
      const werte = (field.options ?? []).map((o) => o.value);
      if (new Set(werte).size !== werte.length) {
        throw new Error(`${screen.id}.${field.id}: doppelter Optionswert`);
      }
    }
  });

  it('hat Felder nur auf Screens mit Kategorie', () => {
    for (const s of catalog.screens) {
      if (s.fields.length > 0 && !s.category) throw new Error(`${s.id}: Felder ohne Kategorie`);
      if (s.showIf && s.kind !== 'question') throw new Error(`${s.id}: showIf gehört zu einem Frage-Screen`);
    }
  });

  it('deckt jede Kategorie mit mindestens einem Screen ab', () => {
    for (const c of CATEGORIES) {
      if (c === 'case_profile') continue;
      const hat = catalog.screens.some((s) => s.category === c);
      if (!hat) throw new Error(`Kategorie ${c} hat keinen Screen`);
    }
  });
});

describe('Katalog: Inventar', () => {
  const inventar = catalog.screens.find((s) => s.id === 'inventory');
  const feld = inventar?.fields.find((f) => f.id === 'inventory');

  it('gibt es', () => {
    expect(inventar).toBeDefined();
    expect(feld).toBeDefined();
  });

  it('bietet genau die Kategorien an, die Screens bedingt zeigen', () => {
    const imInventar = (feld?.options ?? []).map((o) => o.value).sort();
    const bedingt = catalog.screens.filter((s) => s.showIf).map((s) => s.showIf as string);
    const erwartet = [...new Set(bedingt)].sort();
    expect(imInventar).toEqual(erwartet);
  });

  it('nennt nur echte Kategorien', () => {
    for (const o of feld?.options ?? []) {
      if (!isCategory(o.value)) throw new Error(`Inventar: "${o.value}" ist keine Kategorie`);
    }
  });
});

describe('Katalog: Textschlüssel auf Deutsch', () => {
  function braucht(key: string, warum: string) {
    if (!keys.has(key)) throw new Error(`Text fehlt: ${key} (${warum})`);
  }

  it('hat für jeden Screen einen Titel', () => {
    for (const s of catalog.screens) braucht(`flow.${s.id}.title`, `Titel von ${s.id}`);
  });

  it('hat für jeden Frage-Screen eine Zeile auf der Übersicht', () => {
    for (const s of catalog.screens) {
      if (s.kind !== 'question') continue;
      braucht(`flow.${s.id}.summary.title`, 'Übersicht');
      braucht(`flow.${s.id}.summary.empty`, 'Übersicht, solange leer');
    }
  });

  it('beschriftet jeden Aufklapper', () => {
    for (const s of catalog.screens) {
      if (s.fields.some((f) => f.inDisclosure)) braucht(`flow.${s.id}.disclosure.title`, 'Aufklapper');
    }
  });

  it('beschriftet jedes Textfeld und nennt ein Beispiel', () => {
    for (const { screen, field } of alleFelder) {
      if (field.type !== 'text') continue;
      braucht(`question.${screen.category}.${field.id}.label`, `Feld in ${screen.id}`);
      braucht(`question.${screen.category}.${field.id}.placeholder`, `Beispiel in ${screen.id}`);
    }
  });

  it('beschriftet jede Option', () => {
    for (const { screen, field } of alleFelder) {
      for (const o of field.options ?? []) {
        braucht(`option.${screen.category}.${field.id}.${o.value}.label`, `Option in ${screen.id}`);
      }
    }
  });

  it('hat für jeden Block eine Überschrift', () => {
    for (const s of catalog.screens) {
      if (BLOCKS_OHNE_TITEL.includes(s.block)) continue;
      braucht(`block.${s.block}.title`, `Block von ${s.id}`);
    }
  });

  it('hat die allgemeinen Texte, die jeder Screen braucht', () => {
    for (const k of ['common.next', 'common.back', 'common.unknown', 'common.progress']) braucht(k, 'allgemein');
    for (const s of catalog.screens) {
      if (s.trustNote) {
        braucht('common.trust.title', `Vertrauenshinweis auf ${s.id}`);
        braucht('common.trust.text', `Vertrauenshinweis auf ${s.id}`);
      }
    }
  });
});

describe('Katalog: keine verwaisten Texte', () => {
  const screenIds = new Set(catalog.screens.map((s) => s.id));
  const felder = new Set(alleFelder.map(({ screen, field }) => `${screen.category}.${field.id}`));
  const optionen = new Set(
    alleFelder.flatMap(({ screen, field }) =>
      (field.options ?? []).map((o) => `${screen.category}.${field.id}.${o.value}`),
    ),
  );
  const bloecke = new Set(catalog.screens.map((s) => s.block));

  it('flow.* gehört zu einem Screen', () => {
    for (const k of keys) {
      if (!k.startsWith('flow.')) continue;
      const id = k.split('.')[1] ?? '';
      if (!screenIds.has(id)) throw new Error(`Text ${k} gehört zu keinem Screen`);
    }
  });

  it('question.* gehört zu einem Feld', () => {
    for (const k of keys) {
      if (!k.startsWith('question.')) continue;
      const [, kategorie, feld] = k.split('.');
      if (!felder.has(`${kategorie}.${feld}`)) throw new Error(`Text ${k} gehört zu keinem Feld`);
    }
  });

  it('option.* gehört zu einer Option', () => {
    for (const k of keys) {
      if (!k.startsWith('option.')) continue;
      const [, kategorie, feld, wert] = k.split('.');
      if (!optionen.has(`${kategorie}.${feld}.${wert}`)) throw new Error(`Text ${k} gehört zu keiner Option`);
    }
  });

  it('block.* gehört zu einem Block', () => {
    for (const k of keys) {
      if (!k.startsWith('block.')) continue;
      const block = k.split('.')[1] ?? '';
      if (!bloecke.has(block)) throw new Error(`Text ${k} gehört zu keinem Block`);
    }
  });
});