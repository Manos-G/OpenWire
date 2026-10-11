// Drawing area. Renders the harness as SVG and handles mouse, pen and touch input.
// layout.js gives the size and pin positions. draw.js gives the SVG markup.

import { backgroundRect, findConnector, findImage, findWire, makeWire, serializeProject } from './model.js';
import { escapeHtml as esc } from './report.js';
import { pictureSvg } from './images.js';
import { BOX_W, HEAD_H, ROW_H, layoutComponent, pinAnchor } from './layout.js';
import { DIAGRAM_CSS, EXPORT_CSS, cablePath, connectorMarkup, labelMarkup, splitterMarkup, wireMarkup } from './draw.js';

export { DIAGRAM_CSS };

const SNAP = 10;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const SVG_NS = 'http://www.w3.org/2000/svg';
export const DATA_NS = 'https://github.com/Manos-G/OpenWire';

const round = (v) => Math.round(v * 10) / 10;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const snap = (v) => Math.round(v / SNAP) * SNAP;

// Ends and path of a wire. `layouts` is an optional cache of component layouts.
function wireGeometry(project, wire, layouts = null) {
  const ca = findConnector(project, wire.from.connector);
  const cb = findConnector(project, wire.to.connector);
  if (!ca || !cb) return null;
  const a = pinAnchor(ca, wire.from.pin, project, layouts?.get(ca.id));
  const b = pinAnchor(cb, wire.to.pin, project, layouts?.get(cb.id));
  if (!a || !b) return null;
  return { a, b, ...cablePath(a, b) };
}

export function createCanvas(wrap, store) {
  wrap.innerHTML = `
    <svg class="ow canvas-svg" role="application" aria-label="Harness drawing" aria-describedby="canvas-hint">
      <defs>
        <pattern id="owg-minor" width="10" height="10" patternUnits="userSpaceOnUse">
          <path class="grid-line-minor" d="M 10 0 L 0 0 0 10" fill="none"/>
        </pattern>
        <pattern id="owg-major" width="50" height="50" patternUnits="userSpaceOnUse">
          <path class="grid-line-major" d="M 50 0 L 0 0 0 50" fill="none"/>
        </pattern>
        <style>${DIAGRAM_CSS}</style>
      </defs>
      <rect class="grid grid-paper" width="100%" height="100%"/>
      <rect class="grid grid-minor" width="100%" height="100%" fill="url(#owg-minor)"/>
      <rect class="grid grid-major" width="100%" height="100%" fill="url(#owg-major)"/>
      <g class="viewport">
        <g class="content">
          <g class="layer-background"></g>
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
    background: svg.querySelector('.layer-background'),
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
    const project = store.project;
    const bg = backgroundRect(project);
    if (!project.connectors.length && !bg) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const add = (x, y, w, h) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    };
    for (const c of project.connectors) {
      const L = layoutComponent(c, project);
      add(c.x, c.y, L.width, L.height);
    }
    if (bg) add(bg.x, bg.y, bg.width, bg.height);
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
      const L = c && layoutComponent(c, project);
      if (c) centerOn(c.x + L.width / 2, c.y + L.height / 2);
    } else if (target?.type === 'wire') {
      const w = findWire(project, target.id);
      const g = w && wireGeometry(project, w);
      if (g) centerOn(g.mid.x, g.mid.y);
    }
  }

  // A free place near the middle of the view for a new connector.
  function placeForNewConnector(pinCount = 1) {
    const r = size();
    const center = { x: (r.width / 2 - view.x) / view.k, y: (r.height / 2 - view.y) / view.k };
    const h = HEAD_H + pinCount * ROW_H;
    let x = snap(center.x - BOX_W / 2);
    let y = snap(center.y - h / 2);
    const overlaps = () =>
      store.project.connectors.some(
        (c) => {
          const L = layoutComponent(c, store.project);
          return x < c.x + L.width + 20 && x + BOX_W + 20 > c.x && y < c.y + L.height + 20 && y + h + 20 > c.y;
        },
      );
    for (let i = 0; i < 40 && overlaps(); i += 1) {
      x += 30;
      y += 30;
    }
    return { x, y };
  }

  // The part of the drawing that you can see, in drawing units.
  function visibleRect() {
    const r = size();
    return { x: -view.x / view.k, y: -view.y / view.k, width: r.width / view.k, height: r.height / view.k };
  }

  // ---------- Rendering ----------

  let backgroundKey = '';

  function renderBackground() {
    const project = store.project;
    const bg = project.background;
    const rect = backgroundRect(project);
    const img = rect && findImage(project, bg.image);
    const key = img
      ? `${bg.image}|${rect.x}|${rect.y}|${rect.width}|${bg.opacity}|${bg.movable}|${bg.rotation}|${JSON.stringify(bg.crop)}`
      : '';
    if (key === backgroundKey) return;
    backgroundKey = key;
    if (!img) {
      layers.background.innerHTML = '';
      return;
    }
    const x = round(rect.x);
    const y = round(rect.y);
    const w = round(rect.width);
    const h = round(rect.height);
    const picture = pictureSvg(img, { id: bg.image, rotation: bg.rotation, crop: bg.crop, x, y, width: w, height: h, fit: 'none' });
    layers.background.innerHTML = `
      <g class="ow-bg${bg.movable ? ' is-movable' : ''}"${bg.movable ? ' data-bg="1"' : ''} opacity="${bg.opacity}">${picture}</g>
      ${bg.movable ? `<rect class="ow-bg-frame" x="${x}" y="${y}" width="${w}" height="${h}"/>` : ''}`;
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
    const layouts = new Map(project.connectors.map((c) => [c.id, layoutComponent(c, project)]));
    const used = new Set();
    const wires = [];
    const labels = [];
    let selectedWire = '';
    for (const w of project.wires) {
      const g = wireGeometry(project, w, layouts);
      if (!g) continue;
      used.add(`${w.from.connector}:${w.from.pin}`);
      used.add(`${w.to.connector}:${w.to.pin}`);
      const isSelected = sel?.type === 'wire' && sel.id === w.id;
      // The selected wire is drawn last, so it is on top.
      const markup = wireMarkup(w, g, { a: g.a, b: g.b }, isSelected);
      if (isSelected) selectedWire = markup;
      else wires.push(markup);
      labels.push(labelMarkup(w, g));
    }
    if (selectedWire) wires.push(selectedWire);
    renderBackground();
    layers.wires.innerHTML = wires.join('');
    layers.connectors.innerHTML = project.connectors
      .map((c) => {
        const options = { used, selected: sel?.type === 'connector' && sel.id === c.id };
        const L = layouts.get(c.id);
        return c.kind === 'splitter' ? splitterMarkup(c, L, options) : connectorMarkup(c, L, options);
      })
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
    const a = c && pinAnchor(c, source.pin, store.project);
    if (!a) return;
    const reach = clamp(Math.hypot(point.x - a.x, point.y - a.y) * 0.5, 20, 160);
    const c1 = { x: a.x + a.dir.x * reach, y: a.y + a.dir.y * reach };
    temp.setAttribute(
      'd',
      `M ${round(a.x)} ${round(a.y)} C ${round(c1.x)} ${round(c1.y)} ${round(point.x)} ${round(point.y)} ${round(point.x)} ${round(point.y)}`,
    );
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

    const bgEl = middle ? null : e.target.closest?.('[data-bg]');
    const bg = store.project.background;
    if (bgEl && bg) {
      const p = toWorld(e.clientX, e.clientY);
      gesture = {
        type: 'bg',
        token: `bg:${e.timeStamp}:${Math.random()}`,
        offsetX: p.x - bg.x,
        offsetY: p.y - bg.y,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
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
      case 'bg': {
        if (!gesture.moved && Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) < 3) return;
        gesture.moved = true;
        const p = toWorld(e.clientX, e.clientY);
        const x = snap(p.x - gesture.offsetX);
        const y = snap(p.y - gesture.offsetY);
        const bg = store.project.background;
        if (bg && (bg.x !== x || bg.y !== y)) {
          store.update(
            (project) => {
              if (project.background) {
                project.background.x = x;
                project.background.y = y;
              }
            },
            { source: 'canvas', kind: 'move', coalesce: gesture.token },
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
    if (g.type === 'drag' || g.type === 'bg') store.endCoalesce();
    if (g.type === 'bg' && !g.moved && !cancelled) store.select(null);
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
      backgroundKey = '';
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
    for (const el of clone.querySelectorAll('.ow-hit, .ow-sel, .ow-bg-frame')) el.remove();
    // Put the full picture data into the file, so the SVG works without OpenWire.
    for (const el of clone.querySelectorAll('image[data-image]')) {
      const img = findImage(store.project, el.getAttribute('data-image'));
      if (img) el.setAttribute('href', img.data);
      else el.remove();
      el.removeAttribute('data-image');
    }
    for (const el of clone.querySelectorAll('[data-bg]')) el.removeAttribute('data-bg');
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
    return `${declaration}<svg xmlns="${SVG_NS}" class="ow" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}">${meta}<style>${EXPORT_CSS}</style><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#ffffff"/>${markup}${heading}</svg>`;
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
    visibleRect,
    zoomBy(factor) {
      const r = size();
      zoomAt(factor, r.width / 2, r.height / 2);
    },
    get isPending() {
      return Boolean(pending);
    },
  };
}
