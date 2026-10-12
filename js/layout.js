// Size and pin positions of connectors and splitters. No DOM access.
//
// A connector has four sides. Each side has groups of pins. The pins of the
// left and right sides go down the box. The pins of the top and bottom sides
// go across it. The box gets wider and taller when it needs more space.
//
// From top to bottom a connector is:
//   top pins (if any) | dark name bar | left and right pins | photo | bottom pins (if any)

import { connectorTypeName, findImage, isSplitter, pictureView, splitterPin } from './model.js';

export const BOX_W = 176;
export const HEAD_H = 30;
export const ROW_H = 22; // Distance between pins on the left and right sides.
export const COL_W = 24; // Distance between pins on the top and bottom sides.
export const GROUP_GAP = 8; // Space between two groups on one side.
export const PAD = 6;
export const HOUSING = 22; // Depth of the connector graphic from the edge.
export const LABEL_ZONE = 62; // Space for the names of top and bottom pins.
export const CAPTION_H = 14; // Space for the name of a pin group.

// The text that the drawing shows for a pin group: its name and its type.
// A generic group without a name shows no text.
export function groupCaption(group) {
  const name = (group.name || '').trim();
  const type = group.type && group.type !== 'generic' ? connectorTypeName(group.type) : '';
  if (name && type) return `${name} · ${type}`;
  return name || type;
}
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
// On the left and right sides, the name of a group goes above its pins.
function placeGroups(groups, pitch, captionAbove = false) {
  let pos = 0;
  const items = groups.map((group, i) => {
    if (i) pos += GROUP_GAP;
    const caption = groupCaption(group);
    let captionAt = null;
    if (caption && captionAbove) {
      captionAt = pos + CAPTION_H / 2;
      pos += CAPTION_H;
    }
    const slots = Math.max(1, group.pins.length);
    // On the top and bottom sides, a group is at least as wide as its name.
    // The pins stay together in the middle of the group.
    const span = Math.max(slots * pitch, !captionAbove && caption ? Math.min(150, caption.length * 5.4 + 10) : 0);
    const inset = (span - slots * pitch) / 2;
    const item = {
      group,
      caption,
      captionAt,
      start: pos,
      end: pos + span,
      pins: group.pins.map((pin, k) => ({ pin, at: pos + inset + (k + 0.5) * pitch })),
    };
    pos += span;
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

// Width of the pin names of the left or right side, when a photo is in the middle.
function sideColumn(groups) {
  let longest = 0;
  for (const g of groups) {
    const typed = (g.type || 'generic') !== 'generic';
    for (const pin of g.pins) {
      longest = Math.max(longest, (pin.label || '').length * CHAR_W + (typed ? 14 : 0) + (pin.role ? 24 : 0));
    }
    longest = Math.max(longest, groupCaption(g).length * 5.2 - HOUSING);
  }
  return Math.round(Math.min(150, Math.max(70, HOUSING + 12 + longest)));
}

const PHOTO_W = 150; // Width of a photo in the middle of a connector.

// Size of the graphic of a mini vacuum pump or a suction cup.
const DECO = { pump: { w: 100, h: 54 }, cup: { w: 78, h: 62 } };

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
  const L = placeGroups(s.left, ROW_H, true);
  const R = placeGroups(s.right, ROW_H, true);
  const T = placeGroups(s.top, COL_W);
  const B = placeGroups(s.bottom, COL_W);

  // A photo goes in the middle, between the names of the left and right pins.
  // A photo goes in the middle. Without a photo, a pump or a suction cup shows its graphic there.
  const img = project ? findImage(project, c.image) : null;
  const view = img ? pictureView(img, c.photoRotation, c.photoCrop) : null;
  const decoSize = img ? null : DECO[c.shape] || null;
  const inside = Boolean(img || decoSize);
  const leftNames = inside && s.left.length ? sideColumn(s.left) : 0;
  const rightNames = inside && s.right.length ? sideColumn(s.right) : 0;
  const width = Math.max(
    s.left.length && s.right.length ? TWO_SIDE_W : BOX_W,
    T.length + 2 * PAD + 16,
    B.length + 2 * PAD + 16,
    inside ? leftNames + rightNames + (img ? PHOTO_W : decoSize.w) + 2 * PHOTO_PAD : 0,
  );
  const twoSided = Boolean(s.left.length && s.right.length);
  const leftCol = inside ? leftNames : twoSided ? width / 2 : width;
  const rightCol = inside ? rightNames : twoSided ? width / 2 : width;
  const topLabels = s.top.length ? labelSpace(s.top) : 0;
  const bottomLabels = s.bottom.length ? labelSpace(s.bottom) : 0;
  // On the top and bottom sides, the group names go next to the connector graphic.
  const topCaption = T.items.some((i) => i.caption) ? CAPTION_H : 0;
  const bottomCaption = B.items.some((i) => i.caption) ? CAPTION_H : 0;
  const topZone = s.top.length ? HOUSING + topCaption + topLabels : 0;
  const headY = topZone;
  const rowsTop = headY + HEAD_H;
  const sideLength = Math.max(L.length, R.length);
  let photo = null;
  if (img) {
    // The photo fits in the middle column, not higher than PHOTO_MAX_H.
    const room = width - leftCol - rightCol - 2 * PHOTO_PAD;
    let w = Math.min(room, 220);
    let h = (w * view.height) / view.width;
    if (h > PHOTO_MAX_H) {
      h = PHOTO_MAX_H;
      w = (h * view.width) / view.height;
    }
    photo = { img, width: Math.round(w), height: Math.round(h), x: Math.round(leftCol + PHOTO_PAD + (room - w) / 2), y: 0 };
  }
  let deco = null;
  if (decoSize) {
    const room = width - leftCol - rightCol - 2 * PHOTO_PAD;
    deco = { shape: c.shape, width: decoSize.w, height: decoSize.h, x: Math.round(leftCol + PHOTO_PAD + (room - decoSize.w) / 2), y: 0 };
  }
  const pinsHeight = sideLength ? sideLength + 2 * PAD : s.top.length || s.bottom.length ? 8 : ROW_H;
  const rowsHeight = Math.max(pinsHeight, photo ? photo.height + 2 * PHOTO_PAD : 0, deco ? deco.height + 2 * PHOTO_PAD : 0);
  const rowsBottom = rowsTop + rowsHeight;
  if (photo) photo.y = Math.round(rowsTop + (rowsHeight - photo.height) / 2);
  if (deco) deco.y = Math.round(rowsTop + (rowsHeight - deco.height) / 2);
  const bottomStart = rowsBottom;
  const bottomZone = s.bottom.length ? HOUSING + bottomCaption + bottomLabels : 0;
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
      groups.push({
        side,
        group: item.group,
        caption: item.caption,
        captionAt: item.captionAt === null ? null : offset + item.captionAt,
        from: offset + item.start,
        to: offset + item.end,
        pins: groupPins,
      });
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
    topCaption,
    bottomCaption,
    groups,
    pins,
    photo,
    photoInside: Boolean(photo),
    deco,
    leftCol,
    rightCol,
    twoSided,
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
