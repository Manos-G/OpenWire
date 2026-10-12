// OpenWire data model.
// This module has no DOM access, so the calculations are easy to test.

export const FORMAT = 'openwire';
export const FORMAT_VERSION = 1;
export const MAX_PINS = 200;
export const MAX_POLES = 8;
export const MAX_OUTPUTS = 12;

// A pin can be an input, an output, or not set ('').
export const PIN_ROLES = [
  { code: '', name: 'Not set' },
  { code: 'in', name: 'Input' },
  { code: 'out', name: 'Output' },
];

// Lever colors of the splitter, one for each input.
export const SPLITTER_COLORS = ['BU', 'OG', 'GN', 'RD', 'VT', 'YE', 'BN', 'GY'];

// USB plug types for the ends of a USB cable.
export const USB_TYPES = [
  { code: 'A', name: 'USB-A' },
  { code: 'B', name: 'USB-B' },
  { code: 'C', name: 'USB-C' },
  { code: 'MICRO', name: 'Micro-USB' },
  { code: 'MINI', name: 'Mini-USB' },
  { code: 'BARREL', name: 'DC barrel plug' },
];

// Common DC barrel plug sizes: outer diameter × inner (pin) diameter, in mm.
export const BARREL_SIZES = [
  { outer: 5.5, inner: 2.1 },
  { outer: 5.5, inner: 2.5 },
  { outer: 4.0, inner: 1.7 },
  { outer: 3.5, inner: 1.35 },
  { outer: 3.0, inner: 1.1 },
  { outer: 2.5, inner: 0.7 },
  { outer: 6.3, inner: 3.0 },
];

const mmText = (n) => String(Math.round(n * 100) / 100);
export const barrelSizeText = (w) => `${mmText(w.barrelOuter)} × ${mmText(w.barrelInner)} mm`;

export function usbName(code) {
  return USB_TYPES.find((t) => t.code === code)?.name || code || '';
}

// Name of one end of a USB or DC cable, with the barrel size for a barrel plug.
export function plugName(w, code) {
  return code === 'BARREL' ? `DC barrel ${barrelSizeText(w)}` : usbName(code);
}

export const hasBarrel = (w) => w?.kind === 'usb' && (w.usbA === 'BARREL' || w.usbB === 'BARREL');

// Raspberry Pi camera (CSI) and display (DSI) flat cables. Each end is the
// standard 15-pin connector (1 mm pitch) or the mini 22-pin connector (0.5 mm pitch).
export const FLAT_ENDS = [
  { code: '15', name: '15-pin (standard)' },
  { code: '22', name: '22-pin (mini)' },
];
export const FLAT_USES = [
  { code: 'CSI', name: 'CSI (camera)' },
  { code: 'DSI', name: 'DSI (display)' },
];

// The sides of a connector. Each side has groups of pins.
export const SIDES = [
  { code: 'left', name: 'Left side' },
  { code: 'right', name: 'Right side' },
  { code: 'top', name: 'Top side' },
  { code: 'bottom', name: 'Bottom side' },
];

// Connector types for a pin group. The type only changes the graphic.
// It does not limit the number of pins.
export const CONNECTOR_TYPES = [
  { code: 'generic', name: 'Generic (no graphic)' },
  { code: 'xt30', name: 'XT30' },
  { code: 'xt60', name: 'XT60' },
  { code: 'xt90', name: 'XT90' },
  { code: 'ec5', name: 'EC5' },
  { code: 'deans', name: 'Deans (T-plug)' },
  { code: 'anderson', name: 'Anderson Powerpole' },
  { code: 'microfit', name: 'Molex Micro-Fit 3.0' },
  { code: 'minifit', name: 'Molex Mini-Fit Jr.' },
  { code: 'kk254', name: 'Molex KK 254' },
  { code: 'picoblade', name: 'Molex PicoBlade' },
  { code: 'jst-xh', name: 'JST XH' },
  { code: 'jst-ph', name: 'JST PH' },
  { code: 'jst-sm', name: 'JST SM' },
  { code: 'dupont', name: 'Dupont 2.54 mm' },
  { code: 'dt', name: 'Deutsch DT' },
  { code: 'superseal', name: 'Superseal 1.5' },
  { code: 'm12', name: 'M12 circular' },
  { code: 'rj45', name: 'RJ45' },
  { code: 'barrel', name: 'DC barrel jack' },
  { code: 'terminal', name: 'Screw terminal' },
  { code: 'lever', name: 'Lever terminal (WAGO)' },
  { code: 'ring', name: 'Ring or spade terminal' },
  { code: 'barb', name: 'Hose barb (vacuum)' },
  { code: 'pushin', name: 'Push-in fitting (vacuum)' },
];

export const connectorTypeName = (code) => CONNECTOR_TYPES.find((t) => t.code === code)?.name || code;

export const isSplitter = (c) => c?.kind === 'splitter';
export const isUsb = (w) => w?.kind === 'usb';
export const isFlat = (w) => w?.kind === 'flat';
export const isTube = (w) => w?.kind === 'tube';
// Electrical wires that you cut from a reel.
export const isCutWire = (w) => !w?.kind || w.kind === 'wire';
// Everything that you cut from a reel or a roll: wires and vacuum hoses.
export const isCutItem = (w) => isCutWire(w) || isTube(w);
export const WIRE_KINDS = [
  { code: 'wire', name: 'Wire' },
  { code: 'tube', name: 'Vacuum line (hose)' },
  { code: 'usb', name: 'USB / DC cable' },
  { code: 'flat', name: 'CSI/DSI flat cable' },
];

// Vacuum hoses.
export const TUBE_MATERIALS = [
  { code: 'silicone', name: 'Silicone' },
  { code: 'epdm', name: 'EPDM rubber' },
  { code: 'nbr', name: 'Nitrile rubber (NBR)' },
  { code: 'fkm', name: 'Fluoroelastomer (FKM)' },
  { code: 'pa', name: 'Nylon (PA)' },
  { code: 'pu', name: 'Polyurethane (PU)' },
  { code: 'pvc', name: 'PVC' },
];
// Common hose sizes: inner × outer diameter, in mm.
export const TUBE_SIZES = [
  // Thin tubes for mini vacuum pumps and suction cups.
  { inner: 2, outer: 4 },
  { inner: 2.5, outer: 4 },
  { inner: 3, outer: 5 },
  { inner: 4, outer: 6 },
  // Hoses for engines and larger pumps.
  { inner: 3, outer: 6 },
  { inner: 4, outer: 7 },
  { inner: 4, outer: 8 },
  { inner: 5, outer: 9 },
  { inner: 6, outer: 9 },
  { inner: 6, outer: 10 },
  { inner: 8, outer: 12 },
  { inner: 10, outer: 14 },
];
export const tubeMaterialName = (code) => TUBE_MATERIALS.find((m) => m.code === code)?.name || code || '';
export const tubeSizeText = (w) => `${mmText(w.tubeInner)} × ${mmText(w.tubeOuter)} mm`;

// Splitters: a lever splitter for wires, or a tee or manifold for vacuum hoses.
export const isManifold = (c) => c?.kind === 'splitter' && c.style === 'manifold';
export const componentNoun = (c) => (isManifold(c) ? 'vacuum tee' : isSplitter(c) ? 'splitter' : 'connector');
// A connector can have a graphic in its middle: a mini vacuum pump or a suction cup.
export const SHAPES = [
  { code: '', name: 'None' },
  { code: 'pump', name: 'Mini vacuum pump' },
  { code: 'cup', name: 'Suction cup' },
];
const SHAPE_PREFIX = { pump: 'P', cup: 'SC' };
const SHAPE_TYPE = { pump: 'Pump', cup: 'Suction cup' };
export const shapeName = (code) => SHAPES.find((s) => s.code === code)?.name || '';

export const refPrefix = (c) => (isManifold(c) ? 'T' : isSplitter(c) ? 'S' : SHAPE_PREFIX[c?.shape] || 'X');

// The components in a selection: one connector or splitter, or several ('multi').
export function selectedComponentIds(selection) {
  if (selection?.type === 'connector') return [selection.id];
  if (selection?.type === 'multi') return [...selection.ids];
  return [];
}

export function componentSelection(ids) {
  const unique = [...new Set(ids)];
  if (unique.length > 1) return { type: 'multi', ids: unique };
  if (unique.length === 1) return { type: 'connector', id: unique[0] };
  return null;
}

// Wire insulation colors with IEC 60757 codes.
export const WIRE_COLORS = [
  { code: 'BK', name: 'black', hex: '#202326' },
  { code: 'BN', name: 'brown', hex: '#7a4a2a' },
  { code: 'RD', name: 'red', hex: '#d0312d' },
  { code: 'OG', name: 'orange', hex: '#ef7d14' },
  { code: 'YE', name: 'yellow', hex: '#f3c515' },
  { code: 'GN', name: 'green', hex: '#2e8b3e' },
  { code: 'BU', name: 'blue', hex: '#1f5fbf' },
  { code: 'VT', name: 'violet', hex: '#7b3fa0' },
  { code: 'GY', name: 'grey', hex: '#8c9196' },
  { code: 'WH', name: 'white', hex: '#f6f6f3' },
  { code: 'PK', name: 'pink', hex: '#ee7fb0' },
  { code: 'TQ', name: 'turquoise', hex: '#1fb3ae' },
];

export const GAUGES = [
  '0.13 mm²', '0.22 mm²', '0.35 mm²', '0.5 mm²', '0.75 mm²', '1 mm²', '1.5 mm²',
  '2.5 mm²', '4 mm²', '6 mm²', '10 mm²',
  '26 AWG', '24 AWG', '22 AWG', '20 AWG', '18 AWG', '16 AWG', '14 AWG', '12 AWG', '10 AWG',
];

// Hoses can also be clear. Wires cannot.
export const CLEAR = { code: 'CL', name: 'clear', hex: '#cfe3ea' };
export const TUBE_COLORS = ['BK', 'BU', 'RD', 'YE', 'GN', 'OG', 'GY', 'WH', 'CL'];

const COLOR_BY_CODE = new Map([...WIRE_COLORS, CLEAR].map((c) => [c.code, c]));

export function colorInfo(code) {
  return COLOR_BY_CODE.get(code) || null;
}

export function colorCode(color, stripe) {
  return stripe ? `${color}/${stripe}` : color || '';
}

export function colorName(color, stripe) {
  const base = colorInfo(color)?.name || color || '';
  const extra = stripe ? colorInfo(stripe)?.name || stripe : '';
  return extra ? `${base} with ${extra} stripe` : base;
}

// ---------- Small value helpers ----------

export function numberOr(value, fallback) {
  const n = typeof value === 'string' ? Number.parseFloat(value.replace(',', '.')) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

export function isPositive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function str(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

export function clampInt(value, min, max) {
  const n = Math.round(numberOr(value, min));
  return Math.min(max, Math.max(min, n));
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function byRef(a, b) {
  return collator.compare(a.ref || '', b.ref || '');
}

let idCounter = 0;
export function newId(prefix) {
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}${rand}`;
}

// ---------- Project structure ----------

export function createProject(name = 'Untitled harness') {
  const now = new Date().toISOString();
  return {
    format: FORMAT,
    version: FORMAT_VERSION,
    meta: { name, author: '', revision: 'A', created: now, modified: now },
    settings: { cutMargin: 20, currency: '€' },
    background: null,
    connectors: [],
    wires: [],
    images: {},
    schematics: [],
    files: {},
  };
}

// ---------- Schematics ----------
// A schematic is a file that you keep with the project, for example a PDF.
// project.schematics is the list that you see. project.files holds the file
// contents as Blobs. The undo history does not copy the files.

export function addSchematic(project, { name, type, size, blob }) {
  const fileId = newId('f');
  project.files[fileId] = { name, type: type || 'application/octet-stream', size: size ?? blob?.size ?? 0, blob };
  const item = { id: newId('s'), file: fileId, name: name.replace(/\.[^.]+$/, '') || name, note: '' };
  project.schematics.push(item);
  return item;
}

export function removeSchematic(project, id) {
  project.schematics = project.schematics.filter((s) => s.id !== id);
}

export function schematicFile(project, item) {
  return project.files?.[item?.file] || null;
}

// The path of a file in the ZIP package. A safe file name keeps the package easy to read.
export function zipPath(fileId, name) {
  const safe = String(name || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').slice(0, 120);
  return `schematics/${fileId}-${safe}`;
}

// Returns the next free reference, for example X4 after X1, X2 and X3.
export function nextRef(items, prefix) {
  const pattern = new RegExp(`^${prefix}(\\d+)$`, 'i');
  let max = 0;
  for (const item of items) {
    const match = pattern.exec(item.ref || '');
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${max + 1}`;
}

// A new connector has no pins. Add pins to its sides in Properties.
export function makeConnector(project, { x = 0, y = 0, shape = '' } = {}) {
  return {
    id: newId('c'),
    kind: 'connector',
    shape,
    ref: nextRef(project.connectors, SHAPE_PREFIX[shape] || 'X'),
    x,
    y,
    partNumber: '',
    manufacturer: '',
    description: '',
    price: 0,
    contactPartNumber: '',
    contactPrice: 0,
    image: '',
    photoRotation: 0,
    photoCrop: null,
    sides: { left: [], right: [], top: [], bottom: [] },
  };
}

// A mini vacuum pump (the small 12 V diaphragm pumps): power pins on the left,
// a vacuum barb and an exhaust barb on the right.
export function makePump(project, place) {
  const c = makeConnector(project, { ...place, shape: 'pump' });
  c.description = 'Mini vacuum pump, 12 V DC';
  c.sides.left.push({ id: newId('g'), name: 'Power', type: 'generic', pins: [
    { n: 1, label: '+12V', role: 'in' },
    { n: 2, label: 'GND', role: '' },
  ] });
  c.sides.right.push({ id: newId('g'), name: '', type: 'barb', pins: [
    { n: 3, label: 'Vacuum', role: '' },
    { n: 4, label: 'Exhaust', role: '' },
  ] });
  return c;
}

// A vacuum suction cup with a hose barb.
export function makeCup(project, place) {
  const c = makeConnector(project, { ...place, shape: 'cup' });
  c.description = 'Vacuum suction cup';
  c.sides.left.push({ id: newId('g'), name: '', type: 'barb', pins: [{ n: 1, label: 'Vacuum', role: '' }] });
  return c;
}

// ---------- Pins of a connector ----------
// Each pin has a number `n` that does not change when you add or remove other
// pins. Wires refer to pins by this number.

export function connectorPins(c) {
  if (!c) return [];
  if (isSplitter(c)) return c.pins.map((p, i) => ({ ...p, n: i + 1, side: '', group: null }));
  const out = [];
  for (const side of SIDES) {
    for (const group of c.sides[side.code]) {
      for (const pin of group.pins) out.push({ ...pin, side: side.code, group });
    }
  }
  return out;
}

export function findPin(c, n) {
  if (!c) return null;
  if (isSplitter(c)) return c.pins[n - 1] || null;
  for (const side of SIDES) {
    for (const group of c.sides[side.code]) {
      const pin = group.pins.find((p) => p.n === n);
      if (pin) return pin;
    }
  }
  return null;
}

export function pinCount(c) {
  return connectorPins(c).length;
}

function nextPinNumber(c) {
  return connectorPins(c).reduce((max, p) => Math.max(max, p.n), 0) + 1;
}

export function findGroup(c, groupId) {
  for (const side of SIDES) {
    const group = c?.sides?.[side.code]?.find((g) => g.id === groupId);
    if (group) return { group, side: side.code };
  }
  return null;
}

export function addGroup(c, side, type = 'generic') {
  const group = { id: newId('g'), name: '', type, pins: [] };
  c.sides[side].push(group);
  return group;
}

// Adds a pin to a group. Without a group, the pin goes into the last group of
// the side, or into a new group.
export function addPin(c, side, groupId = null) {
  const list = c.sides[side];
  const group = (groupId && list.find((g) => g.id === groupId)) || list[list.length - 1] || addGroup(c, side);
  const pin = { n: nextPinNumber(c), label: '', role: '' };
  group.pins.push(pin);
  return pin;
}

export function wiresOnPins(project, connectorId, numbers) {
  const set = new Set(numbers);
  return project.wires.filter(
    (w) => (w.from.connector === connectorId && set.has(w.from.pin)) || (w.to.connector === connectorId && set.has(w.to.pin)),
  );
}

function dropWires(project, connectorId, numbers) {
  const gone = new Set(wiresOnPins(project, connectorId, numbers).map((w) => w.id));
  project.wires = project.wires.filter((w) => !gone.has(w.id));
}

export function removePin(project, connectorId, n) {
  const c = findConnector(project, connectorId);
  if (!c || isSplitter(c)) return;
  for (const side of SIDES) {
    for (const group of c.sides[side.code]) group.pins = group.pins.filter((p) => p.n !== n);
  }
  dropWires(project, connectorId, [n]);
}

export function removeGroup(project, connectorId, groupId) {
  const c = findConnector(project, connectorId);
  const found = c && findGroup(c, groupId);
  if (!found) return;
  dropWires(
    project,
    connectorId,
    found.group.pins.map((p) => p.n),
  );
  c.sides[found.side] = c.sides[found.side].filter((g) => g.id !== groupId);
}

// Moves a group to a different side. The pins and the wires stay the same.
export function moveGroup(c, groupId, side) {
  const found = findGroup(c, groupId);
  if (!found || found.side === side) return;
  c.sides[found.side] = c.sides[found.side].filter((g) => g.id !== groupId);
  c.sides[side].push(found.group);
}

// ---------- Splitters ----------
// A splitter has one or more inputs. Each input connects inside to the same
// number of outputs, like a lever splitter.
// Pin numbers: first the inputs (1 to P), then the outputs of input 1,
// then the outputs of input 2, and so on.

export function splitterPinCount(poles, outputs) {
  return poles + poles * outputs;
}

export function splitterPin(c, pin) {
  const P = c.poles;
  const M = c.outputs;
  if (pin <= P) return { role: 'in', pole: pin - 1, index: 0 };
  const k = pin - P - 1;
  return { role: 'out', pole: Math.floor(k / M), index: k % M };
}

function splitterPinNumber(poles, outputs, info) {
  if (info.role === 'in') return info.pole < poles ? info.pole + 1 : null;
  if (info.pole >= poles || info.index >= outputs) return null;
  return poles + info.pole * outputs + info.index + 1;
}

export function makeSplitter(project, { x = 0, y = 0, poles = 2, outputs = 2, style = 'lever' } = {}) {
  const P = clampInt(poles, 1, MAX_POLES);
  const M = clampInt(outputs, 1, MAX_OUTPUTS);
  const manifold = style === 'manifold';
  return {
    id: newId('c'),
    kind: 'splitter',
    style: manifold ? 'manifold' : 'lever',
    ref: nextRef(project.connectors, manifold ? 'T' : 'S'),
    x,
    y,
    poles: P,
    outputs: M,
    partNumber: '',
    manufacturer: '',
    description: manifold
      ? M === 2 && P === 1
        ? 'Vacuum tee'
        : `Vacuum manifold, ${P} in, ${P * M} out`
      : `Lever splitter, ${P} in, ${P * M} out`,
    price: 0,
    contactPartNumber: '',
    contactPrice: 0,
    image: '',
    photoRotation: 0,
    photoCrop: null,
    pins: Array.from({ length: splitterPinCount(P, M) }, (_, i) => ({
      label: '',
      role: i < P ? 'in' : 'out',
    })),
  };
}

// Wires that lose their pin when the splitter size changes.
export function wiresRemovedBySplitterSize(project, id, poles, outputs) {
  const c = findConnector(project, id);
  if (!c) return [];
  const lost = (end) => end.connector === id && splitterPinNumber(poles, outputs, splitterPin(c, end.pin)) === null;
  return project.wires.filter((w) => lost(w.from) || lost(w.to));
}

// Changes the number of inputs and outputs. Wires stay on the same input or
// output. Wires on removed pins are deleted.
export function setSplitterSize(project, id, poles, outputs) {
  const c = findConnector(project, id);
  if (!c || !isSplitter(c)) return;
  const P = clampInt(poles, 1, MAX_POLES);
  const M = clampInt(outputs, 1, MAX_OUTPUTS);
  const map = new Map();
  for (let pin = 1; pin <= c.pins.length; pin += 1) {
    map.set(pin, splitterPinNumber(P, M, splitterPin(c, pin)));
  }
  const pins = Array.from({ length: splitterPinCount(P, M) }, (_, i) => ({ label: '', role: i < P ? 'in' : 'out' }));
  for (const [oldPin, newPin] of map) {
    if (newPin) pins[newPin - 1].label = c.pins[oldPin - 1]?.label || '';
  }
  project.wires = project.wires.filter((w) => {
    for (const end of [w.from, w.to]) {
      if (end.connector !== id) continue;
      const next = map.get(end.pin);
      if (!next) return false;
      end.pin = next;
    }
    return true;
  });
  c.poles = P;
  c.outputs = M;
  c.pins = pins;
}

export function pinRole(c, pin) {
  if (isSplitter(c)) return splitterPin(c, pin).role;
  return findPin(c, pin)?.role || '';
}

// A new wire copies color, gauge and price from the template (the last wire),
// so a series of similar wires is fast to draw.
export function makeWire(project, from, to, template = null) {
  return {
    id: newId('w'),
    kind: template?.kind && template.kind !== 'wire' ? template.kind : 'wire',
    ref: nextRef(project.wires, 'W'),
    from: { connector: from.connector, pin: from.pin },
    to: { connector: to.connector, pin: to.pin },
    color: template?.color || 'BK',
    stripe: template?.stripe || '',
    gauge: template?.gauge || '0.5 mm²',
    length: null,
    signal: '',
    partNumber: '',
    pricePerMeter: template ? numberOr(template.pricePerMeter, 0) : 0,
    usbA: template?.usbA || 'A',
    usbB: template?.usbB || 'C',
    flatUse: template?.flatUse || 'CSI',
    flatA: template?.flatA || '15',
    flatB: template?.flatB || '15',
    tubeInner: template ? numberOr(template.tubeInner, 4) : 4,
    tubeOuter: template ? numberOr(template.tubeOuter, 7) : 7,
    tubeMaterial: template?.tubeMaterial || 'silicone',
    barrelOuter: template ? numberOr(template.barrelOuter, 5.5) : 5.5,
    barrelInner: template ? numberOr(template.barrelInner, 2.1) : 2.1,
    price: template ? numberOr(template.price, 0) : 0,
  };
}

export function findConnector(project, id) {
  return project.connectors.find((c) => c.id === id) || null;
}

export function findWire(project, id) {
  return project.wires.find((w) => w.id === id) || null;
}

function touches(end, connectorId, pin) {
  return end.connector === connectorId && (pin === undefined || end.pin === pin);
}

export function wiresOnConnector(project, connectorId) {
  return project.wires.filter((w) => touches(w.from, connectorId) || touches(w.to, connectorId));
}

export function wiresOnPin(project, connectorId, pin) {
  return project.wires.filter((w) => touches(w.from, connectorId, pin) || touches(w.to, connectorId, pin));
}

export function usedPins(project, connectorId) {
  const used = new Set();
  for (const w of project.wires) {
    if (w.from.connector === connectorId) used.add(w.from.pin);
    if (w.to.connector === connectorId) used.add(w.to.pin);
  }
  return used;
}

export function removeConnector(project, connectorId) {
  project.connectors = project.connectors.filter((c) => c.id !== connectorId);
  project.wires = project.wires.filter(
    (w) => w.from.connector !== connectorId && w.to.connector !== connectorId,
  );
}

export function removeWire(project, wireId) {
  project.wires = project.wires.filter((w) => w.id !== wireId);
}

export function duplicateConnector(project, connectorId) {
  const source = findConnector(project, connectorId);
  if (!source) return null;
  const copy = {
    ...structuredClone(source),
    id: newId('c'),
    ref: nextRef(project.connectors, refPrefix(source)),
    x: source.x + 40,
    y: source.y + 40,
  };
  project.connectors.push(copy);
  return copy;
}

export function endLabel(project, end) {
  const connector = findConnector(project, end.connector);
  return connector ? `${connector.ref}:${end.pin}` : '?';
}

export function pinLabel(project, end) {
  return findPin(findConnector(project, end.connector), end.pin)?.label || '';
}

// ---------- Pictures ----------
// A picture is stored one time in project.images. Connectors and the background
// refer to it by its id. Pictures do not change, so a new picture gets a new id.

const IMAGE_DATA = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

export function addImage(project, picture) {
  const id = newId('i');
  project.images[id] = {
    name: str(picture.name),
    width: Math.round(picture.width),
    height: Math.round(picture.height),
    data: picture.data,
  };
  return id;
}

export function findImage(project, id) {
  return (id && project.images?.[id]) || null;
}

export function referencedImages(project) {
  const ids = new Set();
  for (const c of project.connectors) if (c.image) ids.add(c.image);
  if (project.background?.image) ids.add(project.background.image);
  return ids;
}

// A picture can be turned in steps of 90 degrees and cropped. The picture
// data does not change: OpenWire keeps the turn and the crop as settings.
// `rotation` is in degrees, -270 to 270 (positive turns to the right).
// `crop` is { x, y, w, h } as fractions of the original picture, or null.

export function normalRotation(rotation) {
  const r = Math.round(numberOr(rotation, 0) / 90) * 90;
  return ((r % 360) + 360) % 360;
}

export function turnRotation(rotation, step) {
  const r = Math.round((numberOr(rotation, 0) + step) / 90) * 90;
  return r % 360 === 0 ? 0 : r % 360;
}

export function cleanCrop(crop) {
  if (!crop || typeof crop !== 'object') return null;
  const x = Math.min(0.99, Math.max(0, numberOr(crop.x, 0)));
  const y = Math.min(0.99, Math.max(0, numberOr(crop.y, 0)));
  const w = Math.min(1 - x, Math.max(0.01, numberOr(crop.w, 1)));
  const h = Math.min(1 - y, Math.max(0.01, numberOr(crop.h, 1)));
  if (x < 0.001 && y < 0.001 && w > 0.999 && h > 0.999) return null;
  return { x: round4(x), y: round4(y), w: round4(w), h: round4(h) };
}

function round4(v) {
  return Math.round(v * 10000) / 10000;
}

// The visible part of a picture, in pixels of the original picture,
// and its size after the turn.
export function pictureView(img, rotation = 0, crop = null) {
  const c = crop || { x: 0, y: 0, w: 1, h: 1 };
  const cx = c.x * img.width;
  const cy = c.y * img.height;
  const cw = c.w * img.width;
  const ch = c.h * img.height;
  const r = normalRotation(rotation);
  const turned = r === 90 || r === 270;
  return { cx, cy, cw, ch, r, width: turned ? ch : cw, height: turned ? cw : ch };
}

// Size of the background picture in drawing units.
export function backgroundRect(project) {
  const bg = project.background;
  const img = findImage(project, bg?.image);
  if (!bg || !img) return null;
  const view = pictureView(img, bg.rotation, bg.crop);
  return { x: bg.x, y: bg.y, width: view.width * bg.scale, height: view.height * bg.scale };
}

// ---------- Calculations ----------

// A wire gets the extra length for stripping and crimping. A hose does not.
export function cutLength(project, wire) {
  if (!isCutItem(wire) || !isPositive(wire.length)) return null;
  if (isTube(wire)) return wire.length;
  return wire.length + Math.max(0, numberOr(project.settings.cutMargin, 0));
}

export function cutList(project) {
  return project.wires.filter(isCutItem).sort(byRef).map((w) => ({
    id: w.id,
    ref: w.ref,
    from: endLabel(project, w.from),
    to: endLabel(project, w.to),
    signal: w.signal,
    color: isTube(w) ? w.color : colorCode(w.color, w.stripe),
    gauge: isTube(w) ? `Hose ${tubeSizeText(w)}` : w.gauge,
    length: isPositive(w.length) ? w.length : null,
    cutLength: cutLength(project, w),
  }));
}

// Wires that you cut from a reel. USB cables are bought as complete cables.
export function cutWires(project) {
  return project.wires.filter(isCutWire);
}

export function cutTubes(project) {
  return project.wires.filter(isTube);
}

// Cables that you buy complete: USB, DC and flat cables.
export function boughtCables(project) {
  return project.wires.filter((w) => !isCutItem(w));
}

// Short text for the label of a wire in the drawing: the gauge, or the cable type.
export function wireKindText(w) {
  if (isUsb(w)) {
    const barrels = [w.usbA, w.usbB].filter((c) => c === 'BARREL').length;
    return barrels === 2 ? 'DC' : barrels ? 'USB/DC' : 'USB';
  }
  if (isFlat(w)) return w.flatUse || 'CSI';
  if (isTube(w)) return `VAC Ø${mmText(w.tubeInner)}`;
  return w.gauge || '';
}

export function flatEndName(code) {
  return FLAT_ENDS.find((e) => e.code === code)?.name || code;
}

export function totalWireLength(project) {
  return cutWires(project).reduce((sum, w) => sum + (cutLength(project, w) || 0), 0);
}

export function totalTubeLength(project) {
  return cutTubes(project).reduce((sum, w) => sum + (cutLength(project, w) || 0), 0);
}

// Groups parts by part number. Parts with no part number get one line each.
export function billOfMaterials(project) {
  const groups = new Map();
  const add = (key, base, quantity, price, ref) => {
    let group = groups.get(key);
    if (!group) {
      group = { ...base, quantity: 0, unitPrice: price, cost: 0, refs: [] };
      groups.set(key, group);
    }
    group.quantity += quantity;
    group.cost += quantity * price;
    if (ref && !group.refs.includes(ref)) group.refs.push(ref);
  };

  const connectors = [...project.connectors].sort(byRef);
  for (const c of connectors) {
    const pn = c.partNumber.trim();
    const type = isManifold(c) ? 'Fitting' : isSplitter(c) ? 'Splitter' : SHAPE_TYPE[c.shape] || 'Connector';
    add(
      pn ? `${type}:${pn}` : `${type}:#${c.id}`,
      { type, partNumber: pn, manufacturer: c.manufacturer, description: c.description, unit: 'pcs' },
      1,
      numberOr(c.price, 0),
      c.ref,
    );
  }

  for (const c of connectors) {
    if (isSplitter(c)) continue;
    const pn = c.contactPartNumber.trim();
    const count = usedPins(project, c.id).size;
    if (!pn || !count) continue;
    add(
      `contact:${pn}`,
      { type: 'Contact', partNumber: pn, manufacturer: c.manufacturer, description: 'Crimp contact', unit: 'pcs' },
      count,
      numberOr(c.contactPrice, 0),
      c.ref,
    );
  }

  for (const w of cutWires(project).sort(byRef)) {
    const pn = w.partNumber.trim();
    const meters = (cutLength(project, w) || 0) / 1000;
    add(
      pn ? `wire:${pn}` : `wire:${w.gauge}|${w.color}|${w.stripe}`,
      {
        type: 'Wire',
        partNumber: pn,
        manufacturer: '',
        description: `${w.gauge || 'Wire'}, ${colorName(w.color, w.stripe)}`,
        unit: 'm',
      },
      meters,
      numberOr(w.pricePerMeter, 0),
      w.ref,
    );
  }

  for (const w of cutTubes(project).sort(byRef)) {
    const pn = w.partNumber.trim();
    const meters = (cutLength(project, w) || 0) / 1000;
    const material = tubeMaterialName(w.tubeMaterial);
    add(
      pn ? `hose:${pn}` : `hose:${w.tubeMaterial}|${w.tubeInner}|${w.tubeOuter}|${w.color}`,
      {
        type: 'Hose',
        partNumber: pn,
        manufacturer: '',
        description: `Vacuum hose, ${material}, ${tubeSizeText(w)}, ${colorName(w.color, '')}`,
        unit: 'm',
      },
      meters,
      numberOr(w.pricePerMeter, 0),
      w.ref,
    );
  }

  for (const w of boughtCables(project).sort(byRef)) {
    const pn = w.partNumber.trim();
    const length = isPositive(w.length) ? `, ${w.length} mm` : '';
    const description = isFlat(w)
      ? `${w.flatUse} flat cable, ${w.flatA}-pin to ${w.flatB}-pin${length}`
      : `${hasBarrel(w) ? 'Cable' : 'USB cable'}, ${plugName(w, w.usbA)} to ${plugName(w, w.usbB)}${length}`;
    add(
      pn ? `cable:${pn}` : `cable:${description}`,
      { type: 'Cable', partNumber: pn, manufacturer: '', description, unit: 'pcs' },
      1,
      numberOr(w.price, 0),
      w.ref,
    );
  }

  const lines = [...groups.values()];
  const total = lines.reduce((sum, line) => sum + line.cost, 0);
  return { lines, total };
}

const LEVEL_ORDER = { error: 0, warning: 1, info: 2 };

export function runChecks(project) {
  const issues = [];
  const add = (level, message, target) => issues.push({ level, message, target });

  const duplicates = (items, noun, type) => {
    const seen = new Map();
    for (const item of items) {
      const key = (item.ref || '').trim().toUpperCase();
      if (!key) {
        add('warning', `A ${noun} has no name.`, { type, id: item.id });
        continue;
      }
      if (seen.has(key)) {
        add('warning', `More than one ${noun} has the name ${item.ref}.`, { type, id: item.id });
      } else {
        seen.set(key, item.id);
      }
    }
  };
  duplicates(project.connectors, 'connector', 'connector');
  duplicates(project.wires, 'wire', 'wire');

  for (const c of [...project.connectors].sort(byRef)) {
    const target = { type: 'connector', id: c.id };
    if (!c.partNumber.trim()) add('warning', `${c.ref} has no part number.`, target);
    const used = usedPins(project, c.id);
    if (!used.size) {
      add('warning', `${c.ref} has no wires.`, target);
      continue;
    }
    if (isSplitter(c)) {
      for (let p = 1; p <= c.poles; p += 1) {
        if (!used.has(p)) continue;
        const outs = Array.from({ length: c.outputs }, (_, k) => c.poles + (p - 1) * c.outputs + k + 1);
        if (!outs.some((n) => used.has(n))) add('warning', `Input ${p} of ${c.ref} has no output wires.`, target);
      }
      continue;
    }
    const unused = connectorPins(c)
      .map((p) => p.n)
      .filter((n) => !used.has(n));
    if (unused.length) {
      const list = unused.length > 8 ? `${unused.slice(0, 8).join(', ')} and more` : unused.join(', ');
      const noun = unused.length === 1 ? 'pin' : 'pins';
      add('info', `${c.ref} has ${unused.length} unused ${noun}: ${list}.`, target);
    }
    if (!c.contactPartNumber.trim()) add('info', `${c.ref} has no contact part number.`, target);
  }

  for (const w of [...project.wires].sort(byRef)) {
    const target = { type: 'wire', id: w.id };
    if (isTube(w)) {
      if (!isPositive(w.length)) add('error', `Vacuum line ${w.ref} has no length.`, target);
      if (!(w.tubeInner > 0)) add('warning', `Vacuum line ${w.ref} has no inner diameter.`, target);
      if (w.tubeOuter > 0 && w.tubeInner >= w.tubeOuter) {
        add('warning', `The inner diameter of ${w.ref} is not smaller than its outer diameter.`, target);
      }
    } else if (!isCutWire(w)) {
      if (!isPositive(w.length)) add('info', `Cable ${w.ref} has no length.`, target);
    } else {
      if (!isPositive(w.length)) add('error', `${w.ref} has no length.`, target);
      if (!String(w.gauge || '').trim()) add('warning', `${w.ref} has no gauge.`, target);
    }
    const roleA = pinRole(findConnector(project, w.from.connector), w.from.pin);
    const roleB = pinRole(findConnector(project, w.to.connector), w.to.pin);
    if (roleA && roleA === roleB) {
      add('warning', `${w.ref} connects two ${roleA === 'in' ? 'inputs' : 'outputs'}.`, target);
    }
    if (w.from.connector === w.to.connector && w.from.pin === w.to.pin) {
      add('warning', `${w.ref} connects a pin to the same pin.`, target);
    }
  }

  return issues.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

// ---------- Files ----------

// The pictures go last, so the text of the project stays easy to compare in Git.
// Pictures that nothing uses are not saved.
// `fileData` (optional) maps a file id to a data URL. It is for a JSON file
// that holds everything. A ZIP package stores the files next to project.json.
export function serializeProject(project, { fileData = null } = {}) {
  const images = {};
  for (const id of referencedImages(project)) {
    if (project.images?.[id]) images[id] = project.images[id];
  }
  const files = {};
  for (const s of project.schematics || []) {
    const f = project.files?.[s.file];
    if (!f || files[s.file]) continue;
    files[s.file] = { name: f.name, type: f.type, size: f.size, path: zipPath(s.file, f.name) };
    if (fileData?.[s.file]) files[s.file].data = fileData[s.file];
  }
  const { format, version, meta, settings, background, connectors, wires } = project;
  const schematics = project.schematics || [];
  return JSON.stringify(
    { format, version, meta, settings, background: background || null, connectors, wires, schematics, files, images },
    null,
    2,
  );
}

// Blob from a data URL, for files inside a JSON project.
function blobFromDataUrl(data) {
  const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(data || '');
  if (!match) return null;
  try {
    const text = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i);
    return new Blob([bytes], { type: match[1] || 'application/octet-stream' });
  } catch {
    return null;
  }
}

// Checks a loaded object and returns a clean project.
// Unknown fields are removed. Wires to missing pins are removed.
export function normalizeProject(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('The file does not contain an OpenWire project.');
  }
  if (raw.format !== FORMAT) {
    throw new Error('The file is not an OpenWire project.');
  }
  if (typeof raw.version === 'number' && raw.version > FORMAT_VERSION) {
    throw new Error(
      `The file uses format version ${raw.version}. This version of OpenWire can open version ${FORMAT_VERSION}.`,
    );
  }

  const project = createProject();
  const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
  project.meta = {
    name: str(meta.name, project.meta.name),
    author: str(meta.author),
    revision: str(meta.revision, 'A'),
    created: str(meta.created, project.meta.created),
    modified: str(meta.modified, project.meta.modified),
  };
  const settings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  project.settings = {
    cutMargin: Math.max(0, numberOr(settings.cutMargin, 20)),
    currency: str(settings.currency, '€'),
  };

  // Schematic files. The contents come from the ZIP package, from data URLs in
  // a JSON file, or from the draft in this browser. A file with no contents
  // stays in the list, so that you can see that it is missing.
  const rawFiles = raw.files && typeof raw.files === 'object' ? raw.files : {};
  for (const [id, f] of Object.entries(rawFiles)) {
    if (!f || typeof f !== 'object') continue;
    const blob = typeof f.data === 'string' ? blobFromDataUrl(f.data) : null;
    project.files[id] = {
      name: str(f.name, 'file'),
      type: str(f.type, 'application/octet-stream'),
      size: Math.max(0, numberOr(f.size, blob?.size ?? 0)),
      path: str(f.path) || zipPath(id, f.name),
      blob,
    };
  }
  for (const s of arr(raw.schematics)) {
    if (!s || typeof s !== 'object' || !project.files[s.file]) continue;
    project.schematics.push({ id: str(s.id) || newId('s'), file: s.file, name: str(s.name, 'Schematic'), note: str(s.note) });
  }

  const rawImages = raw.images && typeof raw.images === 'object' ? raw.images : {};
  for (const [id, img] of Object.entries(rawImages)) {
    if (!img || typeof img !== 'object') continue;
    const width = numberOr(img.width, 0);
    const height = numberOr(img.height, 0);
    if (typeof img.data !== 'string' || !IMAGE_DATA.test(img.data) || !(width > 0) || !(height > 0)) continue;
    project.images[id] = { name: str(img.name), width, height, data: img.data };
  }
  const imageOrEmpty = (id) => (typeof id === 'string' && project.images[id] ? id : '');

  const bg = raw.background && typeof raw.background === 'object' ? raw.background : null;
  if (bg && imageOrEmpty(bg.image)) {
    project.background = {
      image: bg.image,
      rotation: turnRotation(bg.rotation, 0),
      crop: cleanCrop(bg.crop),
      x: numberOr(bg.x, 0),
      y: numberOr(bg.y, 0),
      scale: Math.min(20, Math.max(0.01, numberOr(bg.scale, 1))),
      opacity: Math.min(1, Math.max(0.05, numberOr(bg.opacity, 0.5))),
      movable: bg.movable === true,
    };
  }

  const connectorIds = new Map();
  for (const c of arr(raw.connectors)) {
    if (!c || typeof c !== 'object') continue;
    let id = str(c.id);
    if (!id || connectorIds.has(id)) id = newId('c');
    const splitter = c.kind === 'splitter';
    const roleOf = (p) => (PIN_ROLES.some((r) => r.code === p?.role) ? p.role : '');
    let extra;
    if (splitter) {
      const P = clampInt(c.poles, 1, MAX_POLES);
      const M = clampInt(c.outputs, 1, MAX_OUTPUTS);
      const pins = Array.from({ length: splitterPinCount(P, M) }, (_, i) => ({
        label: str(arr(c.pins)[i]?.label),
        role: i < P ? 'in' : 'out',
      }));
      extra = { poles: P, outputs: M, pins, style: c.style === 'manifold' ? 'manifold' : 'lever' };
    } else if (c.sides && typeof c.sides === 'object') {
      const used = new Set();
      let count = 0;
      const sides = { left: [], right: [], top: [], bottom: [] };
      for (const side of SIDES) {
        for (const g of arr(c.sides[side.code])) {
          if (!g || typeof g !== 'object') continue;
          const pins = [];
          for (const p of arr(g.pins)) {
            if (count >= MAX_PINS) break;
            let n = Math.round(numberOr(p?.n, 0));
            if (!(n > 0) || used.has(n)) n = 0;
            if (n) used.add(n);
            pins.push({ n, label: str(p?.label), role: roleOf(p) });
            count += 1;
          }
          const type = CONNECTOR_TYPES.some((t) => t.code === g.type) ? g.type : 'generic';
          sides[side.code].push({ id: str(g.id) || newId('g'), name: str(g.name), type, pins });
        }
      }
      // Pins without a correct number get the next free number.
      let next = Math.max(0, ...used) + 1;
      for (const side of SIDES) {
        for (const g of sides[side.code]) {
          for (const p of g.pins) {
            if (!p.n) {
              p.n = next;
              next += 1;
            }
          }
        }
      }
      extra = { sides };
    } else {
      // A file from an older OpenWire: one list of pins. They become one group.
      // The side is set after the wires are read.
      const pins = arr(c.pins)
        .slice(0, MAX_PINS)
        .map((p, i) => ({ n: i + 1, label: str(p?.label), role: roleOf(p) }));
      extra = { sides: { left: [], right: [], top: [], bottom: [] }, legacyPins: pins };
    }
    const connector = {
      id,
      kind: splitter ? 'splitter' : 'connector',
      ref: str(c.ref, splitter ? 'S?' : 'X?'),
      x: numberOr(c.x, 0),
      y: numberOr(c.y, 0),
      partNumber: str(c.partNumber),
      manufacturer: str(c.manufacturer),
      description: str(c.description),
      price: numberOr(c.price, 0),
      contactPartNumber: str(c.contactPartNumber),
      contactPrice: numberOr(c.contactPrice, 0),
      image: imageOrEmpty(c.image),
      photoRotation: turnRotation(c.photoRotation, 0),
      photoCrop: cleanCrop(c.photoCrop),
      shape: SHAPES.some((sh) => sh.code === c.shape) ? c.shape : '',
      ...extra,
    };
    connectorIds.set(id, connector);
    project.connectors.push(connector);
  }

  const hasPin = (c, n) =>
    c.legacyPins ? n >= 1 && n <= c.legacyPins.length : Boolean(findPin(c, n));
  const validEnd = (end) => {
    if (!end || typeof end !== 'object') return null;
    const connector = connectorIds.get(end.connector);
    const pin = Math.round(numberOr(end.pin, 0));
    if (!connector || !hasPin(connector, pin)) return null;
    return { connector: connector.id, pin };
  };

  const wireIds = new Set();
  for (const w of arr(raw.wires)) {
    if (!w || typeof w !== 'object') continue;
    const from = validEnd(w.from);
    const to = validEnd(w.to);
    if (!from || !to) continue;
    let id = str(w.id);
    if (!id || wireIds.has(id)) id = newId('w');
    wireIds.add(id);
    const length = numberOr(w.length, null);
    project.wires.push({
      id,
      kind: WIRE_KINDS.some((k) => k.code === w.kind) ? w.kind : 'wire',
      ref: str(w.ref, 'W?'),
      from,
      to,
      color: str(w.color, 'BK'),
      stripe: str(w.stripe),
      gauge: str(w.gauge),
      length: isPositive(length) ? length : null,
      signal: str(w.signal),
      partNumber: str(w.partNumber),
      pricePerMeter: numberOr(w.pricePerMeter, 0),
      usbA: USB_TYPES.some((t) => t.code === w.usbA) ? w.usbA : 'A',
      usbB: USB_TYPES.some((t) => t.code === w.usbB) ? w.usbB : 'C',
      flatUse: FLAT_USES.some((t) => t.code === w.flatUse) ? w.flatUse : 'CSI',
      flatA: FLAT_ENDS.some((t) => t.code === w.flatA) ? w.flatA : '15',
      flatB: FLAT_ENDS.some((t) => t.code === w.flatB) ? w.flatB : '15',
      tubeInner: Math.min(100, Math.max(0, numberOr(w.tubeInner, 4))),
      tubeOuter: Math.min(120, Math.max(0, numberOr(w.tubeOuter, 7))),
      tubeMaterial: TUBE_MATERIALS.some((m) => m.code === w.tubeMaterial) ? w.tubeMaterial : 'silicone',
      barrelOuter: Math.min(30, Math.max(0.5, numberOr(w.barrelOuter, 5.5))),
      barrelInner: Math.min(20, Math.max(0.1, numberOr(w.barrelInner, 2.1))),
      price: numberOr(w.price, 0),
    });
  }

  // Old connectors: put the pins on the side where most of their wires go.
  for (const c of project.connectors) {
    if (!c.legacyPins) continue;
    let right = 0;
    let left = 0;
    for (const w of project.wires) {
      for (const [mine, other] of [
        [w.from, w.to],
        [w.to, w.from],
      ]) {
        if (mine.connector !== c.id) continue;
        const o = connectorIds.get(other.connector);
        if (o && o !== c && o.x < c.x) left += 1;
        else right += 1;
      }
    }
    if (c.legacyPins.length) {
      c.sides[left > right ? 'left' : 'right'].push({ id: newId('g'), name: '', type: 'generic', pins: c.legacyPins });
    }
    delete c.legacyPins;
  }

  return project;
}
