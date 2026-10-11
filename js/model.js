// OpenWire data model.
// This module has no DOM access, so the calculations are easy to test.

export const FORMAT = 'openwire';
export const FORMAT_VERSION = 1;
export const MAX_PINS = 200;

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

const COLOR_BY_CODE = new Map(WIRE_COLORS.map((c) => [c.code, c]));

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
    connectors: [],
    wires: [],
  };
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

export function makeConnector(project, { x = 0, y = 0, pinCount = 4 } = {}) {
  return {
    id: newId('c'),
    ref: nextRef(project.connectors, 'X'),
    x,
    y,
    partNumber: '',
    manufacturer: '',
    description: '',
    price: 0,
    contactPartNumber: '',
    contactPrice: 0,
    pins: Array.from({ length: clampInt(pinCount, 1, MAX_PINS) }, () => ({ label: '' })),
  };
}

// A new wire copies color, gauge and price from the template (the last wire),
// so a series of similar wires is fast to draw.
export function makeWire(project, from, to, template = null) {
  return {
    id: newId('w'),
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
    ref: nextRef(project.connectors, 'X'),
    x: source.x + 40,
    y: source.y + 40,
  };
  project.connectors.push(copy);
  return copy;
}

export function wiresRemovedByPinCount(project, connectorId, count) {
  return project.wires.filter(
    (w) =>
      (w.from.connector === connectorId && w.from.pin > count) ||
      (w.to.connector === connectorId && w.to.pin > count),
  );
}

// Changes the number of pins. Wires on removed pins are deleted.
// Returns the number of deleted wires.
export function setPinCount(project, connectorId, count) {
  const connector = findConnector(project, connectorId);
  if (!connector) return 0;
  const n = clampInt(count, 1, MAX_PINS);
  const removed = new Set(wiresRemovedByPinCount(project, connectorId, n).map((w) => w.id));
  project.wires = project.wires.filter((w) => !removed.has(w.id));
  while (connector.pins.length < n) connector.pins.push({ label: '' });
  connector.pins.length = n;
  return removed.size;
}

export function endLabel(project, end) {
  const connector = findConnector(project, end.connector);
  return connector ? `${connector.ref}:${end.pin}` : '?';
}

export function pinLabel(project, end) {
  const connector = findConnector(project, end.connector);
  return connector?.pins[end.pin - 1]?.label || '';
}

// ---------- Calculations ----------

export function cutLength(project, wire) {
  if (!isPositive(wire.length)) return null;
  return wire.length + Math.max(0, numberOr(project.settings.cutMargin, 0));
}

export function cutList(project) {
  return [...project.wires].sort(byRef).map((w) => ({
    id: w.id,
    ref: w.ref,
    from: endLabel(project, w.from),
    to: endLabel(project, w.to),
    signal: w.signal,
    color: colorCode(w.color, w.stripe),
    gauge: w.gauge,
    length: isPositive(w.length) ? w.length : null,
    cutLength: cutLength(project, w),
  }));
}

export function totalWireLength(project) {
  return project.wires.reduce((sum, w) => sum + (cutLength(project, w) || 0), 0);
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
    add(
      pn ? `connector:${pn}` : `connector:#${c.id}`,
      { type: 'Connector', partNumber: pn, manufacturer: c.manufacturer, description: c.description, unit: 'pcs' },
      1,
      numberOr(c.price, 0),
      c.ref,
    );
  }

  for (const c of connectors) {
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

  for (const w of [...project.wires].sort(byRef)) {
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
    const unused = c.pins.map((_, i) => i + 1).filter((n) => !used.has(n));
    if (unused.length) {
      const list = unused.length > 8 ? `${unused.slice(0, 8).join(', ')} and more` : unused.join(', ');
      const noun = unused.length === 1 ? 'pin' : 'pins';
      add('info', `${c.ref} has ${unused.length} unused ${noun}: ${list}.`, target);
    }
    if (!c.contactPartNumber.trim()) add('info', `${c.ref} has no contact part number.`, target);
  }

  for (const w of [...project.wires].sort(byRef)) {
    const target = { type: 'wire', id: w.id };
    if (!isPositive(w.length)) add('error', `${w.ref} has no length.`, target);
    if (!String(w.gauge || '').trim()) add('warning', `${w.ref} has no gauge.`, target);
    if (w.from.connector === w.to.connector && w.from.pin === w.to.pin) {
      add('warning', `${w.ref} connects a pin to the same pin.`, target);
    }
  }

  return issues.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

// ---------- Files ----------

export function serializeProject(project) {
  return JSON.stringify(project, null, 2);
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

  const connectorIds = new Map();
  for (const c of arr(raw.connectors)) {
    if (!c || typeof c !== 'object') continue;
    let id = str(c.id);
    if (!id || connectorIds.has(id)) id = newId('c');
    const pins = arr(c.pins)
      .slice(0, MAX_PINS)
      .map((p) => ({ label: str(p?.label) }));
    if (!pins.length) pins.push({ label: '' });
    const connector = {
      id,
      ref: str(c.ref, 'X?'),
      x: numberOr(c.x, 0),
      y: numberOr(c.y, 0),
      partNumber: str(c.partNumber),
      manufacturer: str(c.manufacturer),
      description: str(c.description),
      price: numberOr(c.price, 0),
      contactPartNumber: str(c.contactPartNumber),
      contactPrice: numberOr(c.contactPrice, 0),
      pins,
    };
    connectorIds.set(id, connector);
    project.connectors.push(connector);
  }

  const validEnd = (end) => {
    if (!end || typeof end !== 'object') return null;
    const connector = connectorIds.get(end.connector);
    const pin = Math.round(numberOr(end.pin, 0));
    if (!connector || pin < 1 || pin > connector.pins.length) return null;
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
    });
  }

  return project;
}
