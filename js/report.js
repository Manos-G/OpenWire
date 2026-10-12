// Table data for the cut list and the bill of materials.
// The screen tables, the CSV files and the printed report use the same data.

import { billOfMaterials, cutList } from './model.js';

const number = (digits) =>
  new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits });
const fixed = (digits) =>
  new Intl.NumberFormat(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function formatLength(mm) {
  return mm == null ? '' : number(1).format(mm);
}

export function formatMeters(mm) {
  return fixed(2).format((mm || 0) / 1000);
}

export function formatMoney(value, currency) {
  const amount = fixed(2).format(value || 0);
  if (!currency) return amount;
  return currency.length === 1 ? `${currency}${amount}` : `${currency} ${amount}`;
}

// Each table: { headers, rows, footer, numeric }.
// `numeric` lists the column indexes to align on the right.
// Cells are plain strings. `rowIds` connects rows to drawing items.

export function cutListTable(project) {
  const rows = cutList(project);
  return {
    headers: ['Line', 'From', 'To', 'Signal', 'Color', 'Gauge or size', 'Length (mm)', 'Cut length (mm)'],
    rows: rows.map((r) => [
      r.ref,
      r.from,
      r.to,
      r.signal,
      r.color,
      r.gauge,
      formatLength(r.length),
      formatLength(r.cutLength),
    ]),
    rowTargets: rows.map((r) => ({ type: 'wire', id: r.id })),
    footer: null,
    numeric: [6, 7],
  };
}

export function bomTable(project) {
  const currency = project.settings.currency;
  const { lines, total } = billOfMaterials(project);
  return {
    headers: ['Item', 'Type', 'Part number', 'Manufacturer', 'Description', 'Used in', 'Quantity', 'Unit', 'Unit price', 'Total'],
    rows: lines.map((line, i) => [
      String(i + 1),
      line.type,
      line.partNumber,
      line.manufacturer,
      line.description,
      line.refs.join(', '),
      line.unit === 'm' ? fixed(2).format(line.quantity) : String(line.quantity),
      line.unit,
      formatMoney(line.unitPrice, currency),
      formatMoney(line.cost, currency),
    ]),
    rowTargets: lines.map(() => null),
    footer: ['', '', '', '', 'Total', '', '', '', '', formatMoney(total, currency)],
    numeric: [0, 6, 8, 9],
  };
}

// ---------- CSV and tab-separated text ----------

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(table) {
  const lines = [table.headers, ...table.rows];
  if (table.footer) lines.push(table.footer);
  // The byte order mark helps spreadsheet programs read the file as UTF-8.
  return `\uFEFF${lines.map((line) => line.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

export function toTsv(table) {
  const clean = (value) => String(value ?? '').replace(/[\t\r\n]+/g, ' ');
  const lines = [table.headers, ...table.rows];
  if (table.footer) lines.push(table.footer);
  return lines.map((line) => line.map(clean).join('\t')).join('\n');
}

// ---------- HTML ----------

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function tableHtml(table, { className = 'data-table', selectable = false } = {}) {
  const align = (i) => (table.numeric.includes(i) ? ' class="num"' : '');
  const head = table.headers.map((h, i) => `<th scope="col"${align(i)}>${escapeHtml(h)}</th>`).join('');
  const body = table.rows
    .map((row, r) => {
      const target = selectable ? table.rowTargets[r] : null;
      const attrs = target ? ` data-target-type="${target.type}" data-target-id="${escapeHtml(target.id)}" tabindex="0"` : '';
      const cells = row.map((cell, i) => `<td${align(i)}>${escapeHtml(cell)}</td>`).join('');
      return `<tr${attrs}>${cells}</tr>`;
    })
    .join('');
  const foot = table.footer
    ? `<tfoot><tr>${table.footer.map((cell, i) => `<td${align(i)}>${escapeHtml(cell)}</td>`).join('')}</tr></tfoot>`
    : '';
  return `<table class="${className}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot}</table>`;
}
