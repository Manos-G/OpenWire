// Pictures: read a picture file, make it smaller, and show it in the drawing.
//
// OpenWire keeps each picture inside the project file as text (a data URL),
// so the project stays one file. Large photos are made smaller first:
// a phone photo of 4 MB becomes approximately 100 to 300 kB.

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
