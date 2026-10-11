// OpenWire: draw wire harnesses in the browser.
// This module connects the parts and runs the commands.

import {
  createProject,
  duplicateConnector,
  findConnector,
  findWire,
  makeConnector,
  removeConnector,
  removeWire,
  serializeProject,
  wiresOnConnector,
} from './model.js';
import { createStore } from './store.js';
import { createCanvas } from './canvas.js';
import { createInspector } from './inspector.js';
import { createTables } from './tables.js';
import { bomTable, cutListTable, escapeHtml as esc, tableHtml, toCsv, toTsv } from './report.js';
import {
  PROJECT_EXTENSION,
  canWriteInPlace,
  drafts,
  fileBaseName,
  parseProjectText,
  pickProjectFile,
  readProjectFile,
  saveFile,
} from './files.js';

const EXAMPLE_URL = 'examples/tail-lamp-harness.openwire.json';
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const $ = (id) => document.getElementById(id);

document.documentElement.classList.add('is-loading');

const store = createStore(createProject());
const canvasWrap = $('canvas');
const canvas = createCanvas(canvasWrap, store);
createInspector($('panel-properties'), store);
createTables({ cutlist: $('panel-cutlist'), bom: $('panel-bom'), checks: $('panel-checks') }, store, {
  badge: $('checks-badge'),
  onSelect: selectFromList,
});

// The file that holds the project. `handle` exists only in Chrome and Edge.
const file = { handle: null, name: null, dirty: false };

// ---------- Messages ----------

function toast(message, { error = false } = {}) {
  const el = document.createElement('div');
  el.className = `toast${error ? ' is-error' : ''}`;
  el.textContent = message;
  $('toasts').append(el);
  setTimeout(() => el.remove(), error ? 7000 : 3800);
}

function confirmDiscard() {
  if (!file.dirty) return true;
  return window.confirm('Your changes are not saved to a file. If you continue, you lose them. Continue?');
}

// ---------- Status ----------

function updateStatus() {
  const name = store.project.meta.name.trim() || 'Untitled harness';
  const state = $('doc-state');
  $('doc-name').textContent = name;
  if (file.dirty) state.textContent = file.name ? 'Unsaved changes' : 'Not saved to a file';
  else state.textContent = file.name ? `Saved: ${file.name}` : 'Not saved to a file';
  state.classList.toggle('is-dirty', file.dirty);
  state.title = file.name || '';
  document.title = `${file.dirty ? '* ' : ''}${name} – OpenWire`;
}

function updateHistoryButtons() {
  document.querySelector('[data-cmd="undo"]').disabled = !store.canUndo();
  document.querySelector('[data-cmd="redo"]').disabled = !store.canRedo();
}

// ---------- Draft in this browser ----------

let draftTimer = 0;

function writeDraft() {
  clearTimeout(draftTimer);
  draftTimer = 0;
  drafts.save({
    json: serializeProject(store.project),
    dirty: file.dirty,
    fileName: file.name,
    savedAt: new Date().toISOString(),
  });
}

function scheduleDraft(delay = 600) {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(writeDraft, delay);
}

// ---------- Tabs ----------

const tabs = [...document.querySelectorAll('[role="tab"]')];

function showTab(name, { focus = false } = {}) {
  for (const tab of tabs) {
    const active = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    $(tab.getAttribute('aria-controls')).hidden = !active;
    if (active && focus) tab.focus();
  }
}

for (const tab of tabs) tab.addEventListener('click', () => showTab(tab.dataset.tab));

document.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
  const index = tabs.indexOf(document.activeElement);
  if (index < 0) return;
  let next = null;
  if (e.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
  else if (e.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
  else if (e.key === 'Home') next = tabs[0];
  else if (e.key === 'End') next = tabs[tabs.length - 1];
  if (next) {
    e.preventDefault();
    showTab(next.dataset.tab, { focus: true });
  }
});

// ---------- Selection ----------

let selectingFromList = false;

// The cut list stays open, so you can go down the list.
// An issue in Checks opens Properties, so you can correct the item.
function selectFromList(target, source) {
  selectingFromList = true;
  store.select(target);
  selectingFromList = false;
  canvas.focusItem(target);
  if (source === 'checks') showTab('properties');
}

// ---------- Projects and files ----------

function loadProject(project, { name = null, handle = null, dirty = false } = {}) {
  store.replace(project);
  file.name = name;
  file.handle = handle;
  file.dirty = dirty;
  drafts.saveHandle(handle);
  updateStatus();
  writeDraft();
  showTab('properties');
  requestAnimationFrame(() => canvas.fit());
}

async function openFile(picked, handle = null) {
  let project;
  try {
    project = await readProjectFile(picked);
  } catch (error) {
    toast(error.message, { error: true });
    return;
  }
  if (!confirmDiscard()) return;
  const isDrawing = /\.svg$/i.test(picked.name);
  loadProject(project, { name: isDrawing ? null : picked.name, handle: isDrawing ? null : handle });
  toast(isDrawing ? `Opened the drawing ${picked.name}. Use Save to keep it as a project file.` : `Opened ${picked.name}.`);
}

async function openFromPicker() {
  let picked;
  try {
    picked = await pickProjectFile();
  } catch (error) {
    toast(`OpenWire cannot open the file. ${error.message}`, { error: true });
    return;
  }
  if (picked) await openFile(picked.file, picked.handle);
}

async function openExample({ quiet = false } = {}) {
  if (!quiet && !confirmDiscard()) return;
  try {
    const response = await fetch(EXAMPLE_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`The server sent status ${response.status}.`);
    loadProject(parseProjectText(await response.text(), 'example.json'));
    if (!quiet) toast('Opened the example. Save it as a file to keep your changes.');
  } catch {
    if (!quiet) toast('OpenWire cannot load the example. Make sure that the examples folder is on the server.', { error: true });
  }
}

function newDrawing() {
  if (!confirmDiscard()) return;
  loadProject(createProject());
  toast('Started a new drawing.');
}

function savedMessage(result) {
  return result.downloaded
    ? `Downloaded ${result.name}. Find it in your downloads folder.`
    : `Saved ${result.name}.`;
}

async function saveProject({ asNew = false } = {}) {
  const project = store.project;
  const suggestedName = !asNew && file.name ? file.name : `${fileBaseName(project.meta.name)}${PROJECT_EXTENSION}`;
  try {
    const result = await saveFile(serializeProject(project), {
      handle: asNew ? null : file.handle,
      suggestedName,
      kind: 'project',
    });
    if (!result) return;
    file.handle = result.handle;
    file.name = result.name;
    file.dirty = false;
    drafts.saveHandle(result.handle);
    updateStatus();
    writeDraft();
    toast(savedMessage(result));
  } catch (error) {
    toast(`OpenWire did not save the file. ${error.message}`, { error: true });
  }
}

async function exportFile(contents, suggestedName, kind) {
  try {
    const result = await saveFile(contents, { suggestedName, kind });
    if (result) toast(savedMessage(result));
  } catch (error) {
    toast(`OpenWire did not save the file. ${error.message}`, { error: true });
  }
}

async function copyTable(table, what) {
  try {
    await navigator.clipboard.writeText(toTsv(table));
    toast(`Copied the ${what}. You can paste it into a spreadsheet.`);
  } catch {
    toast('OpenWire cannot use the clipboard in this browser. Use Download CSV.', { error: true });
  }
}

const baseName = () => fileBaseName(store.project.meta.name);

// ---------- Editing commands ----------

function addConnector() {
  const pinCount = 4;
  const place = canvas.placeForNewConnector(pinCount);
  let created = null;
  store.update(
    (project) => {
      created = makeConnector(project, { ...place, pinCount });
      project.connectors.push(created);
    },
    { source: 'app', structural: true },
  );
  store.select({ type: 'connector', id: created.id });
  showTab('properties');
}

function duplicateSelection() {
  const sel = store.selection;
  if (sel?.type !== 'connector') return;
  let copy = null;
  store.update(
    (project) => {
      copy = duplicateConnector(project, sel.id);
    },
    { source: 'app', structural: true },
  );
  if (copy) store.select({ type: 'connector', id: copy.id });
}

function deleteSelection() {
  const sel = store.selection;
  if (!sel) return;
  const project = store.project;
  if (sel.type === 'connector') {
    const c = findConnector(project, sel.id);
    if (!c) return;
    const count = wiresOnConnector(project, c.id).length;
    store.update((p) => removeConnector(p, sel.id), { source: 'app', structural: true });
    toast(count ? `Deleted ${c.ref} and ${count} ${count === 1 ? 'wire' : 'wires'}. Undo brings them back.` : `Deleted ${c.ref}.`);
  } else if (sel.type === 'wire') {
    const w = findWire(project, sel.id);
    if (!w) return;
    store.update((p) => removeWire(p, sel.id), { source: 'app', structural: true });
    toast(`Deleted ${w.ref}.`);
  }
}

function swapEnds() {
  const sel = store.selection;
  if (sel?.type !== 'wire') return;
  store.update(
    (project) => {
      const w = findWire(project, sel.id);
      if (w) [w.from, w.to] = [w.to, w.from];
    },
    { source: 'app', structural: true },
  );
}

// ---------- Print ----------

function buildPrintSheet() {
  const p = store.project;
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date());
  const drawing = p.connectors.length ? canvas.exportSvg({ embedData: false, title: false, xmlDeclaration: false }) : '';
  const cut = p.wires.length ? `<section class="print-table"><h2>Cut list</h2>${tableHtml(cutListTable(p))}</section>` : '';
  const bom = p.connectors.length || p.wires.length
    ? `<section class="print-table"><h2>Bill of materials</h2>${tableHtml(bomTable(p))}</section>`
    : '';
  $('print-sheet').innerHTML = `
    <header class="print-title">
      <h1>${esc(p.meta.name || 'Untitled harness')}</h1>
      <dl>
        <div><dt>Revision</dt><dd>${esc(p.meta.revision || '')}</dd></div>
        <div><dt>Author</dt><dd>${esc(p.meta.author || '')}</dd></div>
        <div><dt>Date</dt><dd>${esc(date)}</dd></div>
      </dl>
    </header>
    <section class="print-drawing">${drawing}</section>
    ${cut}${bom}`;
}

window.addEventListener('beforeprint', buildPrintSheet);
window.addEventListener('afterprint', () => {
  $('print-sheet').innerHTML = '';
});

// ---------- Commands ----------

const commands = {
  new: newDrawing,
  open: openFromPicker,
  save: () => saveProject(),
  'save-as': () => saveProject({ asNew: true }),
  'export-svg': () => exportFile(canvas.exportSvg(), `${baseName()}.svg`, 'svg'),
  'export-cutlist': () => exportFile(toCsv(cutListTable(store.project)), `${baseName()}-cut-list.csv`, 'csv'),
  'export-bom': () => exportFile(toCsv(bomTable(store.project)), `${baseName()}-bom.csv`, 'csv'),
  'copy-cutlist': () => copyTable(cutListTable(store.project), 'cut list'),
  'copy-bom': () => copyTable(bomTable(store.project), 'bill of materials'),
  print: () => {
    buildPrintSheet();
    window.print();
  },
  example: () => openExample(),
  undo: () => store.undo(),
  redo: () => store.redo(),
  'add-connector': addConnector,
  duplicate: duplicateSelection,
  delete: deleteSelection,
  'swap-ends': swapEnds,
  'zoom-in': () => canvas.zoomBy(1.25),
  'zoom-out': () => canvas.zoomBy(0.8),
  fit: () => canvas.fit(),
};

function run(name) {
  const command = commands[name];
  if (command) command();
}

// ---------- File menu ----------

const menuButton = $('file-button');
const menu = $('file-menu');
const menuItems = () => [...menu.querySelectorAll('[role="menuitem"]')];

function openMenu({ focusFirst = false } = {}) {
  menu.hidden = false;
  menuButton.setAttribute('aria-expanded', 'true');
  if (focusFirst) menuItems()[0]?.focus();
}

function closeMenu({ returnFocus = false } = {}) {
  if (menu.hidden) return;
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  if (returnFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
menuButton.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    openMenu({ focusFirst: true });
  }
});

menu.addEventListener('keydown', (e) => {
  const items = menuItems();
  const index = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const step = e.key === 'ArrowDown' ? 1 : -1;
    items[(index + step + items.length) % items.length].focus();
  } else if (e.key === 'Home' || e.key === 'End') {
    e.preventDefault();
    items[e.key === 'Home' ? 0 : items.length - 1].focus();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    closeMenu({ returnFocus: true });
  } else if (e.key === 'Tab') {
    closeMenu();
  }
});

document.addEventListener('pointerdown', (e) => {
  if (!menu.hidden && !e.target.closest('.menu')) closeMenu();
});

// One click handler runs every button that has data-cmd.
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-cmd]');
  if (!el || el.disabled) return;
  if (el.closest('.menu-list')) closeMenu();
  run(el.dataset.cmd);
});

// ---------- Keyboard ----------

function formatKeys(keys) {
  if (!isMac) return keys;
  const parts = keys.split('+');
  const key = parts.pop();
  const shift = parts.includes('Shift') ? '⇧' : '';
  const command = parts.includes('Ctrl') ? '⌘' : '';
  return `${shift}${command}${key}`;
}

for (const el of document.querySelectorAll('[data-keys]')) {
  const keys = formatKeys(el.dataset.keys);
  if (el.tagName === 'KBD') el.textContent = keys;
  else el.title = `${el.dataset.tip || el.getAttribute('aria-label') || el.textContent.trim()} (${keys})`;
}

function isEditable(el) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

document.addEventListener('keydown', (e) => {
  const mod = isMac ? e.metaKey : e.ctrlKey;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const editable = isEditable(e.target);

  if (mod && !e.altKey) {
    if (key === 's') {
      e.preventDefault();
      run(e.shiftKey ? 'save-as' : 'save');
    } else if (key === 'o') {
      e.preventDefault();
      run('open');
    } else if (!editable && key === 'z') {
      e.preventDefault();
      run(e.shiftKey ? 'redo' : 'undo');
    } else if (!editable && key === 'y') {
      e.preventDefault();
      run('redo');
    } else if (!editable && key === 'd') {
      e.preventDefault();
      run('duplicate');
    }
    return;
  }

  if (key === 'Escape') {
    if (!menu.hidden) closeMenu({ returnFocus: true });
    else if (canvas.cancelPending()) e.preventDefault();
    else if (!editable && store.selection) store.select(null);
    return;
  }

  if (editable || e.altKey || e.ctrlKey || e.metaKey) return;
  if (key === 'Delete' || key === 'Backspace') {
    if (store.selection) {
      e.preventDefault();
      run('delete');
    }
  } else if (key === '+' || key === '=') {
    run('zoom-in');
  } else if (key === '-' || key === '_') {
    run('zoom-out');
  } else if (key === 'f') {
    run('fit');
  }
});

// ---------- Drag a file onto the page to open it ----------

const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files');

window.addEventListener('dragover', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

window.addEventListener('drop', (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  const dropped = e.dataTransfer.files?.[0];
  if (!dropped) return;
  // Ask for the file handle during the event. Later the browser does not give it.
  const item = Array.from(e.dataTransfer.items || []).find((i) => i.kind === 'file');
  const handlePromise =
    canWriteInPlace && typeof item?.getAsFileSystemHandle === 'function'
      ? item.getAsFileSystemHandle().catch(() => null)
      : Promise.resolve(null);
  handlePromise.then((handle) => openFile(dropped, handle?.kind === 'file' ? handle : null));
});

// ---------- Store events ----------

store.subscribe((type) => {
  if (type === 'change') {
    file.dirty = true;
    updateStatus();
    scheduleDraft();
  } else if (type === 'history') {
    updateHistoryButtons();
  } else if (type === 'select') {
    if (store.selection && !selectingFromList) showTab('properties');
  } else if (type === 'replace') {
    updateStatus();
  }
});

// Keep the draft when the page goes to the background or closes.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && draftTimer) writeDraft();
});

window.addEventListener('beforeunload', (e) => {
  if (draftTimer) writeDraft();
  if (file.dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Fit the drawing when the drawing area first gets its size.
let firstFit = true;
new ResizeObserver(() => {
  if (firstFit && canvasWrap.clientWidth > 0 && canvasWrap.clientHeight > 0) {
    firstFit = false;
    canvas.fit();
  }
}).observe(canvasWrap);

// ---------- Start ----------

async function start() {
  updateHistoryButtons();
  let restored = false;
  const draft = await drafts.load();
  if (draft?.json) {
    try {
      store.replace(parseProjectText(draft.json, 'draft.json'));
      file.name = draft.fileName || null;
      file.dirty = Boolean(draft.dirty);
      const handle = file.name && canWriteInPlace ? await drafts.loadHandle() : null;
      file.handle = handle && handle.name === file.name ? handle : null;
      restored = true;
      if (file.dirty) toast('OpenWire restored your unsaved work from this browser.');
    } catch {
      restored = false;
    }
  }
  if (!restored) await openExample({ quiet: true });
  updateStatus();
  document.documentElement.classList.remove('is-loading');
  requestAnimationFrame(() => canvas.fit());
}

start();
