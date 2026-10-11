// Cut list, bill of materials and checks.
// The panels draw again after each change. The drawing selection is marked in the cut list.

import { billOfMaterials, isPositive, runChecks, totalWireLength } from './model.js';
import { bomTable, cutListTable, escapeHtml as esc, formatMeters, formatMoney, tableHtml } from './report.js';

const LEVEL_NAMES = { error: 'Error', warning: 'Warning', info: 'Note' };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function actions(copyCmd, downloadCmd, enabled) {
  const disabled = enabled ? '' : ' disabled';
  return `<div class="panel-actions">
    <button type="button" class="button small" data-cmd="${copyCmd}"${disabled}>Copy</button>
    <button type="button" class="button small" data-cmd="${downloadCmd}"${disabled}>Download CSV</button>
  </div>`;
}

export function createTables(panels, store, { badge, onSelect }) {
  let frame = 0;

  function renderCutList() {
    const p = store.project;
    const count = p.wires.length;
    const missing = p.wires.filter((w) => !isPositive(w.length)).length;
    let summary = 'No wires yet';
    if (count) {
      summary = `<strong>${plural(count, 'wire', 'wires')}</strong>, <strong>${formatMeters(totalWireLength(p))} m</strong> to cut`;
      if (missing) summary += `. ${plural(missing, 'wire has', 'wires have')} no length.`;
    }
    const body = count
      ? `<div class="table-scroll">${tableHtml(cutListTable(p), { selectable: true })}</div>`
      : '<p class="panel-empty">To add a wire, drag from one pin to a different pin in the drawing.</p>';
    panels.cutlist.innerHTML = `<div class="panel-head">
        <p class="panel-summary">${summary}</p>
        ${actions('copy-cutlist', 'export-cutlist', count > 0)}
      </div>${body}`;
  }

  function renderBom() {
    const p = store.project;
    const { lines, total } = billOfMaterials(p);
    let summary = 'No parts yet';
    if (lines.length) {
      summary = `<strong>${plural(lines.length, 'line', 'lines')}</strong>`;
      if (total > 0) summary += `, estimated cost <strong>${esc(formatMoney(total, p.settings.currency))}</strong>`;
    }
    const body = lines.length
      ? `<div class="table-scroll">${tableHtml(bomTable(p))}</div>`
      : '<p class="panel-empty">Add connectors and wires. The bill of materials fills in by itself.</p>';
    panels.bom.innerHTML = `<div class="panel-head">
        <p class="panel-summary">${summary}</p>
        ${actions('copy-bom', 'export-bom', lines.length > 0)}
      </div>${body}`;
  }

  function renderChecks() {
    const issues = runChecks(store.project);
    const count = { error: 0, warning: 0, info: 0 };
    for (const issue of issues) count[issue.level] += 1;

    const parts = [];
    if (count.error) parts.push(plural(count.error, 'error', 'errors'));
    if (count.warning) parts.push(plural(count.warning, 'warning', 'warnings'));
    if (count.info) parts.push(plural(count.info, 'note', 'notes'));

    const list = issues
      .map(
        (issue) => `<li><button type="button" class="issue is-${issue.level}"
          data-target-type="${esc(issue.target.type)}" data-target-id="${esc(issue.target.id)}">
          <span class="issue-level">${LEVEL_NAMES[issue.level]}</span><span>${esc(issue.message)}</span>
        </button></li>`,
      )
      .join('');

    panels.checks.innerHTML = issues.length
      ? `<p class="panel-summary">${parts.join(', ')}. Select a line to find the item in the drawing.</p><ul class="issues">${list}</ul>`
      : '<p class="checks-ok">No problems found.</p>';

    const problems = count.error + count.warning;
    badge.hidden = problems === 0;
    badge.textContent = String(problems);
    badge.classList.toggle('is-warning', count.error === 0);
    badge.title = parts.join(', ');
  }

  function markSelection() {
    for (const row of panels.cutlist.querySelectorAll('tr.is-selected')) row.classList.remove('is-selected');
    const sel = store.selection;
    if (sel?.type === 'wire') {
      panels.cutlist.querySelector(`tr[data-target-id="${CSS.escape(sel.id)}"]`)?.classList.add('is-selected');
    }
  }

  function renderAll() {
    frame = 0;
    renderCutList();
    renderBom();
    renderChecks();
    markSelection();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(renderAll);
  }

  for (const [name, panel] of [['cutlist', panels.cutlist], ['checks', panels.checks]]) {
    panel.addEventListener('click', (e) => {
      const el = e.target.closest('[data-target-id]');
      if (el) onSelect({ type: el.dataset.targetType, id: el.dataset.targetId }, name);
    });
    panel.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-target-id]')) {
        e.preventDefault();
        e.target.click();
      }
    });
  }

  store.subscribe((type, info = {}) => {
    if (type === 'select') markSelection();
    else if (type === 'replace' || (type === 'change' && info.kind !== 'move')) schedule();
  });

  renderAll();
  return { render: renderAll };
}
