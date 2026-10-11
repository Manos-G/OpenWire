// Properties panel. It shows the harness when nothing is selected,
// or the selected connector, splitter, wire or USB cable.
//
// Typing changes the project at once. All changes to one field while it has
// focus make one undo step. The buttons use data-cmd, so app.js runs them.

import {
  GAUGES,
  MAX_OUTPUTS,
  MAX_PINS,
  MAX_POLES,
  PIN_ROLES,
  SPLITTER_COLORS,
  USB_TYPES,
  WIRE_COLORS,
  clampInt,
  colorInfo,
  cutLength,
  endLabel,
  findConnector,
  findImage,
  findWire,
  isPositive,
  isSplitter,
  isUsb,
  numberOr,
  pictureView,
  pinLabel,
  setPinCount,
  setSplitterSize,
  totalWireLength,
  wiresOnConnector,
  wiresOnPin,
  wiresRemovedByPinCount,
  wiresRemovedBySplitterSize,
} from './model.js';
import { escapeHtml as esc, formatLength, formatMeters } from './report.js';
import { formatBytes, pictureBytes, pictureElement } from './images.js';

let uid = 0;
const nextId = () => {
  uid += 1;
  return `prop-${uid}`;
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// ---------- Field markup ----------

function textField({ field, label, value, placeholder = '', maxlength = 120, list = '' }) {
  const id = nextId();
  return `<div class="field">
    <label for="${id}">${esc(label)}</label>
    <input class="input" id="${id}" type="text" data-field="${field}" value="${esc(value)}"
      placeholder="${esc(placeholder)}" maxlength="${maxlength}" autocomplete="off" spellcheck="false"${list ? ` list="${list}"` : ''}>
  </div>`;
}

function numberField({ field, label, value, unit = '', min = 0, max = '', step = 'any', placeholder = '', help = '', onChange = false }) {
  const id = nextId();
  const shown = value === null || value === undefined || value === '' ? '' : String(value);
  return `<div class="field">
    <label for="${id}">${esc(label)}</label>
    <div class="with-unit">
      <input class="input" id="${id}" type="number" inputmode="decimal" data-field="${field}"${onChange ? ' data-on="change"' : ''}
        value="${esc(shown)}" min="${min}"${max !== '' ? ` max="${max}"` : ''} step="${step}" placeholder="${esc(placeholder)}">
      ${unit ? `<span class="unit">${esc(unit)}</span>` : ''}
    </div>
    ${help ? `<p class="field-help">${esc(help)}</p>` : ''}
  </div>`;
}

function colorField({ field, label, value, allowNone = false }) {
  const id = nextId();
  const options = [];
  if (allowNone) options.push(`<option value=""${value ? '' : ' selected'}>No stripe</option>`);
  for (const c of WIRE_COLORS) {
    options.push(`<option value="${c.code}"${c.code === value ? ' selected' : ''}>${capitalize(c.name)} (${c.code})</option>`);
  }
  // Keep a color code from a file, even if OpenWire does not know it.
  if (value && !colorInfo(value)) options.push(`<option value="${esc(value)}" selected>${esc(value)}</option>`);
  return `<div class="field">
    <label for="${id}">${esc(label)}</label>
    <div class="color-field">
      ${swatch(value, field)}
      <select class="input" id="${id}" data-field="${field}">${options.join('')}</select>
    </div>
  </div>`;
}

function rangeField({ field, label, value, min, max, unit }) {
  const id = nextId();
  return `<div class="field range-field">
    <label for="${id}">${esc(label)}</label>
    <div class="range-row">
      <input class="range" id="${id}" type="range" data-field="${field}" min="${min}" max="${max}" step="1" value="${value}">
      <output for="${id}" data-output-for="${field}">${value} ${esc(unit)}</output>
    </div>
  </div>`;
}

function checkField({ field, label, checked, help = '' }) {
  const id = nextId();
  return `<div class="field check-field">
    <label for="${id}"><input id="${id}" type="checkbox" data-field="${field}"${checked ? ' checked' : ''}> ${esc(label)}</label>
    ${help ? `<p class="field-help">${esc(help)}</p>` : ''}
  </div>`;
}

function selectField({ field, label, value, options }) {
  const id = nextId();
  const list = options
    .map((o) => `<option value="${esc(o.code)}"${o.code === value ? ' selected' : ''}>${esc(o.name)}</option>`)
    .join('');
  return `<div class="field">
    <label for="${id}">${esc(label)}</label>
    <select class="input" id="${id}" data-field="${field}">${list}</select>
  </div>`;
}

const ICON_LEFT = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 3.5 4.5 7 8 10.5"/><path d="M4.8 7H11a5 5 0 0 1 0 10H8.5"/></svg>';
const ICON_RIGHT = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12 3.5 3.5 3.5-3.5 3.5"/><path d="M15.2 7H9a5 5 0 0 0 0 10h2.5"/></svg>';

function turnText(rotation) {
  const r = Math.round(numberOr(rotation, 0));
  if (!r) return 'Not turned';
  const side = r > 0 ? 'to the right' : 'to the left';
  return `Turned ${r > 0 ? '+' : '−'}${Math.abs(r)}° (${side})`;
}

// Picture preview with the buttons to turn, crop and reset it.
// `target` is 'connector' or 'background'. app.js runs the buttons.
function pictureTools({ img, rotation, crop, target, label }) {
  const changed = Boolean(rotation) || Boolean(crop);
  const view = pictureView(img, rotation, crop);
  return `<figure class="photo-preview${target === 'background' ? ' is-small' : ''}">
      ${pictureElement(img, { rotation, crop, className: 'photo-svg', label })}
    </figure>
    <p class="field-help">${esc(img.name || 'Picture')}, ${formatBytes(pictureBytes(img))}. ${turnText(rotation)}${crop ? `, cropped to ${Math.round(view.width)} × ${Math.round(view.height)} px` : ''}.</p>
    <div class="photo-tools" role="group" aria-label="Turn and crop">
      <button type="button" class="button small icon-text" data-cmd="photo-turn" data-target="${target}" data-step="-90" title="Turn 90° to the left">${ICON_LEFT}<span>−90°</span></button>
      <button type="button" class="button small icon-text" data-cmd="photo-turn" data-target="${target}" data-step="90" title="Turn 90° to the right">${ICON_RIGHT}<span>+90°</span></button>
      <button type="button" class="button small" data-cmd="photo-crop" data-target="${target}">Crop…</button>
      <button type="button" class="button small" data-cmd="photo-reset" data-target="${target}"${changed ? '' : ' disabled'}>Reset</button>
    </div>`;
}

function swatch(code, field) {
  const hex = colorInfo(code)?.hex;
  return `<span class="swatch${hex ? '' : ' is-none'}" data-swatch="${field}"${hex ? ` style="--swatch:${hex}"` : ''} aria-hidden="true"></span>`;
}

// ---------- Panel ----------

export function createInspector(root, store) {
  function renderProject() {
    const p = store.project;
    return `
      <h2 class="props-title">Harness</h2>
      <p class="props-sub">Select a connector or a wire in the drawing to change it.</p>
      ${textField({ field: 'meta.name', label: 'Name', value: p.meta.name })}
      <div class="field-row">
        ${textField({ field: 'meta.revision', label: 'Revision', value: p.meta.revision, maxlength: 20 })}
        ${textField({ field: 'meta.author', label: 'Author', value: p.meta.author, maxlength: 80 })}
      </div>
      <div class="field-row">
        ${numberField({ field: 'settings.cutMargin', label: 'Extra length per wire', value: p.settings.cutMargin, unit: 'mm', step: 1 })}
        ${textField({ field: 'settings.currency', label: 'Currency', value: p.settings.currency, maxlength: 4 })}
      </div>
      <p class="field-help">The cut list adds the extra length to each wire, for stripping and crimping.</p>
      ${renderBackground()}
      <h3 class="section-title">Summary</h3>
      <dl class="outputs" data-outputs></dl>
      <p class="props-hint">To add a wire, drag from one pin to a different pin. Or select one pin, then select the other pin.</p>`;
  }

  function renderBackground() {
    const p = store.project;
    const bg = p.background;
    const img = findImage(p, bg?.image);
    if (!img) {
      return `<h3 class="section-title">Background picture</h3>
        <p class="field-help">Put a photo or a drawing behind the harness, for example a photo of the vehicle or the panel. Then put the connectors on it.</p>
        <div class="photo-actions"><button type="button" class="button" data-cmd="add-background">Add background picture</button></div>`;
    }
    return `<h3 class="section-title">Background picture</h3>
      ${pictureTools({ img, rotation: bg.rotation, crop: bg.crop, target: 'background', label: 'Background picture' })}
      ${rangeField({ field: 'background.scale', label: 'Size', value: Math.round(bg.scale * 100), min: 5, max: 300, unit: '%' })}
      ${rangeField({ field: 'background.opacity', label: 'Visibility', value: Math.round(bg.opacity * 100), min: 10, max: 100, unit: '%' })}
      ${checkField({
        field: 'background.movable',
        label: 'Move the picture',
        checked: bg.movable,
        help: 'When this is on, drag the picture in the drawing to move it. Turn it off when the picture is in the correct position.',
      })}
      <div class="photo-actions">
        <button type="button" class="button" data-cmd="add-background">Change picture</button>
        <button type="button" class="button danger" data-cmd="remove-background">Remove picture</button>
      </div>`;
  }

  function renderConnectorPhoto(c) {
    const img = findImage(store.project, c.image);
    const noun = isSplitter(c) ? 'splitter' : 'connector';
    if (!img) {
      return `<h3 class="section-title">Photo</h3>
        <p class="field-help">Add a photo of the ${noun}. The photo shows in the drawing and in the printout.</p>
        <div class="photo-actions"><button type="button" class="button" data-cmd="connector-photo">Add photo</button></div>`;
    }
    return `<h3 class="section-title">Photo</h3>
      ${pictureTools({ img, rotation: c.photoRotation, crop: c.photoCrop, target: 'connector', label: `Photo of the ${noun}` })}
      <div class="photo-actions">
        <button type="button" class="button" data-cmd="connector-photo">Change photo</button>
        <button type="button" class="button danger" data-cmd="remove-connector-photo">Remove photo</button>
      </div>`;
  }

  function projectOutputs() {
    const p = store.project;
    const wires = p.wires.filter((w) => !isUsb(w));
    const usb = p.wires.length - wires.length;
    const splitters = p.connectors.filter(isSplitter).length;
    const missing = wires.filter((w) => !isPositive(w.length)).length;
    return `
      <dt>Connectors</dt><dd>${p.connectors.length - splitters}</dd>
      ${splitters ? `<dt>Splitters</dt><dd>${splitters}</dd>` : ''}
      <dt>Wires</dt><dd>${wires.length}</dd>
      ${usb ? `<dt>USB cables</dt><dd>${usb}</dd>` : ''}
      <dt>Wire to cut</dt><dd>${formatMeters(totalWireLength(p))} m${missing ? ` (${plural(missing, 'wire has', 'wires have')} no length)` : ''}</dd>`;
  }

  function renderConnector(c) {
    const p = store.project;
    const currency = p.settings.currency;
    const count = wiresOnConnector(p, c.id).length;
    const pins = c.pins
      .map((pin, i) => {
        const n = i + 1;
        const refs = wiresOnPin(p, c.id, n)
          .map((w) => w.ref)
          .join(', ');
        const id = nextId();
        const roles = PIN_ROLES.map(
          (r) => `<option value="${r.code}"${r.code === (pin.role || '') ? ' selected' : ''}>${r.code ? r.name : '—'}</option>`,
        ).join('');
        return `<div class="pin-row has-role">
          <label class="pin-num" for="${id}">${n}</label>
          <input class="input" id="${id}" type="text" data-pin-label="${n}" value="${esc(pin.label)}"
            placeholder="Pin name" maxlength="60" autocomplete="off" spellcheck="false">
          <select class="input pin-role" data-pin-role="${n}" aria-label="Pin ${n} is an input or an output">${roles}</select>
          <span class="pin-wires" title="${esc(refs)}">${esc(refs)}</span>
        </div>`;
      })
      .join('');
    return `
      <h2 class="props-title" data-title="Connector">Connector ${esc(c.ref)}</h2>
      <p class="props-sub">${count ? `${plural(count, 'wire connects', 'wires connect')} to this connector.` : 'No wires connect to this connector yet.'}
        Drag the dark bar to move it.</p>
      <div class="field-row">
        ${textField({ field: 'ref', label: 'Name', value: c.ref, maxlength: 20 })}
        ${numberField({ field: 'pinCount', label: 'Pins', value: c.pins.length, min: 1, max: MAX_PINS, step: 1, onChange: true })}
      </div>
      ${textField({ field: 'partNumber', label: 'Part number', value: c.partNumber })}
      <div class="field-row">
        ${textField({ field: 'manufacturer', label: 'Manufacturer', value: c.manufacturer })}
        ${numberField({ field: 'price', label: 'Unit price', value: c.price || '', unit: currency, step: 0.01 })}
      </div>
      ${textField({ field: 'description', label: 'Description', value: c.description })}
      ${renderConnectorPhoto(c)}
      <h3 class="section-title">Contacts</h3>
      <div class="field-row">
        ${textField({ field: 'contactPartNumber', label: 'Contact part number', value: c.contactPartNumber })}
        ${numberField({ field: 'contactPrice', label: 'Contact price', value: c.contactPrice || '', unit: currency, step: 0.01 })}
      </div>
      <p class="field-help">The BOM counts one contact for each pin that has a wire.</p>
      <h3 class="section-title">Pins</h3>
      <p class="field-help">Give each pin a name. Set a pin as an input or an output if necessary. Checks warns when a wire connects two outputs or two inputs.</p>
      <div class="pin-lists" data-roles></div>
      <div class="pins">${pins}</div>
      <div class="props-actions">
        <button type="button" class="button" data-cmd="duplicate">Duplicate</button>
        <button type="button" class="button danger" data-cmd="delete">Delete connector</button>
      </div>`;
  }

  function roleLists(c) {
    const list = (role) =>
      c.pins
        .map((pin, i) => (pin.role === role ? `${i + 1}${pin.label ? ` (${esc(pin.label)})` : ''}` : null))
        .filter(Boolean);
    const inputs = list('in');
    const outputs = list('out');
    if (!inputs.length && !outputs.length) return '';
    return `<dl class="outputs">
      <dt>Inputs</dt><dd>${inputs.length ? inputs.join(', ') : 'None'}</dd>
      <dt>Outputs</dt><dd>${outputs.length ? outputs.join(', ') : 'None'}</dd>
    </dl>`;
  }

  function splitterPinRow(c, pin, placeholder, hex) {
    const p = store.project;
    const refs = wiresOnPin(p, c.id, pin)
      .map((w) => w.ref)
      .join(', ');
    const id = nextId();
    return `<div class="pin-row">
      <label class="pin-num" for="${id}"><span class="lever-dot" style="--swatch:${hex}"></span></label>
      <input class="input" id="${id}" type="text" data-pin-label="${pin}" value="${esc(c.pins[pin - 1]?.label || '')}"
        placeholder="${esc(placeholder)}" maxlength="60" autocomplete="off" spellcheck="false">
      <span class="pin-wires" title="${esc(refs)}">${esc(refs)}</span>
    </div>`;
  }

  function renderSplitter(c) {
    const p = store.project;
    const currency = p.settings.currency;
    const count = wiresOnConnector(p, c.id).length;
    const hexOf = (pole) => colorInfo(SPLITTER_COLORS[pole % SPLITTER_COLORS.length])?.hex || '#8c9196';
    const inputs = Array.from({ length: c.poles }, (_, i) => splitterPinRow(c, i + 1, `Input ${i + 1}`, hexOf(i))).join('');
    const outputs = Array.from({ length: c.poles }, (_, i) => {
      const rows = Array.from({ length: c.outputs }, (_, k) =>
        splitterPinRow(c, c.poles + i * c.outputs + k + 1, `Output ${i + 1}.${k + 1}`, hexOf(i)),
      ).join('');
      return `<p class="pin-group-title">From input ${i + 1}</p><div class="pins">${rows}</div>`;
    }).join('');
    return `
      <h2 class="props-title" data-title="Splitter">Splitter ${esc(c.ref)}</h2>
      <p class="props-sub">${count ? `${plural(count, 'wire connects', 'wires connect')} to this splitter.` : 'No wires connect to this splitter yet.'}
        Each input connects to its outputs inside the splitter.</p>
      ${textField({ field: 'ref', label: 'Name', value: c.ref, maxlength: 20 })}
      <div class="field-row">
        ${numberField({ field: 'poles', label: 'Inputs', value: c.poles, min: 1, max: MAX_POLES, step: 1, onChange: true })}
        ${numberField({ field: 'outputs', label: 'Outputs per input', value: c.outputs, min: 1, max: MAX_OUTPUTS, step: 1, onChange: true })}
      </div>
      ${textField({ field: 'partNumber', label: 'Part number', value: c.partNumber })}
      <div class="field-row">
        ${textField({ field: 'manufacturer', label: 'Manufacturer', value: c.manufacturer })}
        ${numberField({ field: 'price', label: 'Unit price', value: c.price || '', unit: currency, step: 0.01 })}
      </div>
      ${textField({ field: 'description', label: 'Description', value: c.description })}
      ${renderConnectorPhoto(c)}
      <h3 class="section-title">Inputs</h3>
      <div class="pins">${inputs}</div>
      <h3 class="section-title">Outputs</h3>
      ${outputs}
      <div class="props-actions">
        <button type="button" class="button" data-cmd="duplicate">Duplicate</button>
        <button type="button" class="button danger" data-cmd="delete">Delete splitter</button>
      </div>`;
  }

  function endText(end) {
    const p = store.project;
    const label = pinLabel(p, end);
    return `${endLabel(p, end)}${label ? ` (${label})` : ''}`;
  }

  const WIRE_KINDS = [
    { code: 'wire', name: 'Wire' },
    { code: 'usb', name: 'USB cable' },
  ];

  function renderUsb(w) {
    const currency = store.project.settings.currency;
    return `
      <h2 class="props-title" data-title="USB cable">USB cable ${esc(w.ref)}</h2>
      <p class="props-sub">From ${esc(endText(w.from))} to ${esc(endText(w.to))}</p>
      <div class="field-row">
        ${textField({ field: 'ref', label: 'Name', value: w.ref, maxlength: 20 })}
        ${selectField({ field: 'kind', label: 'Type', value: 'usb', options: WIRE_KINDS })}
      </div>
      <div class="field-row">
        ${selectField({ field: 'usbA', label: `Plug at ${endLabel(store.project, w.from)}`, value: w.usbA, options: USB_TYPES })}
        ${selectField({ field: 'usbB', label: `Plug at ${endLabel(store.project, w.to)}`, value: w.usbB, options: USB_TYPES })}
      </div>
      <div class="field-row">
        ${numberField({ field: 'length', label: 'Cable length', value: w.length ?? '', unit: 'mm', step: 1, placeholder: 'For example 1000' })}
        ${textField({ field: 'signal', label: 'Use', value: w.signal, placeholder: 'For example data', maxlength: 60 })}
      </div>
      <div class="field-row">
        ${textField({ field: 'partNumber', label: 'Part number', value: w.partNumber })}
        ${numberField({ field: 'price', label: 'Price', value: w.price || '', unit: currency, step: 0.01 })}
      </div>
      <p class="field-help">A USB cable is not in the cut list. The BOM shows it as a cable.</p>
      <div class="props-actions">
        <button type="button" class="button" data-cmd="swap-ends">Swap ends</button>
        <button type="button" class="button danger" data-cmd="delete">Delete cable</button>
      </div>`;
  }

  function renderWire(w) {
    if (isUsb(w)) return renderUsb(w);
    const currency = store.project.settings.currency;
    return `
      <h2 class="props-title" data-title="Wire">Wire ${esc(w.ref)}</h2>
      <p class="props-sub">From ${esc(endText(w.from))} to ${esc(endText(w.to))}</p>
      ${selectField({ field: 'kind', label: 'Type', value: 'wire', options: WIRE_KINDS })}
      <div class="field-row">
        ${textField({ field: 'ref', label: 'Name', value: w.ref, maxlength: 20 })}
        ${textField({ field: 'signal', label: 'Signal', value: w.signal, placeholder: 'For example GND', maxlength: 60 })}
      </div>
      <div class="field-row">
        ${colorField({ field: 'color', label: 'Color', value: w.color })}
        ${colorField({ field: 'stripe', label: 'Stripe', value: w.stripe, allowNone: true })}
      </div>
      <div class="field-row">
        ${textField({ field: 'gauge', label: 'Gauge', value: w.gauge, placeholder: '0.5 mm²', maxlength: 30, list: 'ow-gauges' })}
        ${numberField({ field: 'length', label: 'Length', value: w.length ?? '', unit: 'mm', step: 1, placeholder: 'Required' })}
      </div>
      <dl class="outputs" data-outputs></dl>
      <div class="field-row">
        ${textField({ field: 'partNumber', label: 'Wire part number', value: w.partNumber })}
        ${numberField({ field: 'pricePerMeter', label: 'Price per meter', value: w.pricePerMeter || '', unit: currency, step: 0.01 })}
      </div>
      <datalist id="ow-gauges">${GAUGES.map((g) => `<option value="${esc(g)}"></option>`).join('')}</datalist>
      <div class="props-actions">
        <button type="button" class="button" data-cmd="swap-ends">Swap ends</button>
        <button type="button" class="button danger" data-cmd="delete">Delete wire</button>
      </div>`;
  }

  function wireOutputs(w) {
    if (isUsb(w)) return '';
    const p = store.project;
    const cut = cutLength(p, w);
    return `
      <dt>Cut length</dt><dd>${cut === null ? 'Enter the length' : `${formatLength(cut)} mm`}</dd>
      <dt>Extra length</dt><dd>${formatLength(numberOr(p.settings.cutMargin, 0))} mm</dd>`;
  }

  // ---------- Rendering ----------

  function selectedItem() {
    const sel = store.selection;
    if (sel?.type === 'connector') return { type: 'connector', item: findConnector(store.project, sel.id) };
    if (sel?.type === 'wire') return { type: 'wire', item: findWire(store.project, sel.id) };
    return { type: 'project', item: null };
  }

  function refreshOutputs() {
    refreshRoles();
    const box = root.querySelector('[data-outputs]');
    if (!box) return;
    const { type, item } = selectedItem();
    if (type === 'project') box.innerHTML = projectOutputs();
    else if (type === 'wire' && item) box.innerHTML = wireOutputs(item);
  }

  function refreshRoles() {
    const box = root.querySelector('[data-roles]');
    const { type, item } = selectedItem();
    if (box && type === 'connector' && item) box.innerHTML = roleLists(item);
  }

  function render() {
    const { type, item } = selectedItem();
    const scroll = root.scrollTop;
    const active = document.activeElement;
    const focusKey = root.contains(active) ? active.dataset.field || (active.dataset.pinLabel && `pin:${active.dataset.pinLabel}`) : null;

    if (type === 'connector' && item) root.innerHTML = isSplitter(item) ? renderSplitter(item) : renderConnector(item);
    else if (type === 'wire' && item) root.innerHTML = renderWire(item);
    else root.innerHTML = renderProject();
    refreshOutputs();
    root.scrollTop = scroll;

    if (focusKey) {
      const selector = focusKey.startsWith('pin:')
        ? `[data-pin-label="${focusKey.slice(4)}"]`
        : `[data-field="${CSS.escape(focusKey)}"]`;
      root.querySelector(selector)?.focus();
    }
  }

  // ---------- Editing ----------

  const money = (raw) => Math.max(0, numberOr(raw, 0));

  function setProjectField(project, field, raw) {
    switch (field) {
      case 'meta.name':
        project.meta.name = raw;
        break;
      case 'meta.revision':
        project.meta.revision = raw;
        break;
      case 'meta.author':
        project.meta.author = raw;
        break;
      case 'settings.cutMargin':
        project.settings.cutMargin = Math.max(0, numberOr(raw, 0));
        break;
      case 'settings.currency':
        project.settings.currency = raw.trim();
        break;
      case 'background.scale': {
        const bg = project.background;
        const img = findImage(project, bg?.image);
        if (!img) break;
        // Keep the middle of the picture in the same place.
        const view = pictureView(img, bg.rotation, bg.crop);
        const scale = Math.min(20, Math.max(0.01, numberOr(raw, 100) / 100));
        const cx = bg.x + (view.width * bg.scale) / 2;
        const cy = bg.y + (view.height * bg.scale) / 2;
        bg.scale = scale;
        bg.x = Math.round(cx - (view.width * scale) / 2);
        bg.y = Math.round(cy - (view.height * scale) / 2);
        break;
      }
      case 'background.opacity':
        if (project.background) project.background.opacity = Math.min(1, Math.max(0.05, numberOr(raw, 50) / 100));
        break;
      case 'background.movable':
        if (project.background) project.background.movable = raw === true;
        break;
      default:
        break;
    }
  }

  function setConnectorField(c, field, raw) {
    if (['ref', 'partNumber', 'manufacturer', 'description', 'contactPartNumber'].includes(field)) c[field] = raw;
    else if (field === 'price' || field === 'contactPrice') c[field] = money(raw);
  }

  function setWireField(w, field, raw) {
    if (field === 'kind') {
      const kind = raw === 'usb' ? 'usb' : 'wire';
      // A wire part number is not correct for a USB cable, and the opposite.
      if (kind !== w.kind) w.partNumber = '';
      w.kind = kind;
    } else if (['ref', 'signal', 'gauge', 'partNumber', 'color', 'stripe', 'usbA', 'usbB'].includes(field)) {
      w[field] = raw;
    } else if (field === 'price') {
      w.price = money(raw);
    } else if (field === 'length') {
      const n = numberOr(raw, null);
      w.length = isPositive(n) ? n : null;
    } else if (field === 'pricePerMeter') {
      w.pricePerMeter = money(raw);
    }
  }

  function applyInput(el) {
    const field = el.dataset.field;
    const pin = el.dataset.pinLabel;
    if (!field && !pin) return;
    const sel = store.selection;
    const raw = el.type === 'checkbox' ? el.checked : el.value;
    const key = `${sel ? `${sel.type}:${sel.id}` : 'project'}:${field || `pin-${pin}`}`;

    store.update(
      (project) => {
        if (!sel) {
          setProjectField(project, field, raw);
        } else if (sel.type === 'connector') {
          const c = findConnector(project, sel.id);
          if (!c) return;
          if (pin) {
            const target = c.pins[Number(pin) - 1];
            if (target) target.label = raw;
          } else {
            setConnectorField(c, field, raw);
          }
        } else if (sel.type === 'wire') {
          const w = findWire(project, sel.id);
          if (w) setWireField(w, field, raw);
        }
      },
      // A new type needs a different panel, so it is a structural change.
      field === 'kind' ? { source: 'inspector', structural: true } : { source: 'inspector', coalesce: key },
    );
    if (field === 'kind') return;

    const output = root.querySelector(`[data-output-for="${field}"]`);
    if (output) output.textContent = `${el.value} %`;

    if (field === 'ref') {
      const title = root.querySelector('[data-title]');
      if (title) title.textContent = `${title.dataset.title} ${raw}`;
    }
    const swatchEl = root.querySelector(`[data-swatch="${field}"]`);
    if (swatchEl) swatchEl.outerHTML = swatch(raw, field);
  }

  function changePinCount(el) {
    const sel = store.selection;
    if (sel?.type !== 'connector') return;
    const c = findConnector(store.project, sel.id);
    if (!c) return;
    const n = clampInt(el.value, 1, MAX_PINS);
    if (n === c.pins.length) {
      el.value = String(n);
      return;
    }
    const removed = wiresRemovedByPinCount(store.project, sel.id, n);
    if (removed.length) {
      const names = removed.map((w) => w.ref).join(', ');
      const message =
        removed.length === 1
          ? `Wire ${names} uses a pin that you remove. OpenWire deletes this wire. Continue?`
          : `Wires ${names} use pins that you remove. OpenWire deletes these wires. Continue?`;
      if (!window.confirm(message)) {
        el.value = String(c.pins.length);
        return;
      }
    }
    store.update((project) => setPinCount(project, sel.id, n), { source: 'inspector', structural: true });
  }

  function changeSplitterSize(el) {
    const sel = store.selection;
    const c = sel?.type === 'connector' ? findConnector(store.project, sel.id) : null;
    if (!c || !isSplitter(c)) return;
    const poles = el.dataset.field === 'poles' ? clampInt(el.value, 1, MAX_POLES) : c.poles;
    const outputs = el.dataset.field === 'outputs' ? clampInt(el.value, 1, MAX_OUTPUTS) : c.outputs;
    if (poles === c.poles && outputs === c.outputs) {
      el.value = String(el.dataset.field === 'poles' ? c.poles : c.outputs);
      return;
    }
    const removed = wiresRemovedBySplitterSize(store.project, c.id, poles, outputs);
    if (removed.length) {
      const names = removed.map((w) => w.ref).join(', ');
      const message =
        removed.length === 1
          ? `Wire ${names} uses a pin that you remove. OpenWire deletes this wire. Continue?`
          : `Wires ${names} use pins that you remove. OpenWire deletes these wires. Continue?`;
      if (!window.confirm(message)) {
        el.value = String(el.dataset.field === 'poles' ? c.poles : c.outputs);
        return;
      }
    }
    store.update((project) => setSplitterSize(project, c.id, poles, outputs), { source: 'inspector', structural: true });
  }

  function changePinRole(el) {
    const sel = store.selection;
    if (sel?.type !== 'connector') return;
    const n = Number(el.dataset.pinRole);
    store.update(
      (project) => {
        const pin = findConnector(project, sel.id)?.pins[n - 1];
        if (pin) pin.role = PIN_ROLES.some((r) => r.code === el.value) ? el.value : '';
      },
      { source: 'inspector' },
    );
  }

  root.addEventListener('input', (e) => {
    const el = e.target;
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.dataset.on === 'change') return;
    applyInput(el);
  });

  root.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.field === 'pinCount') changePinCount(el);
    else if (el.dataset.field === 'poles' || el.dataset.field === 'outputs') changeSplitterSize(el);
    else if (el.dataset.pinRole) changePinRole(el);
    else if (el.tagName === 'SELECT' || el.type === 'checkbox') applyInput(el);
  });

  // The next edit of the same field starts a new undo step.
  root.addEventListener('focusout', () => store.endCoalesce());

  store.subscribe((type, info = {}) => {
    if (type === 'select' || type === 'replace') {
      render();
    } else if (type === 'change') {
      if (info.kind === 'move') return;
      if (info.source === 'inspector' && !info.structural) refreshOutputs();
      else render();
    }
  });

  render();
  return { render };
}
