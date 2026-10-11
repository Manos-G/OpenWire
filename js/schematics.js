// Schematics tab. Keep schematic files with the project, for example PDF
// drawings, pictures or KiCad files. They are saved inside the project ZIP file.

import { addSchematic, removeSchematic, schematicFile } from './model.js';
import { escapeHtml as esc } from './report.js';
import { formatBytes } from './images.js';
import { download } from './files.js';

const MAX_FILE = 100 * 1024 * 1024; // 100 MB for one file.

const urls = new Map(); // A blob: address for each file, to open and to show pictures.
function urlOf(fileId, f) {
  let url = urls.get(fileId);
  if (!url && f?.blob) {
    url = URL.createObjectURL(f.blob);
    urls.set(fileId, url);
  }
  return url || '';
}

function kindOf(f) {
  if (/pdf/.test(f.type) || /\.pdf$/i.test(f.name)) return 'pdf';
  if (/^image\//.test(f.type)) return 'image';
  if (/\.(kicad_sch|kicad_pcb|kicad_pro|sch|brd|dsn)$/i.test(f.name)) return 'cad';
  return 'file';
}

const ICONS = {
  pdf: '<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M3 2h18l8 8v28H3Z" fill="#fff" stroke="#c42b27" stroke-width="2"/><path d="M21 2v8h8" fill="none" stroke="#c42b27" stroke-width="2"/><text x="16" y="31" text-anchor="middle" font-size="9" font-weight="700" fill="#c42b27">PDF</text></svg>',
  cad: '<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M3 2h18l8 8v28H3Z" fill="#fff" stroke="#1f5fbf" stroke-width="2"/><path d="M21 2v8h8" fill="none" stroke="#1f5fbf" stroke-width="2"/><path d="M8 20h6m4 0h6M14 16v8h4v-8Z" fill="none" stroke="#1f5fbf" stroke-width="1.6"/><text x="16" y="34" text-anchor="middle" font-size="7" font-weight="700" fill="#1f5fbf">CAD</text></svg>',
  file: '<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M3 2h18l8 8v28H3Z" fill="#fff" stroke="#56636f" stroke-width="2"/><path d="M21 2v8h8" fill="none" stroke="#56636f" stroke-width="2"/></svg>',
};

function extension(name) {
  const m = /\.([^.]+)$/.exec(name || '');
  return m ? m[1].toUpperCase() : 'FILE';
}

export function createSchematics(panel, store, { toast, onCount }) {
  function pickFiles() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.hidden = true;
      const done = (files) => {
        input.remove();
        resolve(files);
      };
      input.addEventListener('change', () => done([...(input.files || [])]), { once: true });
      input.addEventListener('cancel', () => done([]), { once: true });
      document.body.append(input);
      input.click();
    });
  }

  // Adds files to the project. Returns the number of files that were added.
  function addFiles(files) {
    const ok = files.filter((f) => f.size <= MAX_FILE);
    const tooBig = files.length - ok.length;
    if (tooBig) toast(`${tooBig === 1 ? 'One file is' : `${tooBig} files are`} larger than 100 MB. OpenWire did not add ${tooBig === 1 ? 'it' : 'them'}.`, { error: true });
    if (!ok.length) return 0;
    store.update(
      (project) => {
        for (const f of ok) addSchematic(project, { name: f.name, type: f.type, size: f.size, blob: f });
      },
      { source: 'schematics', structural: true },
    );
    toast(ok.length === 1 ? `Added ${ok[0].name}.` : `Added ${ok.length} files.`);
    return ok.length;
  }

  function card(item) {
    const f = schematicFile(store.project, item);
    const kind = f ? kindOf(f) : 'file';
    const missing = !f?.blob;
    const url = missing ? '' : urlOf(item.file, f);
    const preview =
      kind === 'image' && url
        ? `<img src="${esc(url)}" alt="" loading="lazy">`
        : `<span class="sch-icon">${ICONS[kind] || ICONS.file}</span>`;
    const id = esc(item.id);
    return `<li class="sch-card${missing ? ' is-missing' : ''}">
      <button type="button" class="sch-preview" data-sch-act="open" data-sch="${id}" title="Open ${esc(f?.name || '')}"${missing ? ' disabled' : ''}>${preview}</button>
      <div class="sch-body">
        <input class="input sch-name" type="text" data-sch-name="${id}" value="${esc(item.name)}" maxlength="80" aria-label="Name" autocomplete="off" spellcheck="false">
        <p class="sch-facts">${esc(extension(f?.name))} · ${formatBytes(f?.size || 0)}${missing ? ' · <strong>File missing</strong>' : ''}</p>
        <input class="input sch-note" type="text" data-sch-note="${id}" value="${esc(item.note)}" maxlength="200" placeholder="Note, for example Rev. B" aria-label="Note" autocomplete="off">
        <div class="sch-actions">
          <button type="button" class="button small" data-sch-act="open" data-sch="${id}"${missing ? ' disabled' : ''}>Open</button>
          <button type="button" class="button small" data-sch-act="download" data-sch="${id}"${missing ? ' disabled' : ''}>Download</button>
          <button type="button" class="button small danger" data-sch-act="delete" data-sch="${id}">Delete</button>
        </div>
      </div>
    </li>`;
  }

  function render() {
    const p = store.project;
    const list = p.schematics;
    const total = list.reduce((n, s) => n + (schematicFile(p, s)?.size || 0), 0);
    panel.innerHTML = `<div class="panel-head">
        <p class="panel-summary">${list.length ? `<strong>${list.length} ${list.length === 1 ? 'file' : 'files'}</strong>, ${formatBytes(total)}` : 'No schematics yet'}</p>
        <div class="panel-actions"><button type="button" class="button small primary" data-sch-act="add">Add files</button></div>
      </div>
      <div class="sch-scroll">
        ${list.length ? `<ul class="sch-list">${list.map(card).join('')}</ul>` : ''}
        <div class="sch-drop" data-sch-act="add" role="button" tabindex="0">
          <p><strong>Add schematics</strong>: PDF files, pictures, KiCad files or other files.</p>
          <p>Click here, or drag the files into this tab. OpenWire saves them inside the project file (ZIP).</p>
        </div>
      </div>`;
    onCount?.(list.length);
  }

  function findItem(id) {
    return store.project.schematics.find((s) => s.id === id) || null;
  }

  panel.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-sch-act]');
    if (!el || el.disabled) return;
    const act = el.dataset.schAct;
    if (act === 'add') {
      addFiles(await pickFiles());
      return;
    }
    const item = findItem(el.dataset.sch);
    const f = item && schematicFile(store.project, item);
    if (!item) return;
    if (act === 'open' && f?.blob) {
      // The browser shows PDF files and pictures. Other files download.
      const win = window.open(urlOf(item.file, f), '_blank', 'noopener');
      if (!win && !/pdf|image/.test(f.type)) download(f.blob, f.name, f.type);
    } else if (act === 'download' && f?.blob) {
      download(f.blob, f.name, f.type);
    } else if (act === 'delete') {
      store.update((project) => removeSchematic(project, item.id), { source: 'schematics', structural: true });
      toast(`Deleted ${item.name}. Undo brings it back.`);
    }
  });

  panel.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.sch-drop')) {
      e.preventDefault();
      e.target.click();
    }
  });

  panel.addEventListener('input', (e) => {
    const el = e.target;
    const id = el.dataset.schName || el.dataset.schNote;
    if (!id) return;
    const field = el.dataset.schName ? 'name' : 'note';
    store.update(
      (project) => {
        const item = project.schematics.find((s) => s.id === id);
        if (item) item[field] = el.value;
      },
      { source: 'schematics', coalesce: `sch:${field}:${id}` },
    );
  });
  panel.addEventListener('focusout', () => store.endCoalesce());

  store.subscribe((type, info = {}) => {
    if (type === 'replace') {
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
      render();
    } else if (type === 'change' && info.source !== 'schematics-typing' && (info.structural || info.source === 'history')) {
      render();
    }
  });

  render();
  return { render, addFiles };
}
