// Opens and saves files. OpenWire works like draw.io:
// the project lives in the browser while you work, and you save it as a file
// on your own computer. Nothing goes to a server.
//
// Chrome and Edge on the desktop can write back to the same file.
// Other browsers download a new copy each time you save.

import { normalizeProject, serializeProject } from './model.js';
import { DATA_NS } from './canvas.js';
import { looksLikeZip, readZip, writeZip } from './zip.js';

// A project is saved as a ZIP package: project.json and the schematic files.
// OpenWire also opens and saves the older .openwire.json text files.
export const PROJECT_EXTENSION = '.openwire.zip';
export const JSON_EXTENSION = '.openwire.json';
export const isJsonName = (name) => /\.json$/i.test(name || '');

export const FILE_TYPES = {
  project: {
    types: [{ description: 'OpenWire project', accept: { 'application/json': ['.json'] } }],
    mime: 'application/json',
  },
  zip: {
    types: [{ description: 'OpenWire project', accept: { 'application/zip': ['.zip'] } }],
    mime: 'application/zip',
  },
  svg: {
    types: [{ description: 'SVG drawing', accept: { 'image/svg+xml': ['.svg'] } }],
    mime: 'image/svg+xml',
  },
  csv: {
    types: [{ description: 'CSV table', accept: { 'text/csv': ['.csv'] } }],
    mime: 'text/csv',
  },
};

const OPEN_TYPES = [
  {
    description: 'OpenWire project or drawing',
    accept: { 'application/zip': ['.zip'], 'application/json': ['.json'], 'image/svg+xml': ['.svg'] },
  },
];

export const canWriteInPlace =
  typeof window.showOpenFilePicker === 'function' && typeof window.showSaveFilePicker === 'function';

export function isAbort(error) {
  return Boolean(error) && error.name === 'AbortError';
}

// Makes a file name from the harness name. Letters in any language are kept.
export function fileBaseName(name) {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'harness';
}

// ---------- Reading ----------

function fromBase64(text) {
  const binary = atob(text.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// Reads the text of a project file (.json) or of a drawing that OpenWire exported (.svg).
export function parseProjectText(text, fileName = '') {
  const clean = String(text).replace(/^\uFEFF/, '').trimStart();
  const looksLikeSvg = clean.startsWith('<') || /\.svg$/i.test(fileName);

  if (looksLikeSvg) {
    const doc = new DOMParser().parseFromString(clean, 'image/svg+xml');
    if (doc.getElementsByTagName('parsererror').length) {
      throw new Error('OpenWire cannot read this SVG file.');
    }
    const data = doc.getElementsByTagNameNS(DATA_NS, 'openwire')[0];
    if (!data) {
      throw new Error('This SVG file has no OpenWire data. You can only open drawings that OpenWire exported.');
    }
    let raw;
    try {
      raw = JSON.parse(fromBase64(data.textContent || ''));
    } catch {
      throw new Error('The OpenWire data in this SVG file is damaged.');
    }
    return normalizeProject(raw);
  }

  let raw;
  try {
    raw = JSON.parse(clean);
  } catch {
    throw new Error('The file is not an OpenWire project. OpenWire opens .json project files and SVG drawings that it exported.');
  }
  return normalizeProject(raw);
}

// Reads a project from a ZIP package, a .json file or an exported .svg file.
export async function readProjectFile(file) {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (!looksLikeZip(head)) return parseProjectText(await file.text(), file.name);
  let entries;
  try {
    entries = await readZip(file);
  } catch (error) {
    throw new Error(`OpenWire cannot read this ZIP file. ${error.message}`);
  }
  const json = entries.get('project.json');
  if (!json) throw new Error('This ZIP file is not an OpenWire project. It has no project.json file.');
  const project = parseProjectText(new TextDecoder().decode(json), 'project.json');
  for (const f of Object.values(project.files)) {
    const bytes = entries.get(f.path);
    if (bytes) f.blob = new Blob([bytes], { type: f.type });
  }
  return project;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Makes the contents of a project file: a ZIP package, or JSON text.
export async function buildProjectFile(project, format) {
  if (format === 'json') {
    const fileData = {};
    for (const s of project.schematics) {
      const f = project.files[s.file];
      if (f?.blob && !fileData[s.file]) fileData[s.file] = await blobToDataUrl(f.blob);
    }
    return serializeProject(project, { fileData });
  }
  const entries = [{ name: 'project.json', data: serializeProject(project), compress: true }];
  const done = new Set();
  for (const s of project.schematics) {
    const f = project.files[s.file];
    if (!f?.blob || done.has(s.file)) continue;
    done.add(s.file);
    // Text files (for example KiCad files) are compressed. PDF and pictures are already compressed.
    const text = /^text\/|json|xml|svg/.test(f.type) || /\.(kicad_\w+|sch|net|txt|csv)$/i.test(f.name);
    entries.push({ name: pathOf(s.file, f), data: f.blob, compress: text });
  }
  return writeZip(entries);
}

function pathOf(id, f) {
  return f.path || `schematics/${id}-${f.name}`;
}

function pickWithInput(accept) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.hidden = true;
    const done = (file) => {
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => done(input.files?.[0] || null), { once: true });
    input.addEventListener('cancel', () => done(null), { once: true });
    document.body.append(input);
    input.click();
  });
}

// Asks for a file. Returns { file, handle } or null when the user cancels.
// `handle` is only available in browsers that can write back to the file.
export async function pickProjectFile() {
  if (canWriteInPlace) {
    try {
      const [handle] = await window.showOpenFilePicker({ id: 'openwire', types: OPEN_TYPES, multiple: false });
      return { file: await handle.getFile(), handle };
    } catch (error) {
      if (isAbort(error)) return null;
      throw error;
    }
  }
  const file = await pickWithInput('.zip,.json,.svg,application/zip,application/json,image/svg+xml');
  return file ? { file, handle: null } : null;
}

// ---------- Writing ----------

async function ensureWritePermission(handle) {
  if (typeof handle.queryPermission !== 'function') return;
  const options = { mode: 'readwrite' };
  if ((await handle.queryPermission(options)) === 'granted') return;
  if ((await handle.requestPermission(options)) !== 'granted') {
    throw new Error('OpenWire did not get permission to change the file.');
  }
}

async function writeToHandle(handle, contents) {
  await ensureWritePermission(handle);
  const writable = await handle.createWritable();
  await writable.write(contents);
  await writable.close();
}

export function download(contents, name, mime) {
  const blob = contents instanceof Blob ? contents : new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// Saves text to a file.
// With a handle, OpenWire writes to the same file again.
// Without a handle, the user picks a place, or the browser downloads the file.
// Returns { handle, name, downloaded } or null when the user cancels.
export async function saveFile(contents, { handle = null, suggestedName, kind }) {
  const { types, mime } = FILE_TYPES[kind];
  if (handle) {
    await writeToHandle(handle, contents);
    return { handle, name: handle.name, downloaded: false };
  }
  if (typeof window.showSaveFilePicker === 'function') {
    let picked;
    try {
      picked = await window.showSaveFilePicker({ id: `openwire-${kind}`, suggestedName, types });
    } catch (error) {
      if (isAbort(error)) return null;
      throw error;
    }
    await writeToHandle(picked, contents);
    return { handle: picked, name: picked.name, downloaded: false };
  }
  download(contents, suggestedName, mime);
  return { handle: null, name: suggestedName, downloaded: true };
}

// ---------- Draft in this browser ----------
// OpenWire keeps a copy of your work in the browser (IndexedDB), so a closed tab
// or a crash does not lose it. This copy is only a safety net: the browser can
// delete it when you clear your browsing data. Save to a file to keep your work.

const DB_NAME = 'openwire';
const STORE_NAME = 'drafts';
const LOCAL_KEY = 'openwire.draft';
let dbPromise = null;

function openDb() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is not available.'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('IndexedDB is blocked.'));
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

async function kv(mode, operation) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const request = operation(tx.objectStore(STORE_NAME));
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function localGet() {
  try {
    const text = localStorage.getItem(LOCAL_KEY);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function localSet(record) {
  try {
    // localStorage keeps only text, so the schematic files are not in this copy.
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...record, files: undefined }));
  } catch {
    /* No storage is available. The draft is not kept. */
  }
}

export const drafts = {
  // Returns { json, files, dirty, fileName, savedAt } or null. `files` maps a file id to a Blob.
  async load() {
    try {
      const record = await kv('readonly', (store) => store.get('draft'));
      return record || localGet();
    } catch {
      return localGet();
    }
  },

  async save(record) {
    try {
      await kv('readwrite', (store) => store.put(record, 'draft'));
    } catch {
      localSet(record);
    }
  },

  // A file handle lets "Save" write to the same file after the page loads again.
  // Only Chrome and Edge can keep a handle.
  async loadHandle() {
    try {
      return (await kv('readonly', (store) => store.get('handle'))) || null;
    } catch {
      return null;
    }
  },

  async saveHandle(handle) {
    try {
      if (handle) await kv('readwrite', (store) => store.put(handle, 'handle'));
      else await kv('readwrite', (store) => store.delete('handle'));
    } catch {
      /* This browser cannot keep file handles. */
    }
  },
};
