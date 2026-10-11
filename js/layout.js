// Size and pin positions of connectors and splitters. No DOM access.
//
// A connector has four sides. Each side has groups of pins. The pins of the
// left and right sides go down the box. The pins of the top and bottom sides
// go across it. The box gets wider and taller when it needs more space.
//
// From top to bottom a connector is:
//   top pins (if any) | dark name bar | left and right pins | photo | bottom pins (if any)

import { findImage, isSplitter, pictureView, splitterPin } from './model.js';

export const BOX_W = 176;
export const HEAD_H = 30;
export const ROW_H = 22; // Distance between pins on the left and right sides.
export const COL_W = 24; // Distance between pins on the top and bottom sides.
export const GROUP_GAP = 8; // Space between two groups on one side.
export const PAD = 6;
export const HOUSING = 22; // Depth of the connector graphic from the edge.
export const LABEL_ZONE = 62; // Space for the names of top and bottom pins.
const TWO_SIDE_W = 232; // Minimum width when pins are on the left and the right.
const PHOTO_PAD = 6;
const PHOTO_MAX_H = 150;

export const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
};

// Places the groups of one side along the side. A group with no pins still
// gets one place, so that you can see it.
function placeGroups(groups, pitch) {
  let pos = 0;
  const items = groups.map((group, i) => {
    if (i) pos += GROUP_GAP;
    const slots = Math.max(1, group.pins.length);
    const item = {
      group,
      start: pos,
      end: pos + slots * pitch,
      pins: group.pins.map((pin, k) => ({ pin, at: pos + (k + 0.5) * pitch })),
    };
    pos += slots * pitch;
    return item;
  });
  return { items, length: pos };
}

// Space for the names of the top or bottom pins: as long as the longest name,
// but not more than LABEL_ZONE.
const CHAR_W = 5.7;
function labelSpace(groups) {
  let longest = 0;
  for (const g of groups) {
    const typed = (g.type || 'generic') !== 'generic';
    for (const pin of g.pins) {
      const length = (pin.label || '').length * CHAR_W + (typed ? 14 : 0) + (pin.role ? 20 : 0);
      longest = Math.max(longest, length);
    }
  }
  return Math.round(Math.min(LABEL_ZONE, Math.max(10, longest + 10)));
}

function photoSize(c, project, width) {
  const img = project ? findImage(project, c.image) : null;
  if (!img) return null;
  const view = pictureView(img, c.photoRotation, c.photoCrop);
  const w = width - PHOTO_PAD * 2;
  const h = Math.round(Math.min(PHOTO_MAX_H, (w * view.height) / view.width));
  return { img, width: w, height: h };
}

// Returns { width, height, headY, rowsTop, rowsBottom, groups, pins, photo }.
// `pins` maps a pin number to { x, y, side, dir } relative to the top left corner.
export function layoutComponent(c, project = null) {
  return isSplitter(c) ? layoutSplitter(c, project) : layoutConnector(c, project);
}

function layoutConnector(c, project) {
  const s = c.sides;
  const L = placeGroups(s.left, ROW_H);
  const R = placeGroups(s.right, ROW_H);
  const T = placeGroups(s.top, COL_W);
  const B = placeGroups(s.bottom, COL_W);

  const width = Math.max(s.left.length && s.right.length ? TWO_SIDE_W : BOX_W, T.length + 2 * PAD + 16, B.length + 2 * PAD + 16);
  const topLabels = s.top.length ? labelSpace(s.top) : 0;
  const bottomLabels = s.bottom.length ? labelSpace(s.bottom) : 0;
  const topZone = s.top.length ? HOUSING + topLabels : 0;
  const headY = topZone;
  const rowsTop = headY + HEAD_H;
  const sideLength = Math.max(L.length, R.length);
  const rowsHeight = sideLength ? sideLength + 2 * PAD : s.top.length || s.bottom.length ? 8 : ROW_H;
  const rowsBottom = rowsTop + rowsHeight;
  const photoInfo = photoSize(c, project, width);
  const photo = photoInfo ? { ...photoInfo, x: PHOTO_PAD, y: rowsBottom + PHOTO_PAD } : null;
  const bottomStart = rowsBottom + (photo ? photo.height + PHOTO_PAD * 2 : 0);
  const bottomZone = s.bottom.length ? HOUSING + bottomLabels : 0;
  const height = bottomStart + bottomZone;

  const pins = new Map();
  const groups = [];
  const topOffset = (width - T.length) / 2;
  const bottomOffset = (width - B.length) / 2;
  const sides = [
    ['left', L, (at) => ({ x: 0, y: rowsTop + PAD + at }), rowsTop + PAD],
    ['right', R, (at) => ({ x: width, y: rowsTop + PAD + at }), rowsTop + PAD],
    ['top', T, (at) => ({ x: topOffset + at, y: 0 }), topOffset],
    ['bottom', B, (at) => ({ x: bottomOffset + at, y: height }), bottomOffset],
  ];
  for (const [side, placed, point, offset] of sides) {
    for (const item of placed.items) {
      const groupPins = item.pins.map(({ pin, at }) => {
        const p = { ...point(at), side, dir: DIRS[side], at: offset + at, pin };
        pins.set(pin.n, p);
        return p;
      });
      groups.push({ side, group: item.group, from: offset + item.start, to: offset + item.end, pins: groupPins });
    }
  }

  return {
    width,
    height,
    headY,
    rowsTop,
    rowsBottom,
    bottomStart,
    topZone,
    bottomZone,
    groups,
    pins,
    photo,
    twoSided: Boolean(s.left.length && s.right.length),
  };
}

function layoutSplitter(c, project) {
  const width = BOX_W;
  const rowsTop = HEAD_H;
  const rowsBottom = rowsTop + c.poles * c.outputs * ROW_H;
  const photoInfo = photoSize(c, project, width);
  const photo = photoInfo ? { ...photoInfo, x: PHOTO_PAD, y: rowsBottom + PHOTO_PAD } : null;
  const height = rowsBottom + (photo ? photo.height + PHOTO_PAD * 2 : 0);
  const pins = new Map();
  for (let n = 1; n <= c.pins.length; n += 1) {
    const s = splitterPin(c, n);
    const y =
      s.role === 'in'
        ? rowsTop + (s.pole + 0.5) * c.outputs * ROW_H
        : rowsTop + (s.pole * c.outputs + s.index + 0.5) * ROW_H;
    const side = s.role === 'in' ? 'left' : 'right';
    pins.set(n, { x: side === 'left' ? 0 : width, y, side, dir: DIRS[side] });
  }
  return { width, height, headY: 0, rowsTop, rowsBottom, groups: [], pins, photo };
}

// Absolute position and direction of a pin, or null.
export function pinAnchor(c, n, project = null, layout = null) {
  const p = (layout || layoutComponent(c, project)).pins.get(n);
  return p ? { x: c.x + p.x, y: c.y + p.y, dir: p.dir, side: p.side } : null;
}
