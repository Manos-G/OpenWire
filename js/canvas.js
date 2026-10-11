// Drawing area. Renders the harness as SVG and handles mouse, pen and touch input.

import { colorInfo, findConnector, findWire, isPositive, makeWire, serializeProject } from './model.js';
import { escapeHtml as esc, formatLength } from './report.js';

export const BOX_W = 176;
export const HEAD_H = 30;
export const ROW_H = 22;
const NUM_W = 26;
const SNAP = 10;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const SVG_NS = 'http://www.w3.org/2000/svg';
export const DATA_NS = 'https://github.com/Manos-G/OpenWire';

const FONT = "'Barlow Semi Condensed', 'Bahnschrift', 'Roboto Condensed', 'Arial Narrow', sans-serif";

// Styles for the drawing. The exported SVG contains the same styles,
// so a drawing looks the same in other programs.
export const DIAGRAM_CSS = `
.ow text { font-family: ${FONT}; }
.ow-head { fill: #26323f; }
.ow-ref { fill: #ffffff; font-size: 14px; font-weight: 600; }
.ow-pn { fill: #b9c6d3; font-size: 11px; }
.ow-body { fill: #ffffff; stroke: #26323f; stroke-width: 1.25; }
.ow-numcol { fill: #eef2f5; }
.ow-row-bg { fill: #ffffff; fill-opacity: 0; }
.ow-row-line { stroke: #d8e0e7; stroke-width: 1; }
.ow-pin-num { fill: #52606d; font-size: 11px; text-anchor: middle; font-variant-numeric: tabular-nums; }
.ow-pin-label { fill: #1d2833; font-size: 12px; }
.ow-anchor { fill: #ffffff; stroke: #8795a3; stroke-width: 1.1; }
.ow-anchor.is-used { fill: #26323f; stroke: #26323f; }
.ow-wire-outline { fill: none; stroke: #1d2833; stroke-width: 5; stroke-linecap: round; }
.ow-wire-core { fill: none; stroke-width: 3; stroke-linecap: round; }
.ow-wire-stripe { fill: none; stroke-width: 1.5; stroke-dasharray: 6 6; }
.ow-label-bg { fill: #ffffff; stroke: #c3ccd5; stroke-width: 0.75; }
.ow-label { fill: #1d2833; font-size: 11px; font-variant-numeric: tabular-nums; }
.ow-label-ref { font-weight: 600; }
.ow-sel { fill: none; stroke: #f2c12e; stroke-opacity: 0.7; stroke-linecap: round; stroke-linejoin: round; }
.ow-title { fill: #52606d; font-size: 12px; }
`;

const round = (v) => Math.round(v * 10) / 10;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const snap = (v) => Math.round(v / SNAP) * SNAP;
const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export function connectorHeight(c) {
  return HEAD_H + c.pins.length * ROW_H;
}

function anchorPoint(c, pin, side) {
  return { x: side === 'right' ? c.x + BOX_W : c.x, y: c.y + HEAD_H + (pin - 0.5) * ROW_H };
}

// A wire leaves a connector on the side that faces the other end.
function sideToward(c, other) {
  if (!other || other === c) return 'right';
  return other.x + BOX_W / 2 >= c.x + BOX_W / 2 ? 'right' : 'left';
}

function bezierPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

function curve(a, sideA, b, sideB) {
  const dA = sideA === 'right' ? 1 : -1;
  const dB = sideB === 'right' ? 1 : -1;
  const reach =
    dA === dB
      ? Math.max(60, Math.abs(b.y - a.y) * 0.35 + 40)
      : clamp(Math.abs(b.x - a.x) * 0.5, 40, 220);
  const c1 = { x: a.x + dA * reach, y: a.y };
  const c2 = { x: b.x + dB * reach, y: b.y };
  return {
    d: `M ${round(a.x)} ${round(a.y)} C ${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(b.x)} ${round(b.y)}`,
    mid: bezierPoint(a, c1, c2, b, 0.5),
  };
}

function wireGeometry(project, wire) {
  const ca = findConnector(project, wire.from.connector);
  const cb = findConnector(project, wire.to.connector);
  if (!ca || !cb) return null;
  const sideA = sideToward(ca, cb);
  const sideB = sideToward(cb, ca);
  const a = anchorPoint(ca, wire.from.pin, sideA);
  const b = anchorPoint(cb, wire.to.pin, sideB);
  return { sideA, sideB, ...curve(a, sideA, b, sideB) };
}

export function createCanvas(wrap, store) {
  wrap.innerHTML = `
    <svg class="ow canvas-svg" role="application" aria-label="Harness drawing" aria-describedby="canvas-hint">
      <defs>
        <pattern id="owg-minor" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5ecf2"/>
        </pattern>
        <pattern id="owg-major" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cfd9e3"/>
        </pattern>
        <style>${DIAGRAM_CSS}</style>
      </defs>
      <rect class="grid grid-paper" width="100%" height="100%" fill="#ffffff"/>
      <rect class="grid grid-minor" width="100%" height="100%" fill="url(#owg-minor)"/>
      <rect class="grid grid-major" width="100%" height="100%" fill="url(#owg-major)"/>
      <g class="viewport">
        <g class="content">
          <g class="layer-wires"></g>
          <g class="layer-connectors"></g>
          <g class="layer-labels"></g>
        </g>
        <path class="ow-temp" d="" display="none"/>
      </g>
    </svg>
    <div class="canvas-empty" hidden>
      <p>The drawing is empty. Add a connector to start.</p>
      <div class="canvas-empty-actions">
        <button type="button" class="button primary" data-cmd="add-connector">Add connector</button>
        <button type="button" class="button" data-cmd="example">Open the example</button>
      </div>
    </div>
    <p class="canvas-hint" id="canvas-hint"></p>`;

  const svg = wrap.querySelector('svg');
  const viewport = svg.querySelector('.viewport');
  const content = svg.querySelector('.content');
  const layers = {
    wires: svg.querySelector('.layer-wires'),
    connectors: svg.querySelector('.layer-connectors'),
    labels: svg.querySelector('.layer-labels'),
  };
  const temp = svg.querySelector('.ow-temp');
  const minorPattern = svg.querySelector('#owg-minor');
  const majorPattern = svg.querySelector('#owg-major');
  const minorRect = svg.querySelector('.grid-minor');
  const emptyState = wrap.querySelector('.canvas-empty');
  const hint = wrap.querySelector('.canvas-hint');
  const coarse = window.matchMedia('(pointer: coarse)');

  const view = { x: 40, y: 40, k: 1 };
  const pointers = new Map();
  let gesture = null;
  let pending = null; // First pin of a wire in tap mode.

  // ---------- View ----------

  function applyView() {
    const t = `translate(${round(view.x)} ${round(view.y)}) scale(${view.k.toFixed(4)})`;
    viewport.setAttribute('transform', t);
    minorPattern.setAttribute('patternTransform', t);
    majorPattern.setAttribute('patternTransform', t);
    const line = (1 / view.k).toFixed(3);
    minorPattern.firstElementChild.setAttribute('stroke-width', line);
    majorPattern.firstElementChild.setAttribute('stroke-width', line);
    minorRect.setAttribute('opacity', clamp((view.k - 0.35) / 0.4, 0, 1).toFixed(2));
  }

  function size() {
    const r = svg.getBoundingClientRect();
    return { width: r.width, height: r.height, left: r.left, top: r.top };
  }

  function toWorld(clientX, clientY) {
    const r = size();
    return { x: (clientX - r.left - view.x) / view.k, y: (clientY - r.top - view.y) / view.k };
  }

  function zoomAt(factor, cx, cy) {
    const k = clamp(view.k * factor, MIN_ZOOM, MAX_ZOOM);
    const f = k / view.k;
    view.x = cx - (cx - view.x) * f;
    view.y = cy - (cy - view.y) * f;
    view.k = k;
    applyView();
  }

  function modelBounds() {
    const { connectors } = store.project;
    if (!connectors.length) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of connectors) {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + BOX_W);
      maxY = Math.max(maxY, c.y + connectorHeight(c));
    }
    return { x: minX - 60, y: minY - 30, width: maxX - minX + 120, height: maxY - minY + 60 };
  }

  function fit() {
    const r = size();
    if (!r.width || !r.height) return;
    const b = modelBounds();
    if (!b) {
      view.k = 1;
      view.x = 40;
      view.y = 40;
      applyView();
      return;
    }
    const pad = 24;
    const k = clamp(Math.min((r.width - pad * 2) / b.width, (r.height - pad * 2) / b.height), 0.3, 1.4);
    view.k = k;
    view.x = (r.width - b.width * k) / 2 - b.x * k;
    view.y = (r.height - b.height * k) / 2 - b.y * k;
    applyView();
  }

  function centerOn(x, y) {
    const r = size();
    view.x = r.width / 2 - x * view.k;
    view.y = r.height / 2 - y * view.k;
    applyView();
  }

  function focusItem(target) {
    const project = store.project;
    if (target?.type === 'connector') {
      const c = findConnector(project, target.id);
      if (c) centerOn(c.x + BOX_W / 2, c.y + connectorHeight(c) / 2);
    } else if (target?.type === 'wire') {
      const w = findWire(project, target.id);
      const g = w && wireGeometry(project, w);
      if (g) centerOn(g.mid.x, g.mid.y);
    }
  }

  // A free place near the middle of the view for a new connector.
  function placeForNewConnector(pinCount) {
    const r = size();
    const center = { x: (r.width / 2 - view.x) / view.k, y: (r.height / 2 - view.y) / view.k };
    const h = HEAD_H + pinCount * ROW_H;
    let x = snap(center.x - BOX_W / 2);
    let y = snap(center.y - h / 2);
    const overlaps = () =>
      store.project.connectors.some(
        (c) => x < c.x + BOX_W + 20 && x + BOX_W + 20 > c.x && y < c.y + connectorHeight(c) + 20 && y + h + 20 > c.y,
      );
    for (let i = 0; i < 40 && overlaps(); i += 1) {
      x += 30;
      y += 30;
    }
    return { x, y };
  }

  // ---------- Rendering ----------

  function renderConnector(c, sides, selected) {
    const id = esc(c.id);
    const h = connectorHeight(c);
    const rows = c.pins
      .map((p, i) => {
        const n = i + 1;
        const used = sides.get(`${c.id}:${n}`);
        const anchor = (side, x) => {
          if (used && !used.has(side)) return '';
          return `<circle class="ow-anchor${used ? ' is-used' : ''}" cx="${x}" cy="${ROW_H / 2}" r="${used ? 3.5 : 3}"/>`;
        };
        return `<g class="ow-pinrow" data-conn="${id}" data-pin="${n}" transform="translate(0 ${HEAD_H + i * ROW_H})">
          <rect class="ow-row-bg" x="0" y="0" width="${BOX_W}" height="${ROW_H}"/>
          ${i > 0 ? `<line class="ow-row-line" x1="0" y1="0" x2="${BOX_W}" y2="0"/>` : ''}
          <text class="ow-pin-num" x="${NUM_W / 2}" y="${ROW_H / 2}" dominant-baseline="central">${n}</text>
          <text class="ow-pin-label" x="${NUM_W + 8}" y="${ROW_H / 2}" dominant-baseline="central">${esc(truncate(p.label, 24))}</text>
          ${anchor('left', 0)}${anchor('right', BOX_W)}
          <rect class="ow-hit ow-pin-hit" x="-12" y="0" width="${BOX_W + 24}" height="${ROW_H}"/>
        </g>`;
      })
      .join('');
    return `<g class="ow-conn" data-conn-id="${id}" transform="translate(${round(c.x)} ${round(c.y)})">
      ${selected ? `<rect class="ow-sel" x="-6" y="-6" width="${BOX_W + 12}" height="${h + 12}" rx="6" stroke-width="10"/>` : ''}
      <rect class="ow-body" x="0" y="0" width="${BOX_W}" height="${h}" rx="3"/>
      <rect class="ow-numcol" x="0.7" y="${HEAD_H}" width="${NUM_W}" height="${h - HEAD_H - 0.7}"/>
      <g class="ow-head-g" data-conn-head="${id}">
        <path class="ow-head" d="M 0 3 A 3 3 0 0 1 3 0 H ${BOX_W - 3} A 3 3 0 0 1 ${BOX_W} 3 V ${HEAD_H} H 0 Z"/>
        <text class="ow-ref" x="10" y="${HEAD_H / 2}" dominant-baseline="central">${esc(truncate(c.ref, 12))}</text>
        <text class="ow-pn" x="${BOX_W - 10}" y="${HEAD_H / 2}" text-anchor="end" dominant-baseline="central">${esc(truncate(c.partNumber, 20))}</text>
      </g>
      ${rows}
    </g>`;
  }

  function renderWire(w, g, selected) {
    const core = colorInfo(w.color)?.hex || '#8c9196';
    const stripe = w.stripe ? colorInfo(w.stripe)?.hex : null;
    return `<g class="ow-wire" data-wire="${esc(w.id)}">
      ${selected ? `<path class="ow-sel" d="${g.d}" stroke-width="14"/>` : ''}
      <path class="ow-wire-outline" d="${g.d}"/>
      <path class="ow-wire-core" d="${g.d}" stroke="${core}"/>
      ${stripe ? `<path class="ow-wire-stripe" d="${g.d}" stroke="${stripe}"/>` : ''}
      <path class="ow-hit ow-wire-hit" d="${g.d}"/>
    </g>`;
  }

  function renderLabel(w, g) {
    const length = isPositive(w.length) ? `<tspan dx="5">${esc(formatLength(w.length))} mm</tspan>` : '';
    return `<g class="ow-wlabel" data-wire="${esc(w.id)}" transform="translate(${round(g.mid.x)} ${round(g.mid.y)})">
      <rect class="ow-label-bg" rx="3"/>
      <text class="ow-label" text-anchor="middle" dominant-baseline="central"><tspan class="ow-label-ref">${esc(w.ref)}</tspan>${length}</text>
    </g>`;
  }

  function sizeLabels() {
    for (const g of layers.labels.children) {
      const text = g.querySelector('text');
      const rect = g.querySelector('rect');
      let box = null;
      try {
        box = text.getBBox();
      } catch {
        box = null;
      }
      if (!box || !box.width) {
        const w = text.textContent.length * 5.6;
        box = { x: -w / 2, y: -7, width: w, height: 14 };
      }
      rect.setAttribute('x', round(box.x - 5));
      rect.setAttribute('y', round(box.y - 2));
      rect.setAttribute('width', round(box.width + 10));
      rect.setAttribute('height', round(box.height + 4));
    }
  }

  function updateHint() {
    const { connectors, wires } = store.project;
    const touch = coarse.matches;
    let text = '';
    if (pending) {
      text = touch
        ? 'Tap the pin at the other end of the wire. Tap the background to stop.'
        : 'Click the pin at the other end of the wire. Press Esc to stop.';
    } else if (connectors.length && !wires.length) {
      text = touch
        ? 'To add a wire, tap a pin and then tap a different pin.'
        : 'To add a wire, drag from a pin to a different pin.';
    }
    hint.textContent = text;
    hint.hidden = !text;
  }

  function render() {
    const project = store.project;
    const sel = store.selection;
    const sides = new Map();
    const addSide = (end, side) => {
      const key = `${end.connector}:${end.pin}`;
      if (!sides.has(key)) sides.set(key, new Set());
      sides.get(key).add(side);
    };
    const wires = [];
    const labels = [];
    let selectedWire = '';
    for (const w of project.wires) {
      const g = wireGeometry(project, w);
      if (!g) continue;
      addSide(w.from, g.sideA);
      addSide(w.to, g.sideB);
      const isSelected = sel?.type === 'wire' && sel.id === w.id;
      // The selected wire is drawn last, so it is on top.
      if (isSelected) selectedWire = renderWire(w, g, true);
      else wires.push(renderWire(w, g, false));
      labels.push(renderLabel(w, g));
    }
    if (selectedWire) wires.push(selectedWire);
    layers.wires.innerHTML = wires.join('');
    layers.connectors.innerHTML = project.connectors
      .map((c) => renderConnector(c, sides, sel?.type === 'connector' && sel.id === c.id))
      .join('');
    layers.labels.innerHTML = labels.join('');
    sizeLabels();
    emptyState.hidden = project.connectors.length > 0;
    if (pending) markRow(pending, 'is-source');
    updateHint();
  }

  // ---------- Wires ----------

  function rowElement(end) {
    return layers.connectors.querySelector(`[data-conn="${CSS.escape(end.connector)}"][data-pin="${end.pin}"]`);
  }

  function clearMarks(className) {
    for (const el of layers.connectors.querySelectorAll(`.${className}`)) el.classList.remove(className);
  }

  function markRow(end, className) {
    clearMarks(className);
    rowElement(end)?.classList.add(className);
  }

  function pinFromElement(el) {
    const row = el?.closest?.('[data-pin]');
    if (!row) return null;
    return { connector: row.dataset.conn, pin: Number(row.dataset.pin) };
  }

  function pinAt(clientX, clientY) {
    return pinFromElement(document.elementFromPoint(clientX, clientY));
  }

  const samePin = (a, b) => a && b && a.connector === b.connector && a.pin === b.pin;

  function drawTemp(source, point) {
    const c = findConnector(store.project, source.connector);
    if (!c) return;
    const side = point.x >= c.x + BOX_W / 2 ? 'right' : 'left';
    const a = anchorPoint(c, source.pin, side);
    const reach = clamp(Math.abs(point.x - a.x) * 0.5, 20, 160);
    const dx = side === 'right' ? reach : -reach;
    temp.setAttribute('d', `M ${round(a.x)} ${round(a.y)} C ${round(a.x + dx)} ${round(a.y)} ${round(point.x - dx / 2)} ${round(point.y)} ${round(point.x)} ${round(point.y)}`);
    temp.removeAttribute('display');
  }

  function clearTemp() {
    temp.setAttribute('display', 'none');
    temp.setAttribute('d', '');
    clearMarks('is-target');
    clearMarks('is-source');
  }

  function markTarget(clientX, clientY, source) {
    const target = pinAt(clientX, clientY);
    if (target && !samePin(target, source)) markRow(target, 'is-target');
    else clearMarks('is-target');
  }

  function cancelPending() {
    if (!pending) return false;
    pending = null;
    clearTemp();
    updateHint();
    return true;
  }

  function addWire(from, to) {
    const project = store.project;
    const template = project.wires[project.wires.length - 1] || null;
    let created = null;
    store.update(
      (p) => {
        created = makeWire(p, from, to, template);
        p.wires.push(created);
      },
      { source: 'canvas', structural: true },
    );
    if (created) store.select({ type: 'wire', id: created.id });
  }

  // ---------- Pointer input ----------

  function startPinch() {
    const [a, b] = [...pointers.values()];
    if (gesture?.type === 'drag') store.endCoalesce();
    if (pending) cancelPending();
    clearTemp();
    gesture = {
      type: 'pinch',
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      start: { ...view },
    };
  }

  function updatePinch() {
    const [a, b] = [...pointers.values()];
    const r = size();
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const s = gesture.start;
    const k = clamp((s.k * distance) / gesture.distance, MIN_ZOOM, MAX_ZOOM);
    const wx = (gesture.mid.x - r.left - s.x) / s.k;
    const wy = (gesture.mid.y - r.top - s.y) / s.k;
    view.k = k;
    view.x = mid.x - r.left - wx * k;
    view.y = mid.y - r.top - wy * k;
    applyView();
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      svg.setPointerCapture(e.pointerId);
    } catch {
      /* The pointer is already released. */
    }
    if (pointers.size === 2) {
      startPinch();
      return;
    }
    if (pointers.size > 2) return;

    const middle = e.pointerType === 'mouse' && e.button === 1;
    const pin = middle ? null : pinFromElement(e.target);
    const head = middle ? null : e.target.closest?.('[data-conn-head]');
    const wireEl = middle ? null : e.target.closest?.('[data-wire]');

    if (pending) {
      const source = pending;
      pending = null;
      clearTemp();
      if (pin && !samePin(pin, source)) {
        addWire(source, pin);
        gesture = { type: 'none' };
        updateHint();
        return;
      }
      updateHint();
      if (pin) {
        gesture = { type: 'none' };
        return;
      }
    }

    if (pin) {
      e.preventDefault();
      gesture = { type: 'wire', source: pin, startX: e.clientX, startY: e.clientY, moved: false };
      markRow(pin, 'is-source');
      drawTemp(pin, toWorld(e.clientX, e.clientY));
      return;
    }

    if (head) {
      const id = head.dataset.connHead;
      const c = findConnector(store.project, id);
      if (!c) return;
      const p = toWorld(e.clientX, e.clientY);
      gesture = {
        type: 'drag',
        id,
        token: `${id}:${e.timeStamp}:${Math.random()}`,
        offsetX: p.x - c.x,
        offsetY: p.y - c.y,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
      store.select({ type: 'connector', id });
      return;
    }

    if (wireEl) {
      store.select({ type: 'wire', id: wireEl.dataset.wire });
      gesture = { type: 'none' };
      return;
    }

    gesture = { type: 'pan', startX: e.clientX, startY: e.clientY, viewX: view.x, viewY: view.y, moved: false };
    svg.classList.add('is-panning');
  }

  function onPointerMove(e) {
    const down = pointers.has(e.pointerId);
    if (down) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (!down) {
      if (pending && e.pointerType !== 'touch') {
        drawTemp(pending, toWorld(e.clientX, e.clientY));
        markRow(pending, 'is-source');
        markTarget(e.clientX, e.clientY, pending);
      }
      return;
    }
    if (!gesture) return;

    switch (gesture.type) {
      case 'pinch':
        if (pointers.size >= 2) updatePinch();
        break;
      case 'pan': {
        const dx = e.clientX - gesture.startX;
        const dy = e.clientY - gesture.startY;
        if (Math.hypot(dx, dy) > 3) gesture.moved = true;
        view.x = gesture.viewX + dx;
        view.y = gesture.viewY + dy;
        applyView();
        break;
      }
      case 'drag': {
        if (!gesture.moved && Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) < 3) return;
        gesture.moved = true;
        const p = toWorld(e.clientX, e.clientY);
        const x = snap(p.x - gesture.offsetX);
        const y = snap(p.y - gesture.offsetY);
        const c = findConnector(store.project, gesture.id);
        if (c && (c.x !== x || c.y !== y)) {
          const { id, token } = gesture;
          store.update(
            (project) => {
              const target = findConnector(project, id);
              if (target) {
                target.x = x;
                target.y = y;
              }
            },
            { source: 'canvas', kind: 'move', coalesce: `move:${token}` },
          );
        }
        break;
      }
      case 'wire': {
        if (Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) > 6) gesture.moved = true;
        drawTemp(gesture.source, toWorld(e.clientX, e.clientY));
        markTarget(e.clientX, e.clientY, gesture.source);
        break;
      }
      default:
        break;
    }
  }

  function finishGesture(e, cancelled) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    try {
      svg.releasePointerCapture(e.pointerId);
    } catch {
      /* Capture is already released. */
    }
    svg.classList.remove('is-panning');

    if (gesture?.type === 'pinch') {
      if (pointers.size === 0) gesture = null;
      return;
    }
    const g = gesture;
    gesture = null;
    if (!g) return;

    if (g.type === 'pan' && !g.moved && !cancelled) store.select(null);
    if (g.type === 'drag') store.endCoalesce();
    if (g.type === 'wire') {
      const target = cancelled ? null : pinAt(e.clientX, e.clientY);
      if (target && !samePin(target, g.source)) {
        clearTemp();
        addWire(g.source, target);
      } else if (!g.moved && !cancelled) {
        // A tap or click on a pin: wait for the second pin.
        pending = g.source;
        clearMarks('is-target');
        markRow(pending, 'is-source');
        if (e.pointerType === 'touch') temp.setAttribute('display', 'none');
      } else {
        clearTemp();
      }
      updateHint();
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const r = size();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? r.height : 1;
    if (e.ctrlKey || e.metaKey) {
      zoomAt(Math.exp(-e.deltaY * unit * 0.002), e.clientX - r.left, e.clientY - r.top);
    } else {
      let dx = e.deltaX * unit;
      let dy = e.deltaY * unit;
      if (e.shiftKey && !dx) {
        dx = dy;
        dy = 0;
      }
      view.x -= dx;
      view.y -= dy;
      applyView();
    }
  }

  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', (e) => finishGesture(e, false));
  svg.addEventListener('pointercancel', (e) => finishGesture(e, true));
  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('contextmenu', (e) => e.preventDefault());

  store.subscribe((type) => {
    if (type === 'replace') {
      pending = null;
      clearTemp();
      render();
      fit();
    } else if (type === 'change' || type === 'select') {
      if (pending && !findConnector(store.project, pending.connector)) cancelPending();
      render();
    }
  });

  // Draw again when the web font is ready, so the label boxes fit the text.
  if (document.fonts?.ready) document.fonts.ready.then(() => render());

  // ---------- Export ----------

  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  // Returns the drawing as SVG text.
  // With `embedData`, the SVG contains the full project, so OpenWire can open it again.
  function exportSvg({ embedData = true, title = true, xmlDeclaration = true } = {}) {
    render();
    let box = null;
    try {
      box = content.getBBox();
    } catch {
      box = null;
    }
    if (!box || !box.width) box = modelBounds() || { x: 0, y: 0, width: 400, height: 200 };
    const pad = 30;
    const titleSpace = title ? 36 : 0;
    const x = Math.floor(box.x - pad);
    const y = Math.floor(box.y - pad);
    const width = Math.ceil(box.width + pad * 2);
    const height = Math.ceil(box.height + pad * 2 + titleSpace);

    const clone = content.cloneNode(true);
    for (const el of clone.querySelectorAll('.ow-hit, .ow-sel')) el.remove();
    for (const el of clone.querySelectorAll('.is-source, .is-target')) el.classList.remove('is-source', 'is-target');
    const markup = new XMLSerializer().serializeToString(clone);

    const project = store.project;
    const meta = embedData
      ? `<metadata><openwire xmlns="${DATA_NS}" encoding="base64">${toBase64(serializeProject(project))}</openwire></metadata>`
      : '';
    const heading = title
      ? `<text class="ow-title" x="${x + pad}" y="${y + height - 16}">${esc(project.meta.name)}, revision ${esc(project.meta.revision)}</text>`
      : '';
    const declaration = xmlDeclaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : '';
    return `${declaration}<svg xmlns="${SVG_NS}" class="ow" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}">${meta}<style>${DIAGRAM_CSS}</style><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#ffffff"/>${markup}${heading}</svg>`;
  }

  applyView();
  render();

  return {
    render,
    fit,
    focusItem,
    cancelPending,
    exportSvg,
    placeForNewConnector,
    zoomBy(factor) {
      const r = size();
      zoomAt(factor, r.width / 2, r.height / 2);
    },
    get isPending() {
      return Boolean(pending);
    },
  };
}
