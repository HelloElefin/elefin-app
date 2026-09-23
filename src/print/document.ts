/**
 * Das Blatt für den Ordner.
 *
 * Baut aus Katalog, Akten-Kopf und Antworten eine fertige HTML-Seite, die
 * der Browser drucken kann. Reine Funktion: Texte und Zeitpunkt kommen von
 * außen, damit sie sich prüfen lässt.
 *
 * Warum HTML und nicht die App-Oberfläche: Nur so lassen sich Seitenränder,
 * Umbrüche und Schriftgrößen für den Druck wirklich bestimmen.
 *
 * Was auf das Blatt gehört, ist eine bewusste Entscheidung: Auch offene
 * Punkte werden gedruckt. Dass es ein drittes Konto gibt, von dem nichts
 * notiert ist, gehört zu den wertvollsten Angaben überhaupt.
 */
import type { Catalog, CatalogField, CatalogScreen } from '@/catalog';
import {
  activeScreens,
  answerKey,
  getAnswer,
  hasValue,
  passesFor,
  summaryRows,
  type Answers,
  type CaseFile,
  type Category,
  type ExtraPasses,
} from '@/domain';

export type PrintInput = {
  catalog: Catalog;
  caseFile: CaseFile;
  answers: Answers;
  extraPasses: ExtraPasses;
  /** Text zu einem Schlüssel, wie in der App. */
  text: (key: string, vars?: Record<string, unknown>) => string;
  exists: (key: string) => boolean;
  /** Erstellungszeitpunkt, wird in der Fußzeile genannt. */
  now: Date;
};

/** Nichts aus den Antworten darf als HTML wirken. */
function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Eine Antwort als lesbarer Text — oder null, wenn nichts dasteht. */
function valueOf(input: PrintInput, screen: CatalogScreen, pass: number, field: CatalogField): string | null {
  const category = screen.category as Category;
  const answer = getAnswer(input.answers, answerKey(category, pass, field.id));
  if (answer.state === 'unknown') return input.text('print.unknown');
  if (!hasValue(answer)) return null;

  const raw = answer.state === 'answered' ? answer.value : '';
  const label = (v: string) => {
    const key = `option.${category}.${field.id}.${v}.label`;
    return input.exists(key) ? input.text(key) : v;
  };
  return Array.isArray(raw) ? raw.map(label).join(', ') : field.type === 'text' ? raw : label(raw);
}

/** Ein Durchgang als Liste aus Beschriftung und Wert. */
function passLines(input: PrintInput, screen: CatalogScreen, pass: number): string[] {
  const lines: string[] = [];
  for (const field of screen.fields) {
    const value = valueOf(input, screen, pass, field);
    if (value === null) continue;
    const labelKey = `question.${screen.category}.${field.id}.label`;
    const label = input.exists(labelKey) ? input.text(labelKey) : '';
    lines.push(
      label === ''
        ? `<div class="wert">${escape(value)}</div>`
        : `<div class="zeile"><span class="feld">${escape(label)}</span><span class="wert">${escape(value)}</span></div>`,
    );
  }
  return lines;
}

/** Diese beiden stehen im Kopf und werden weiter unten nicht wiederholt. */
const KOPF_SCREENS = ['emergency-contact', 'documents'];

/** Der Kopf: was in den ersten Stunden zählt. */
function headBlock(input: PrintInput): string {
  const teile: string[] = [];
  for (const id of KOPF_SCREENS) {
    const screen = input.catalog.screens.find((s) => s.id === id);
    if (!screen) continue;
    const passes = passesFor(screen, input.caseFile, input.extraPasses);
    const inhalte: string[] = [];
    for (let pass = 1; pass <= passes; pass++) inhalte.push(...passLines(input, screen, pass));
    if (inhalte.length === 0) continue;
    teile.push(
      `<section class="kopf-teil"><h3>${escape(input.text(`flow.${id}.summary.title`))}</h3>${inhalte.join('')}</section>`,
    );
  }
  return teile.length > 0 ? `<div class="kopf">${teile.join('')}</div>` : '';
}

export function buildPrintHtml(input: PrintInput): string {
  const rows = summaryRows(input.catalog, input.caseFile, input.answers, input.extraPasses);
  const zustand = new Map(rows.map((r) => [r.screenId, r]));
  const abschnitte: string[] = [];
  let letzterBlock = '';

  for (const screen of activeScreens(input.catalog, input.caseFile)) {
    if (screen.kind !== 'question' || !screen.category) continue;
    if (KOPF_SCREENS.includes(screen.id)) continue;
    const row = zustand.get(screen.id);
    if (!row) continue;

    if (screen.block !== letzterBlock) {
      letzterBlock = screen.block;
      const key = `block.${screen.block}.title`;
      if (input.exists(key)) abschnitte.push(`<h2>${escape(input.text(key))}</h2>`);
    }

    const titel = escape(input.text(`flow.${screen.id}.summary.title`));
    const passes = passesFor(screen, input.caseFile, input.extraPasses);

    const durchgaenge: string[] = [];
    for (let pass = 1; pass <= passes; pass++) {
      const lines = passLines(input, screen, pass);
      if (lines.length === 0) continue;
      const nummer = passes > 1 ? `<div class="nummer">${pass}</div>` : '';
      durchgaenge.push(`<div class="durchgang">${nummer}${lines.join('')}</div>`);
    }

    // Auch wenn nichts dasteht: Das Thema kommt aufs Blatt, mit Hinweis.
    const rest =
      row.declared !== null && row.filled > 0 && row.filled < passes
        ? `<div class="offen">${escape(
            input.text('print.count', {
              filled: row.filled,
              declared: input.exists(`common.count.${row.declared}`)
                ? input.text(`common.count.${row.declared}`)
                : String(row.declared),
            }),
          )}</div>`
        : durchgaenge.length === 0
          ? `<div class="offen">${escape(input.text('print.missing'))}</div>`
          : '';

    abschnitte.push(`<section class="thema"><h3>${titel}</h3>${durchgaenge.join('')}${rest}</section>`);
  }

  const datum = input.now.toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' });

  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>${escape(input.text('print.title'))}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 11pt/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #1A2320; }
  h1 { font-size: 20pt; margin: 0 0 2mm; }
  h2 { font-size: 9pt; letter-spacing: .08em; text-transform: uppercase; color: #5A6663;
       margin: 8mm 0 2mm; border-bottom: .3mm solid #E2E0DB; padding-bottom: 1mm; }
  h3 { font-size: 11pt; margin: 0 0 1mm; }
  .datum { color: #5A6663; font-size: 9pt; margin-bottom: 6mm; }
  .kopf { border: .4mm solid #1F5F5B; border-radius: 2mm; padding: 4mm; margin-bottom: 6mm; }
  .kopf-teil + .kopf-teil { margin-top: 3mm; }
  .thema { margin-bottom: 4mm; page-break-inside: avoid; }
  .durchgang { margin-bottom: 1.5mm; padding-left: 4mm; position: relative; }
  .nummer { position: absolute; left: 0; top: 0; color: #5A6663; font-size: 9pt; }
  .zeile { display: flex; gap: 3mm; }
  .feld { color: #5A6663; min-width: 38mm; }
  .wert { flex: 1; }
  .offen { color: #5A6663; font-style: italic; padding-left: 4mm; }
  .fuss { margin-top: 10mm; padding-top: 3mm; border-top: .3mm solid #E2E0DB; color: #5A6663; font-size: 8.5pt; }
  @media screen { body { padding: 10mm; max-width: 190mm; margin: 0 auto; } }
</style></head>
<body>
  <h1>${escape(input.text('print.title'))}</h1>
  <div class="datum">${escape(input.text('print.created', { date: datum }))}</div>
  ${headBlock(input)}
  ${abschnitte.join('\n  ')}
  <div class="fuss">${escape(input.text('print.footer'))}</div>
</body></html>`;
}