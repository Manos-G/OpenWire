// SVG markup for components, wires and cables. No DOM access.
// canvas.js puts this markup in the drawing. The SVG export uses the same markup.

import { SPLITTER_COLORS, colorInfo, isFlat, isManifold, isPositive, isTube, isUsb, wireKindText } from './model.js';
import { CAPTION_H, COL_W, HEAD_H, HOUSING, LABEL_ZONE, ROW_H } from './layout.js';
import { escapeHtml as esc, formatLength } from './report.js';
import { pictureSvg } from './images.js';

const FONT = "'Barlow Semi Condensed', 'Bahnschrift', 'Roboto Condensed', 'Arial Narrow', sans-serif";

// Styles for the drawing. The exported SVG contains the same styles,
// so a drawing looks the same in other programs.
export const DIAGRAM_CSS = `
.ow text { font-family: ${FONT}; }
.ow-head { fill: var(--ow-head, #26323f); }
.ow-ref { fill: var(--ow-head-text, #ffffff); font-size: 14px; font-weight: 600; }
.ow-pn { fill: var(--ow-head-sub, #b9c6d3); font-size: 11px; }
.ow-body { fill: var(--ow-body, #ffffff); stroke: var(--ow-ink, #26323f); stroke-width: 1.25; }
.ow-numcol { fill: var(--ow-numcol, #eef2f5); }
.ow-row-bg { fill: var(--ow-body, #ffffff); fill-opacity: 0; }
.ow-pin-num { fill: var(--ow-muted, #52606d); font-size: 11px; text-anchor: middle; font-variant-numeric: tabular-nums; }
.ow-pin-label { fill: var(--ow-text, #1d2833); font-size: 12px; }
.ow-pin-no { fill: var(--ow-muted, #6b7884); font-size: 10.5px; font-variant-numeric: tabular-nums; }
.ow-empty-pins { fill: var(--ow-muted, #8795a3); font-size: 11px; text-anchor: middle; }
.ow-anchor { fill: var(--ow-anchor, #ffffff); stroke: var(--ow-anchor-line, #8795a3); stroke-width: 1.1; }
.ow-anchor.is-used { fill: var(--ow-anchor-used, #26323f); stroke: var(--ow-anchor-used, #26323f); }
.ow-housing { stroke-width: 1; stroke-linejoin: round; }
.ow-contact-bullet { fill: #e0b23a; stroke: #7a6200; stroke-width: 0.8; }
.ow-contact-metal { fill: #c9ced3; stroke: #4f575e; stroke-width: 0.7; }
.ow-screw { fill: #d0d5d9; stroke: #4f575e; stroke-width: 0.8; }
.ow-screw-slot { stroke: #4f575e; stroke-width: 1.2; stroke-linecap: round; }
.ow-term-lever { fill: #ef7d14; stroke: #8a4300; stroke-width: 0.7; }
.ow-ring { fill: none; stroke: #b8862b; stroke-width: 2.2; }
.ow-ring-barrel { fill: #d9b25a; stroke: #8a6a1c; stroke-width: 0.7; }
.ow-group-name { fill: var(--ow-group-name, #3d4a57); font-size: 9.5px; font-weight: 600; letter-spacing: 0.02em; }
.ow-wire-outline { fill: none; stroke: var(--ow-wire-edge, #1d2833); stroke-width: 5; stroke-linecap: round; }
.ow-wire-core { fill: none; stroke-width: 3; stroke-linecap: round; }
.ow-wire-stripe { fill: none; stroke-width: 1.5; stroke-dasharray: 6 6; }
.ow-label-bg { fill: var(--ow-label-bg, #ffffff); stroke: var(--ow-label-line, #c3ccd5); stroke-width: 0.75; }
.ow-label { fill: var(--ow-text, #1d2833); font-size: 11px; font-variant-numeric: tabular-nums; }
.ow-label-ref { font-weight: 600; }
.ow-label-kind { fill: var(--ow-muted, #52606d); }
.ow-sel { fill: none; stroke: var(--ow-sel, #f2c12e); stroke-opacity: 0.7; stroke-linecap: round; stroke-linejoin: round; }
.ow-title { fill: var(--ow-muted, #52606d); font-size: 12px; }
.ow-photo-line { stroke: var(--ow-row-line, #d8e0e7); stroke-width: 1; }
.ow-photo-bg { fill: var(--ow-photo-bg, #f6f8fa); }
.ow-photo-frame { stroke: var(--ow-row-line, #d8e0e7); stroke-width: 1; }
.ow-role { font-size: 9px; font-weight: 600; letter-spacing: 0.04em; }
.ow-role-in { fill: #1f5fbf; }
.ow-role-out { fill: #b35c0a; }
.ow-split-body { fill: var(--ow-split-body, #e3e6e9); stroke: var(--ow-ink, #26323f); stroke-width: 1.25; }
.ow-split-sep { stroke: var(--ow-split-sep, #c4cad0); stroke-width: 1; }
.ow-lever { stroke: rgba(0, 0, 0, 0.25); stroke-width: 0.75; }
.ow-lever-mark { fill: none; stroke: rgba(255, 255, 255, 0.55); stroke-width: 1.2; stroke-linecap: round; }
.ow-bus { fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.ow-lever-text { font-size: 9.5px; font-weight: 600; }
.ow-usb-outline { fill: none; stroke: #111518; stroke-width: 7; stroke-linecap: round; }
.ow-usb-core { fill: none; stroke: #3a4148; stroke-width: 4.5; stroke-linecap: round; }
.ow-usb-shine { fill: none; stroke: #6b747d; stroke-width: 1; stroke-linecap: round; }
.ow-plug-shell { fill: #c9ced3; stroke: #5d656d; stroke-width: 0.8; }
.ow-plug-boot { fill: #2b3137; stroke: #111518; stroke-width: 0.8; }
.ow-barb { fill: #d4a73a; stroke: #8a6a1c; stroke-width: 0.7; stroke-linejoin: round; }
.ow-port-boss { fill: #4a5259; stroke: #22272b; stroke-width: 1; }
.ow-collar { fill: #1f5fbf; stroke: #0f2f60; stroke-width: 0.8; }
.ow-collar-line { stroke: #8ab4ff; stroke-width: 0.9; }
.ow-tube-edge { fill: none; stroke: var(--ow-wire-edge, #1d2833); stroke-linecap: butt; }
.ow-tube-core { fill: none; stroke-linecap: butt; }
.ow-tube-bore { fill: none; stroke-linecap: butt; }
.ow-clamp { fill: #c3c9ce; stroke: #4f575e; stroke-width: 0.8; }
.ow-manifold-body { fill: var(--ow-split-body, #e3e6e9); stroke: var(--ow-ink, #26323f); stroke-width: 1.25; }
.ow-channel-edge { fill: none; stroke: #7d8790; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
.ow-channel { fill: none; stroke: #f4f7f9; stroke-width: 4.2; stroke-linecap: round; stroke-linejoin: round; }
.ow-port-label { fill: var(--ow-text, #1d2833); font-size: 11px; }
.ow-barrel-ring { stroke: #5d656d; stroke-width: 0.8; }
.ow-plug-text { fill: #ffffff; font-size: 8.5px; font-weight: 600; text-anchor: middle; }
.ow-flat-edge { fill: none; stroke: #8c8676; stroke-linecap: butt; }
.ow-flat-core { fill: none; stroke: #f4efe2; stroke-linecap: butt; }
.ow-flat-trace { fill: none; stroke: #d3c9ad; stroke-width: 0.8; stroke-dasharray: 2 2; }
.ow-stiffener { fill: #2f6fd1; stroke: #183f82; stroke-width: 0.8; }
.ow-fpc-contacts { fill: #e0b23a; }
.ow-fpc-text { fill: #ffffff; font-size: 7px; font-weight: 600; text-anchor: middle; }
`;

// The same styles with plain light colors, for exported SVG files. Many
// programs do not understand CSS variables, so the export does not use them.
export const EXPORT_CSS = DIAGRAM_CSS.replace(/var\(--[\w-]+,\s*([^)]+)\)/g, '$1');

const r1 = (v) => Math.round(v * 10) / 10;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const truncate = (text, max) => (text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text);

// ---------- Connector types ----------
// Each type has a look: a housing shape, colors and contacts.

const LOOKS = {
  generic: { style: 'plain' },
  xt30: { style: 'chamfer', fill: '#f2c215', stroke: '#7a6200', contact: 'bullet' },
  xt60: { style: 'chamfer', fill: '#f2c215', stroke: '#7a6200', contact: 'bullet' },
  xt90: { style: 'chamfer', fill: '#f2c215', stroke: '#7a6200', contact: 'bullet' },
  ec5: { style: 'chamfer', fill: '#1f5fbf', stroke: '#0f2f60', contact: 'bullet' },
  deans: { style: 'block', fill: '#c62f2a', stroke: '#6d1310', contact: 'blade' },
  anderson: { style: 'stack', fills: ['#c62f2a', '#26292c'], stroke: '#111518', contact: 'blade' },
  microfit: { style: 'block', fill: '#2b2f33', stroke: '#0c0e10', contact: 'square' },
  minifit: { style: 'block', fill: '#e8e1cc', stroke: '#8d846a', contact: 'square' },
  kk254: { style: 'block', fill: '#f1ece0', stroke: '#8d846a', contact: 'square' },
  picoblade: { style: 'block', fill: '#f1ece0', stroke: '#8d846a', contact: 'square', small: true },
  'jst-xh': { style: 'block', fill: '#eee6d0', stroke: '#8d846a', contact: 'square' },
  'jst-ph': { style: 'block', fill: '#eee6d0', stroke: '#8d846a', contact: 'square', small: true },
  'jst-sm': { style: 'block', fill: '#f7f7f4', stroke: '#8d8d86', contact: 'square' },
  dupont: { style: 'block', fill: '#26292c', stroke: '#000000', contact: 'square' },
  dt: { style: 'rounded', fill: '#6f777e', stroke: '#2f3438', contact: 'round', latch: '#3e4449' },
  superseal: { style: 'rounded', fill: '#2b2f33', stroke: '#000000', contact: 'round', latch: '#55606a' },
  m12: { style: 'pill', fill: '#8a929a', stroke: '#3c4247', contact: 'round' },
  rj45: { style: 'rj45', fill: '#dde2e6', stroke: '#7c858d', contact: 'blade' },
  barrel: { style: 'pill', fill: '#26292c', stroke: '#000000', contact: 'round' },
  terminal: { style: 'screw', fill: '#2e8b3e', stroke: '#185526' },
  lever: { style: 'lever', fill: '#cfd4d8', stroke: '#6d757d' },
  ring: { style: 'ring' },
  barb: { style: 'barb' },
  pushin: { style: 'pushin' },
};

// Maps a point on a side to the component. `v` is the distance from the edge
// to the inside, `u` is the position along the side.
function mapper(side, W, H) {
  return (v, u) => {
    if (side === 'left') return [v, u];
    if (side === 'right') return [W - v, u];
    if (side === 'top') return [u, v];
    return [u, H - v];
  };
}

function rectAttrs(P, v0, v1, u0, u1) {
  const [ax, ay] = P(v0, u0);
  const [bx, by] = P(v1, u1);
  return `x="${r1(Math.min(ax, bx))}" y="${r1(Math.min(ay, by))}" width="${r1(Math.abs(bx - ax))}" height="${r1(Math.abs(by - ay))}"`;
}

function polygon(P, points) {
  return points.map(([v, u]) => P(v, u).map(r1).join(',')).join(' ');
}

function contact(P, kind, at, small) {
  const v = 5.5;
  const [x, y] = P(v, at);
  if (kind === 'bullet') return `<circle class="ow-contact-bullet" cx="${r1(x)}" cy="${r1(y)}" r="3.4"/>`;
  if (kind === 'round') return `<circle class="ow-contact-metal" cx="${r1(x)}" cy="${r1(y)}" r="2.7"/>`;
  if (kind === 'blade') return `<rect class="ow-contact-metal" ${rectAttrs(P, v - 1.2, v + 1.2, at - 3.5, at + 3.5)}/>`;
  const s = small ? 1.8 : 2.3;
  return `<rect class="ow-contact-metal" ${rectAttrs(P, v - s, v + s, at - s, at + s)}/>`;
}

// The graphic of one pin group: the housing along the edge, and the contacts
// where the pins touch the edge.
function housing(item, W, H, pitch) {
  const look = LOOKS[item.group.type] || LOOKS.generic;
  const P = mapper(item.side, W, H);
  const u0 = item.from;
  const u1 = item.to;
  const D = HOUSING;
  const ats = item.pins.map((p) => p.at);
  const paint = (fill, stroke) => `class="ow-housing" fill="${fill}" stroke="${stroke}"`;
  const parts = [];

  switch (look.style) {
    case 'plain':
      parts.push(`<rect class="ow-numcol" ${rectAttrs(P, 0.7, D, u0, u1)}/>`);
      break;
    case 'chamfer':
      if (u1 - u0 < 16) parts.push(`<rect ${paint(look.fill, look.stroke)} ${rectAttrs(P, 1, D - 1, u0 + 2, u1 - 2)} rx="2"/>`);
      else
        parts.push(
          `<polygon ${paint(look.fill, look.stroke)} points="${polygon(P, [
            [1, u0 + 2],
            [D - 7, u0 + 2],
            [D - 1, u0 + 8],
            [D - 1, u1 - 2],
            [1, u1 - 2],
          ])}"/>`,
        );
      break;
    case 'rounded': {
      parts.push(`<rect ${paint(look.fill, look.stroke)} ${rectAttrs(P, 1, D - 1, u0 + 2, u1 - 2)} rx="5"/>`);
      const mid = (u0 + u1) / 2;
      parts.push(`<rect fill="${look.latch}" ${rectAttrs(P, D - 6, D - 2, mid - 5, mid + 5)} rx="1"/>`);
      break;
    }
    case 'pill': {
      const rx = Math.min(D - 2, u1 - u0 - 4) / 2;
      parts.push(`<rect ${paint(look.fill, look.stroke)} ${rectAttrs(P, 1, D - 1, u0 + 2, u1 - 2)} rx="${r1(rx)}"/>`);
      break;
    }
    case 'stack':
      ats.forEach((at, i) => {
        const fill = look.fills[i % look.fills.length];
        parts.push(`<rect ${paint(fill, look.stroke)} ${rectAttrs(P, 1, D - 1, at - pitch / 2 + 1, at + pitch / 2 - 1)} rx="1.5"/>`);
      });
      if (!ats.length) parts.push(`<rect ${paint(look.fills[0], look.stroke)} ${rectAttrs(P, 1, D - 1, u0 + 2, u1 - 2)} rx="1.5"/>`);
      break;
    case 'rj45': {
      parts.push(`<rect ${paint(look.fill, look.stroke)} ${rectAttrs(P, 1, D - 1, u0 + 2, u1 - 2)} rx="1.5"/>`);
      const mid = (u0 + u1) / 2;
      parts.push(`<rect fill="#ffffff" stroke="${look.stroke}" stroke-width="0.7" ${rectAttrs(P, D - 7, D - 1, mid - 5, mid + 5)}/>`);
      break;
    }
    case 'screw':
      parts.push(`<rect ${paint(look.fill, look.stroke)} ${rectAttrs(P, 1, D - 1, u0 + 1, u1 - 1)} rx="1.5"/>`);
      for (const at of ats) {
        const [x, y] = P(D * 0.55, at);
        const vertical = item.side === 'left' || item.side === 'right';
        parts.push(`<circle class="ow-screw" cx="${r1(x)}" cy="${r1(y)}" r="5.5"/>`);
        parts.push(
          vertical
            ? `<line class="ow-screw-slot" x1="${r1(x - 3.4)}" y1="${r1(y)}" x2="${r1(x + 3.4)}" y2="${r1(y)}"/>`
            : `<line class="ow-screw-slot" x1="${r1(x)}" y1="${r1(y - 3.4)}" x2="${r1(x)}" y2="${r1(y + 3.4)}"/>`,
        );
      }
      break;
    case 'lever':
      parts.push(`<rect ${paint(look.fill, look.stroke)} ${rectAttrs(P, 1, D - 1, u0 + 1, u1 - 1)} rx="2"/>`);
      for (const at of ats) parts.push(`<rect class="ow-term-lever" ${rectAttrs(P, 3, D - 3, at - pitch / 2 + 3, at + pitch / 2 - 3)} rx="2"/>`);
      break;
    case 'barb':
      // The port block of the part, with a brass hose barb for each pin.
      parts.push(`<rect class="ow-port-boss" ${rectAttrs(P, 0.5, D - 4, u0 + 2, u1 - 2)} rx="2"/>`);
      for (const at of ats) parts.push(barb(P, at));
      break;
    case 'pushin':
      // A push-in fitting: the body and a blue release collar for each pin.
      parts.push(`<rect class="ow-port-boss" ${rectAttrs(P, 0.5, D - 4, u0 + 2, u1 - 2)} rx="2"/>`);
      for (const at of ats) parts.push(collar(P, at));
      break;
    case 'ring':
      for (const at of ats) {
        parts.push(`<rect class="ow-ring-barrel" ${rectAttrs(P, 0.5, 9, at - 2.6, at + 2.6)} rx="1"/>`);
        const [x, y] = P(14.5, at);
        parts.push(`<circle class="ow-ring" cx="${r1(x)}" cy="${r1(y)}" r="5"/>`);
      }
      break;
    default:
      parts.push(`<rect ${paint(look.fill, look.stroke)} ${rectAttrs(P, 1, D - 1, u0 + 2, u1 - 2)} rx="2"/>`);
  }
  if (look.contact) for (const at of ats) parts.push(contact(P, look.contact, at, look.small));
  return parts.join('');
}

// A hose barb. It goes out from the edge (negative `v`). The tip is narrow,
// and each rib gets wider toward the part, like a real barb.
function barb(P, at) {
  const stem = `<rect class="ow-barb" ${rectAttrs(P, -13, 3, at - 2.3, at + 2.3)}/>`;
  const ribs = [-13, -8]
    .map(
      (tip) =>
        `<polygon class="ow-barb" points="${polygon(P, [
          [tip, at - 2.3],
          [tip + 4.5, at - 3.9],
          [tip + 4.5, at + 3.9],
          [tip, at + 2.3],
        ])}"/>`,
    )
    .join('');
  return stem + ribs;
}

// The release collar of a push-in fitting.
function collar(P, at) {
  const [x1, y1] = P(-3, at - 3.2);
  const [x2, y2] = P(-3, at + 3.2);
  return `<rect class="ow-collar" ${rectAttrs(P, -6, 2, at - 4.4, at + 4.4)} rx="1.4"/>
    <line class="ow-collar-line" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
}

// ---------- Connectors ----------

const CHAR_W = 5.7; // Approximate width of one character of a pin name.

function pinMarkup(c, L, item, pinPos, used) {
  const W = L.width;
  const H = L.height;
  const id = esc(c.id);
  const { pin, side } = pinPos;
  const plain = (item.group.type || 'generic') === 'generic';
  const isUsed = used.has(`${c.id}:${pin.n}`);
  const anchor = `<circle class="ow-anchor${isUsed ? ' is-used' : ''}" cx="${r1(pinPos.x)}" cy="${r1(pinPos.y)}" r="${isUsed ? 3.5 : 3}"/>`;
  const role = pin.role ? (pin.role === 'in' ? 'IN' : 'OUT') : '';
  const number = plain ? '' : `<tspan class="ow-pin-no">${pin.n}</tspan> `;
  let body = '';

  if (side === 'left' || side === 'right') {
    const half = side === 'left' ? L.leftCol : L.rightCol;
    const y = pinPos.y;
    const avail = half - HOUSING - 12 - (role ? 22 : 0) - (plain ? 0 : 12);
    const label = esc(truncate(pin.label, Math.max(3, Math.floor(avail / CHAR_W))));
    const left = side === 'left';
    const bgX = left ? 0 : W - half;
    const textX = left ? HOUSING + 6 : W - HOUSING - 6;
    const roleX = left ? half - 6 : W - half + 6;
    body = `
      <rect class="ow-row-bg" x="${r1(bgX)}" y="${r1(y - ROW_H / 2)}" width="${r1(half)}" height="${ROW_H}"/>
      ${plain ? `<text class="ow-pin-num" x="${left ? HOUSING / 2 : W - HOUSING / 2}" y="${r1(y)}" dominant-baseline="central">${pin.n}</text>` : ''}
      <text class="ow-pin-label" x="${r1(textX)}" y="${r1(y)}" dominant-baseline="central"${left ? '' : ' text-anchor="end"'}>${left ? `${number}${label}` : `${label}${number ? ` <tspan class="ow-pin-no">${pin.n}</tspan>` : ''}`}</text>
      ${role ? `<text class="ow-role ow-role-${pin.role}" x="${r1(roleX)}" y="${r1(y)}" dominant-baseline="central" text-anchor="${left ? 'end' : 'start'}">${role}</text>` : ''}
      ${anchor}
      <rect class="ow-hit ow-pin-hit" x="${r1(left ? -12 : W - half)}" y="${r1(y - ROW_H / 2)}" width="${r1(half + 12)}" height="${ROW_H}"/>`;
  } else {
    const top = side === 'top';
    const x = pinPos.x;
    const zone = top ? L.topZone : L.bottomZone;
    const label = esc(truncate(pin.label, Math.floor((LABEL_ZONE - 8 - (role ? 18 : 0) - (plain ? 0 : 12)) / CHAR_W)));
    const y0 = top ? HOUSING + L.topCaption + 5 : H - HOUSING - L.bottomCaption - 5;
    const turn = top ? 90 : -90;
    body = `
      <rect class="ow-row-bg" x="${r1(x - COL_W / 2)}" y="${r1(top ? 0 : H - zone)}" width="${COL_W}" height="${zone}"/>
      ${plain ? `<text class="ow-pin-num" x="${r1(x)}" y="${r1(top ? HOUSING / 2 : H - HOUSING / 2)}" dominant-baseline="central">${pin.n}</text>` : ''}
      <text class="ow-pin-label" transform="translate(${r1(x)} ${r1(y0)}) rotate(${turn})" dominant-baseline="central">${number}${label}${role ? ` <tspan class="ow-role ow-role-${pin.role}">${role}</tspan>` : ''}</text>
      ${anchor}
      <rect class="ow-hit ow-pin-hit" x="${r1(x - COL_W / 2)}" y="${r1(top ? -12 : H - zone)}" width="${COL_W}" height="${zone + 12}"/>`;
  }
  return `<g class="ow-pinrow" data-conn="${id}" data-pin="${pin.n}">${body}</g>`;
}

// The name and type of a pin group, next to its connector graphic.
function captionMarkup(item, L) {
  if (!item.caption) return '';
  const W = L.width;
  const H = L.height;
  const title = `<title>${esc(item.caption)}</title>`;
  if (item.side === 'left' || item.side === 'right') {
    const left = item.side === 'left';
    const room = (left ? L.leftCol : L.rightCol) - 6;
    const text = esc(truncate(item.caption, Math.floor(room / 5.2)));
    return `<text class="ow-group-name" x="${left ? 3 : W - 3}" y="${r1(item.captionAt)}" dominant-baseline="central"${left ? '' : ' text-anchor="end"'}>${title}${text}</text>`;
  }
  const top = item.side === 'top';
  const room = Math.max(item.to - item.from + 2, 30);
  const text = esc(truncate(item.caption, Math.floor(room / 5.2)));
  const y = top ? HOUSING + CAPTION_H / 2 + 1 : H - HOUSING - CAPTION_H / 2 - 1;
  return `<text class="ow-group-name" x="${r1((item.from + item.to) / 2)}" y="${r1(y)}" text-anchor="middle" dominant-baseline="central">${title}${text}</text>`;
}

function headMarkup(c, L, subtitle) {
  const id = esc(c.id);
  const W = L.width;
  const y = L.headY;
  const shape =
    y === 0
      ? `<path class="ow-head" d="M 0 3 A 3 3 0 0 1 3 0 H ${W - 3} A 3 3 0 0 1 ${W} 3 V ${HEAD_H} H 0 Z"/>`
      : `<rect class="ow-head" x="0" y="${y}" width="${W}" height="${HEAD_H}"/>`;
  return `<g class="ow-head-g" data-conn-head="${id}">
    ${shape}
    <text class="ow-ref" x="10" y="${y + HEAD_H / 2}" dominant-baseline="central">${esc(truncate(c.ref, 12))}</text>
    <text class="ow-pn" x="${W - 10}" y="${y + HEAD_H / 2}" text-anchor="end" dominant-baseline="central">${esc(truncate(subtitle, Math.floor((W - 70) / 5.5)))}</text>
  </g>`;
}

export function photoMarkup(c, L) {
  const box = L.photo;
  if (!box) return '';
  const top = L.rowsBottom;
  if (L.photoInside) {
    // A connector photo is in the middle of the connector.
    return `<g class="ow-head-g ow-photo" data-conn-head="${esc(c.id)}">
      <rect class="ow-photo-bg ow-photo-frame" x="${box.x - 2}" y="${box.y - 2}" width="${box.width + 4}" height="${box.height + 4}" rx="3"/>
      ${pictureSvg(box.img, { id: c.image, rotation: c.photoRotation, crop: c.photoCrop, ...box })}
    </g>`;
  }
  return `<g class="ow-head-g ow-photo" data-conn-head="${esc(c.id)}">
    <line class="ow-photo-line" x1="0" y1="${top}" x2="${L.width}" y2="${top}"/>
    <rect class="ow-photo-bg" x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"/>
    ${pictureSvg(box.img, { id: c.image, rotation: c.photoRotation, crop: c.photoCrop, ...box })}
  </g>`;
}

function selectionMarkup(L) {
  return `<rect class="ow-sel" x="-6" y="-6" width="${L.width + 12}" height="${L.height + 12}" rx="6" stroke-width="10"/>`;
}

// `used` is a Set of "connectorId:pin" for pins that have a wire.
export function connectorMarkup(c, L, { used, selected }) {
  const groups = L.groups
    .map((item) => {
      const pitch = item.side === 'left' || item.side === 'right' ? ROW_H : COL_W;
      const pins = item.pins.map((p) => pinMarkup(c, L, item, p, used)).join('');
      return `<g class="ow-group">${housing(item, L.width, L.height, pitch)}${captionMarkup(item, L)}${pins}</g>`;
    })
    .join('');
  const empty = L.pins.size
    ? ''
    : `<text class="ow-empty-pins" x="${L.width / 2}" y="${L.rowsTop + (L.rowsBottom - L.rowsTop) / 2}" dominant-baseline="central">No pins. Add pins in Properties.</text>`;
  return `<g class="ow-conn" data-conn-id="${esc(c.id)}" transform="translate(${r1(c.x)} ${r1(c.y)})">
    ${selected ? selectionMarkup(L) : ''}
    <rect class="ow-body ow-drag" data-conn-head="${esc(c.id)}" x="0" y="0" width="${L.width}" height="${L.height}" rx="3"/>
    ${headMarkup(c, L, c.partNumber)}
    ${groups}
    ${empty}
    ${photoMarkup(c, L)}
  </g>`;
}

// A splitter looks like a lever splitter: a grey body, one colored lever for
// each input on the left, and the levers of its outputs on the right.
// A vacuum tee or manifold: a plastic block with a channel inside. Each input
// connects through the channel to its outputs. Each port has a hose barb.
function manifoldMarkup(c, L, { used, selected }) {
  const id = esc(c.id);
  const W = L.width;
  const M = c.outputs;
  const left = (v, u) => [v, u];
  const right = (v, u) => [W - v, u];
  const anchor = (pin, side) => {
    const isUsed = used.has(`${c.id}:${pin}`);
    return `<circle class="ow-anchor${isUsed ? ' is-used' : ''}" cx="${side === 'right' ? W : 0}" cy="0" r="${isUsed ? 3.5 : 3}"/>`;
  };
  const groups = [];
  for (let p = 0; p < c.poles; p += 1) {
    const top = HEAD_H + p * M * ROW_H;
    const inPin = p + 1;
    const inMid = (M * ROW_H) / 2;
    const channel = Array.from({ length: M }, (_, k) => `M 4 ${inMid} H ${W / 2} V ${(k + 0.5) * ROW_H} H ${W - 4}`).join(' ');
    const outs = Array.from({ length: M }, (_, k) => {
      const pin = c.poles + p * M + k + 1;
      const label = c.pins[pin - 1]?.label || `${p + 1}.${k + 1}`;
      return `<g class="ow-pinrow" data-conn="${id}" data-pin="${pin}" transform="translate(0 ${top + k * ROW_H})">
        <rect class="ow-row-bg" x="${W / 2}" y="0" width="${W / 2}" height="${ROW_H}"/>
        ${barb(right, ROW_H / 2)}
        <text class="ow-port-label" x="${W - 10}" y="${ROW_H / 2 - 6}" text-anchor="end" dominant-baseline="central">${esc(truncate(label, 10))}</text>
        <g transform="translate(0 ${ROW_H / 2})">${anchor(pin, 'right')}</g>
        <rect class="ow-hit ow-pin-hit" x="${W / 2}" y="0" width="${W / 2 + 16}" height="${ROW_H}"/>
      </g>`;
    }).join('');
    groups.push(`<g class="ow-pole">
      ${p > 0 ? `<line class="ow-split-sep" x1="0" y1="${top}" x2="${W}" y2="${top}"/>` : ''}
      <g transform="translate(0 ${top})"><path class="ow-channel-edge" d="${channel}"/><path class="ow-channel" d="${channel}"/></g>
      <g class="ow-pinrow" data-conn="${id}" data-pin="${inPin}" transform="translate(0 ${top})">
        <rect class="ow-row-bg" x="0" y="0" width="${W / 2}" height="${M * ROW_H}"/>
        ${barb(left, inMid)}
        <text class="ow-port-label" x="10" y="${inMid - 6}" dominant-baseline="central">${esc(truncate(c.pins[inPin - 1]?.label || `IN ${p + 1}`, 10))}</text>
        <g transform="translate(0 ${inMid})">${anchor(inPin, 'left')}</g>
        <rect class="ow-hit ow-pin-hit" x="-16" y="0" width="${W / 2 + 16}" height="${M * ROW_H}"/>
      </g>
      ${outs}
    </g>`);
  }
  return `<g class="ow-conn ow-splitter ow-manifold" data-conn-id="${id}" transform="translate(${r1(c.x)} ${r1(c.y)})">
    ${selected ? selectionMarkup(L) : ''}
    <rect class="ow-manifold-body ow-drag" data-conn-head="${id}" x="0" y="0" width="${W}" height="${L.height}" rx="6"/>
    ${headMarkup(c, L, c.partNumber || (c.poles === 1 && M === 2 ? 'Vacuum tee' : `${c.poles} in, ${c.poles * M} out`))}
    ${groups.join('')}
    ${photoMarkup(c, L)}
  </g>`;
}

export function splitterMarkup(c, L, options) {
  if (isManifold(c)) return manifoldMarkup(c, L, options);
  const { used, selected } = options;
  const id = esc(c.id);
  const W = L.width;
  const M = c.outputs;
  const LW = 44;
  const inX = 9;
  const outX = W - 9 - LW;
  const anchor = (pin, side) => {
    const isUsed = used.has(`${c.id}:${pin}`);
    return `<circle class="ow-anchor${isUsed ? ' is-used' : ''}" cx="${side === 'right' ? W : 0}" cy="0" r="${isUsed ? 3.5 : 3}"/>`;
  };
  const lever = (x, y, height, hex, text) => {
    const n = Number.parseInt(hex.slice(1), 16);
    const light = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62;
    return `<rect class="ow-lever" x="${x}" y="${y}" width="${LW}" height="${height}" rx="4" fill="${hex}"/>
      <path class="ow-lever-mark" d="M ${x + 5} ${y + height / 2 - 3} v 6"/>
      <text class="ow-lever-text" x="${x + LW / 2 + 2}" y="${y + height / 2}" text-anchor="middle" dominant-baseline="central"
        fill="${light ? '#1d2833' : '#ffffff'}">${esc(truncate(text, 7))}</text>`;
  };
  const groups = [];
  for (let p = 0; p < c.poles; p += 1) {
    const hex = colorInfo(SPLITTER_COLORS[p % SPLITTER_COLORS.length])?.hex || '#8c9196';
    const top = HEAD_H + p * M * ROW_H;
    const inPin = p + 1;
    const inMid = (M * ROW_H) / 2;
    const bus = Array.from({ length: M }, (_, k) => `M ${inX + LW} ${inMid} H ${W / 2} V ${(k + 0.5) * ROW_H} H ${outX}`).join(' ');
    const outs = Array.from({ length: M }, (_, k) => {
      const pin = c.poles + p * M + k + 1;
      const label = c.pins[pin - 1]?.label || `${p + 1}.${k + 1}`;
      return `<g class="ow-pinrow" data-conn="${id}" data-pin="${pin}" transform="translate(0 ${top + k * ROW_H})">
        <rect class="ow-row-bg" x="${W / 2}" y="0" width="${W / 2}" height="${ROW_H}"/>
        ${lever(outX, 3, ROW_H - 6, hex, label)}
        <g transform="translate(0 ${ROW_H / 2})">${anchor(pin, 'right')}</g>
        <rect class="ow-hit ow-pin-hit" x="${W / 2}" y="0" width="${W / 2 + 12}" height="${ROW_H}"/>
      </g>`;
    }).join('');
    groups.push(`<g class="ow-pole">
      ${p > 0 ? `<line class="ow-split-sep" x1="0" y1="${top}" x2="${W}" y2="${top}"/>` : ''}
      <path class="ow-bus" d="${bus}" transform="translate(0 ${top})" stroke="${hex}"/>
      <g class="ow-pinrow" data-conn="${id}" data-pin="${inPin}" transform="translate(0 ${top})">
        <rect class="ow-row-bg" x="0" y="0" width="${W / 2}" height="${M * ROW_H}"/>
        ${lever(inX, 3, M * ROW_H - 6, hex, c.pins[inPin - 1]?.label || `IN ${p + 1}`)}
        <g transform="translate(0 ${inMid})">${anchor(inPin, 'left')}</g>
        <rect class="ow-hit ow-pin-hit" x="-12" y="0" width="${W / 2 + 12}" height="${M * ROW_H}"/>
      </g>
      ${outs}
    </g>`);
  }
  return `<g class="ow-conn ow-splitter" data-conn-id="${id}" transform="translate(${r1(c.x)} ${r1(c.y)})">
    ${selected ? selectionMarkup(L) : ''}
    <rect class="ow-split-body ow-drag" data-conn-head="${id}" x="0" y="0" width="${W}" height="${L.height}" rx="4"/>
    ${headMarkup(c, L, c.partNumber || `${c.poles} in, ${c.poles * M} out`)}
    ${groups.join('')}
    ${photoMarkup(c, L)}
  </g>`;
}

// ---------- Wires and cables ----------

function bezierPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

// A curve that leaves each pin straight out from its side.
export function cablePath(a, b) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const reach = clamp(dist * 0.45, 30, 220);
  const c1 = { x: a.x + a.dir.x * reach, y: a.y + a.dir.y * reach };
  const c2 = { x: b.x + b.dir.x * reach, y: b.y + b.dir.y * reach };
  return {
    d: `M ${r1(a.x)} ${r1(a.y)} C ${r1(c1.x)} ${r1(c1.y)} ${r1(c2.x)} ${r1(c2.y)} ${r1(b.x)} ${r1(b.y)}`,
    mid: bezierPoint(a, c1, c2, b, 0.5),
  };
}

const angleOf = (dir) => (Math.atan2(dir.y, dir.x) * 180) / Math.PI;

// A DC barrel plug: a metal sleeve and a round black grip. The sleeve gets
// thicker for a larger outer diameter.
function barrelPlug(point, outer) {
  const k = 1.35;
  const sleeveH = Math.min(9, Math.max(3.5, outer * 1.15));
  const sleeveW = 10;
  const gripW = 20;
  const gripH = sleeveH + 5;
  const along = k * (sleeveW + 1 + gripW / 2);
  return `<g class="ow-plug ow-barrel">
    <g transform="translate(${r1(point.x)} ${r1(point.y)}) rotate(${r1(angleOf(point.dir))}) scale(${k})">
      <rect class="ow-plug-shell" x="1" y="${r1(-sleeveH / 2)}" width="${sleeveW}" height="${r1(sleeveH)}" rx="0.6"/>
      <line class="ow-barrel-ring" x1="4" y1="${r1(-sleeveH / 2)}" x2="4" y2="${r1(sleeveH / 2)}"/>
      <rect class="ow-plug-boot" x="${sleeveW + 1}" y="${r1(-gripH / 2)}" width="${gripW}" height="${r1(gripH)}" rx="${r1(gripH / 2)}"/>
    </g>
    <text class="ow-plug-text" x="${r1(point.x + point.dir.x * along)}" y="${r1(point.y + point.dir.y * along + 0.5)}" dominant-baseline="central">DC</text>
  </g>`;
}

// A small USB plug at the end of a cable. The metal part points into the component.
function usbPlug(point, type, w = null) {
  if (type === 'BARREL') return barrelPlug(point, w ? w.barrelOuter : 5.5);
  const shell = {
    A: { w: 11, h: 9, rx: 0.8 },
    B: { w: 9, h: 9, rx: 2.5 },
    C: { w: 9, h: 5.5, rx: 2.75 },
    MICRO: { w: 7, h: 4, rx: 1 },
    MINI: { w: 8, h: 5, rx: 1.2 },
  }[type] || { w: 10, h: 7, rx: 1 };
  const letter = { A: 'A', B: 'B', C: 'C', MICRO: 'µ', MINI: 'm' }[type] || '';
  const k = 1.35;
  const bootW = 17;
  const bootH = Math.max(shell.h + 4, 10);
  const along = k * (shell.w + 1 + bootW / 2);
  return `<g class="ow-plug">
    <g transform="translate(${r1(point.x)} ${r1(point.y)}) rotate(${r1(angleOf(point.dir))}) scale(${k})">
      <rect class="ow-plug-shell" x="1" y="${-shell.h / 2}" width="${shell.w}" height="${shell.h}" rx="${shell.rx}"/>
      <rect class="ow-plug-boot" x="${shell.w + 1}" y="${-bootH / 2}" width="${bootW}" height="${bootH}" rx="2.5"/>
    </g>
    <text class="ow-plug-text" x="${r1(point.x + point.dir.x * along)}" y="${r1(point.y + point.dir.y * along + 0.5)}" dominant-baseline="central">${letter}</text>
  </g>`;
}

const FLAT_WIDTH = { 15: 13, 22: 9 };

// The end of a CSI/DSI flat cable: a blue stiffener with gold contacts.
function flatEnd(point, code) {
  const w = FLAT_WIDTH[code] || 13;
  const along = 9;
  return `<g class="ow-fpc">
    <g transform="translate(${r1(point.x)} ${r1(point.y)}) rotate(${r1(angleOf(point.dir))})">
      <rect class="ow-stiffener" x="1" y="${-w / 2 - 1}" width="16" height="${w + 2}" rx="1"/>
      <rect class="ow-fpc-contacts" x="1.5" y="${-w / 2}" width="3.2" height="${w}"/>
    </g>
    <text class="ow-fpc-text" x="${r1(point.x + point.dir.x * along + (point.dir.y ? 0 : point.dir.x * 1.5))}" y="${r1(point.y + point.dir.y * along + 0.5)}" dominant-baseline="central">${esc(code)}</text>
  </g>`;
}

// `ends` is { a, b } with absolute points and their directions.
// A lighter color, for the bore of a hose.
function tint(hex, t) {
  const n = Number.parseInt((hex || '#8c9196').slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * t);
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

// A hose clamp near the end of a vacuum line.
function hoseClamp(point, width) {
  return `<g transform="translate(${r1(point.x)} ${r1(point.y)}) rotate(${r1(angleOf(point.dir))})">
    <rect class="ow-clamp" x="15" y="${r1(-width / 2 - 2.2)}" width="4.5" height="${r1(width + 4.4)}" rx="1.2"/>
  </g>`;
}

export function wireMarkup(w, g, ends, selected) {
  const hit = `<path class="ow-hit ow-wire-hit" d="${g.d}"/>`;
  if (isTube(w)) {
    // The hose is wider for a larger outer diameter. The light line is the bore.
    const width = clamp((w.tubeOuter || 7) * 1.1, 5, 13);
    const bore = clamp(width * ((w.tubeInner || 4) / (w.tubeOuter || 7)), 1.2, width - 2);
    const hex = colorInfo(w.color)?.hex || '#202326';
    return `<g class="ow-wire ow-tube" data-wire="${esc(w.id)}">
      ${selected ? `<path class="ow-sel" d="${g.d}" stroke-width="${r1(width + 10)}"/>` : ''}
      <path class="ow-tube-edge" d="${g.d}" stroke-width="${r1(width + 1.8)}"/>
      <path class="ow-tube-core" d="${g.d}" stroke="${hex}" stroke-width="${r1(width)}"/>
      <path class="ow-tube-bore" d="${g.d}" stroke="${tint(hex, w.color === 'BK' ? 0.28 : 0.5)}" stroke-width="${r1(bore)}"/>
      ${hoseClamp(ends.a, width)}${hoseClamp(ends.b, width)}${hit}
    </g>`;
  }
  if (isUsb(w)) {
    return `<g class="ow-wire ow-usb" data-wire="${esc(w.id)}">
      ${selected ? `<path class="ow-sel" d="${g.d}" stroke-width="16"/>` : ''}
      <path class="ow-usb-outline" d="${g.d}"/>
      <path class="ow-usb-core" d="${g.d}"/>
      <path class="ow-usb-shine" d="${g.d}" transform="translate(0 -1)"/>
      ${usbPlug(ends.a, w.usbA, w)}${usbPlug(ends.b, w.usbB, w)}${hit}
    </g>`;
  }
  if (isFlat(w)) {
    const width = Math.max(FLAT_WIDTH[w.flatA] || 13, FLAT_WIDTH[w.flatB] || 13);
    return `<g class="ow-wire ow-flat" data-wire="${esc(w.id)}">
      ${selected ? `<path class="ow-sel" d="${g.d}" stroke-width="${width + 10}"/>` : ''}
      <path class="ow-flat-edge" d="${g.d}" stroke-width="${width + 1.6}"/>
      <path class="ow-flat-core" d="${g.d}" stroke-width="${width}"/>
      <path class="ow-flat-trace" d="${g.d}"/>
      ${flatEnd(ends.a, w.flatA)}${flatEnd(ends.b, w.flatB)}${hit}
    </g>`;
  }
  const core = colorInfo(w.color)?.hex || '#8c9196';
  const stripe = w.stripe ? colorInfo(w.stripe)?.hex : null;
  return `<g class="ow-wire" data-wire="${esc(w.id)}">
    ${selected ? `<path class="ow-sel" d="${g.d}" stroke-width="14"/>` : ''}
    <path class="ow-wire-outline" d="${g.d}"/>
    <path class="ow-wire-core" d="${g.d}" stroke="${core}"/>
    ${stripe ? `<path class="ow-wire-stripe" d="${g.d}" stroke="${stripe}"/>` : ''}
    ${hit}
  </g>`;
}

// The label in the middle of a wire: name, gauge (or cable type) and length.
export function labelMarkup(w, g) {
  const kind = wireKindText(w);
  const kindPart = kind ? `<tspan class="ow-label-kind" dx="5">${esc(kind)}</tspan>` : '';
  const length = isPositive(w.length) ? `<tspan dx="5">${esc(formatLength(w.length))} mm</tspan>` : '';
  return `<g class="ow-wlabel" data-wire="${esc(w.id)}" transform="translate(${r1(g.mid.x)} ${r1(g.mid.y)})">
    <rect class="ow-label-bg" rx="3"/>
    <text class="ow-label" text-anchor="middle" dominant-baseline="central"><tspan class="ow-label-ref">${esc(w.ref)}</tspan>${kindPart}${length}</text>
  </g>`;
}
