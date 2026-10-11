// Pictures: read a picture file, make it smaller, and show it in the drawing.
//
// OpenWire keeps each picture inside the project file as text (a data URL),
// so the project stays one file. Large photos are made smaller first:
// a phone photo of 4 MB becomes approximately 100 to 300 kB.

import { pictureView } from './model.js';

export const PHOTO_MAX_SIZE = 900; // Connector photos, longest side in pixels.
export const BACKGROUND_MAX_SIZE = 2400; // Background pictures, longest side in pixels.
const MAX_FILE_BYTES = 40 * 1024 * 1024;
const JPEG_QUALITY = 0.85;

export function isImageFile(file) {
  return Boolean(file) && (/^image\//.test(file.type) || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(file.name));
}

// Asks for a picture. On phones the browser also offers the camera.
// Returns the file, or null when the user cancels.
export function pickImageFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
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

function loadWithElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 1000;
      const height = img.naturalHeight || 1000;
      resolve({ source: img, width, height, release: () => URL.revokeObjectURL(url) });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('unreadable'));
    };
    img.src = url;
  });
}

async function decode(file) {
  // createImageBitmap turns the photo the correct way up (EXIF orientation).
  if (typeof createImageBitmap === 'function' && !/svg/i.test(file.type)) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      /* Try again with an image element. */
    }
  }
  return loadWithElement(file);
}

function hasTransparency(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

// Reads a picture file. Returns { name, width, height, data }.
export async function loadPicture(file, maxSize) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('The picture is too large. Use a picture that is smaller than 40 MB.');
  }
  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new Error('OpenWire cannot read this picture. Use a JPEG or PNG picture.');
  }
  try {
    const scale = Math.min(1, maxSize / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(decoded.source, 0, 0, width, height);
    // Photos become JPEG. Pictures with transparent areas, such as logos, stay PNG.
    const keepPng = !/jpe?g/i.test(file.type) && hasTransparency(ctx, width, height);
    const data = keepPng ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const name = file.name.replace(/\.[^.]+$/, '') || 'Picture';
    return { name, width, height, data };
  } finally {
    decoded.release();
  }
}

// ---------- Showing pictures ----------
// The drawing uses short blob: addresses, not the long data text, so the browser
// does not read the picture again each time the drawing changes.

const urls = new Map();

function dataToBlob(data) {
  const comma = data.indexOf(',');
  const type = data.slice(5, data.indexOf(';'));
  const binary = atob(data.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function pictureUrl(image) {
  if (!image?.data) return '';
  const key = `${image.data.length}:${image.data.slice(-48)}`;
  let url = urls.get(key);
  if (!url) {
    try {
      url = URL.createObjectURL(dataToBlob(image.data));
    } catch {
      url = image.data;
    }
    urls.set(key, url);
  }
  return url;
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Approximate size of a picture in the project file.
export function pictureBytes(image) {
  return image?.data ? Math.round((image.data.length * 3) / 4) : 0;
}

// ---------- Turn and crop ----------
// A picture is drawn inside its own small SVG. The viewBox is the visible part
// after the turn. The transform turns the picture and moves the crop into view.


function viewTransform(v) {
  const move = `translate(${-v.cx} ${-v.cy})`;
  if (v.r === 90) return `translate(${v.ch} 0) rotate(90) ${move}`;
  if (v.r === 180) return `translate(${v.cw} ${v.ch}) rotate(180) ${move}`;
  if (v.r === 270) return `translate(0 ${v.cw}) rotate(270) ${move}`;
  return move;
}

const attr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const r2 = (n) => Math.round(n * 100) / 100;

// The <image> element with the turn and the crop. `id` goes into data-image,
// so the SVG export can put the full picture data in the file.
function imageTag(img, view, id) {
  return `<image${id ? ` data-image="${attr(id)}"` : ''} href="${attr(pictureUrl(img))}" x="0" y="0" width="${img.width}" height="${img.height}"
    transform="${viewTransform(view)}" preserveAspectRatio="none"/>`;
}

// A nested SVG for the drawing, at a position and size in drawing units.
export function pictureSvg(img, { id = '', rotation = 0, crop = null, x, y, width, height, fit = 'xMidYMid meet' }) {
  const view = pictureView(img, rotation, crop);
  return `<svg x="${r2(x)}" y="${r2(y)}" width="${r2(width)}" height="${r2(height)}" viewBox="0 0 ${r2(view.width)} ${r2(view.height)}"
    preserveAspectRatio="${fit}" overflow="hidden">${imageTag(img, view, id)}</svg>`;
}

// A standalone SVG for the Properties panel and the crop window.
export function pictureElement(img, { rotation = 0, crop = null, className = '', label = '' } = {}) {
  const view = pictureView(img, rotation, crop);
  return `<svg class="${className}" viewBox="0 0 ${r2(view.width)} ${r2(view.height)}" preserveAspectRatio="xMidYMid meet"
    role="img" aria-label="${attr(label)}">${imageTag(img, view, '')}</svg>`;
}

// Converts a crop between the original picture and the turned picture
// that you see. Values are in pixels.
export function cropToView(img, rotation, crop) {
  const c = crop || { x: 0, y: 0, w: 1, h: 1 };
  const W = img.width;
  const H = img.height;
  const x = c.x * W;
  const y = c.y * H;
  const w = c.w * W;
  const h = c.h * H;
  switch (pictureView(img, rotation).r) {
    case 90:
      return { x: H - y - h, y: x, w: h, h: w };
    case 180:
      return { x: W - x - w, y: H - y - h, w, h };
    case 270:
      return { x: y, y: W - x - w, w: h, h: w };
    default:
      return { x, y, w, h };
  }
}

export function cropFromView(img, rotation, rect) {
  const W = img.width;
  const H = img.height;
  let o;
  switch (pictureView(img, rotation).r) {
    case 90:
      o = { x: rect.y, y: H - rect.x - rect.w, w: rect.h, h: rect.w };
      break;
    case 180:
      o = { x: W - rect.x - rect.w, y: H - rect.y - rect.h, w: rect.w, h: rect.h };
      break;
    case 270:
      o = { x: W - rect.y - rect.h, y: rect.x, w: rect.h, h: rect.w };
      break;
    default:
      o = { ...rect };
  }
  return { x: o.x / W, y: o.y / H, w: o.w / W, h: o.h / H };
}
