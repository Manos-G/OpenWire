// Crop window. It shows the turned picture with a frame. Drag the frame or its
// corners, then click Apply. The crop is kept as fractions of the original picture.

import { pictureView } from './model.js';
import { cropFromView, cropToView, pictureUrl } from './images.js';

const MIN_PART = 0.05; // The crop is at least 5% of the picture width and height.

export function openCropDialog(img, { rotation = 0, crop = null, title = 'Crop the picture' } = {}) {
  return new Promise((resolve) => {
    const full = pictureView(img, rotation, null);
    const W = full.width;
    const H = full.height;
    let rect = cropToView(img, rotation, crop);
    const handle = Math.max(W, H) * 0.028;

    const dialog = document.createElement('dialog');
    dialog.className = 'crop-dialog';
    dialog.setAttribute('aria-label', title);
    // The picture element uses the same turn as the drawing, without a crop.
    const r = full.r;
    const move = `translate(${-full.cx} ${-full.cy})`;
    const turn =
      r === 90
        ? `translate(${full.ch} 0) rotate(90) ${move}`
        : r === 180
          ? `translate(${full.cw} ${full.ch}) rotate(180) ${move}`
          : r === 270
            ? `translate(0 ${full.cw}) rotate(270) ${move}`
            : move;
    dialog.innerHTML = `
      <form method="dialog" class="crop-form">
        <h2 class="crop-title">${title}</h2>
        <p class="crop-help">Drag the frame to move it. Drag a corner to change its size.</p>
        <div class="crop-stage">
          <svg class="crop-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
            <image href="${pictureUrl(img)}" x="0" y="0" width="${img.width}" height="${img.height}" transform="${turn}" preserveAspectRatio="none"/>
            <path class="crop-shade" fill-rule="evenodd"/>
            <rect class="crop-frame" data-drag="move"/>
            ${['nw', 'ne', 'sw', 'se'].map((c) => `<rect class="crop-handle" data-drag="${c}" width="${handle * 2}" height="${handle * 2}"/>`).join('')}
          </svg>
        </div>
        <p class="crop-size" aria-live="polite"></p>
        <div class="crop-actions">
          <button type="button" class="button" data-crop="full">Full picture</button>
          <span class="crop-spacer"></span>
          <button type="button" class="button" data-crop="cancel">Cancel</button>
          <button type="submit" class="button primary" data-crop="apply">Apply</button>
        </div>
      </form>`;
    document.body.append(dialog);

    const svg = dialog.querySelector('svg');
    const shade = dialog.querySelector('.crop-shade');
    const frame = dialog.querySelector('.crop-frame');
    const handles = [...dialog.querySelectorAll('.crop-handle')];
    const sizeText = dialog.querySelector('.crop-size');
    const minW = W * MIN_PART;
    const minH = H * MIN_PART;

    function draw() {
      shade.setAttribute('d', `M0 0H${W}V${H}H0Z M${rect.x} ${rect.y}h${rect.w}v${rect.h}h${-rect.w}Z`);
      frame.setAttribute('x', rect.x);
      frame.setAttribute('y', rect.y);
      frame.setAttribute('width', rect.w);
      frame.setAttribute('height', rect.h);
      for (const h of handles) {
        const c = h.dataset.drag;
        h.setAttribute('x', (c.includes('e') ? rect.x + rect.w : rect.x) - handle);
        h.setAttribute('y', (c.includes('s') ? rect.y + rect.h : rect.y) - handle);
      }
      sizeText.textContent = `${Math.round((rect.w / W) * 100)}% × ${Math.round((rect.h / H) * 100)}% of the picture`;
    }

    function toPicture(e) {
      const m = svg.getScreenCTM();
      if (!m) return { x: 0, y: 0 };
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    }

    let drag = null;
    svg.addEventListener('pointerdown', (e) => {
      const kind = e.target.dataset?.drag;
      if (!kind) return;
      e.preventDefault();
      svg.setPointerCapture(e.pointerId);
      drag = { kind, start: toPicture(e), rect: { ...rect } };
    });
    svg.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = toPicture(e);
      const dx = p.x - drag.start.x;
      const dy = p.y - drag.start.y;
      const s = drag.rect;
      let { x, y, w, h } = s;
      if (drag.kind === 'move') {
        x = Math.min(W - w, Math.max(0, s.x + dx));
        y = Math.min(H - h, Math.max(0, s.y + dy));
      } else {
        const right = s.x + s.w;
        const bottom = s.y + s.h;
        if (drag.kind.includes('w')) {
          x = Math.min(right - minW, Math.max(0, s.x + dx));
          w = right - x;
        } else {
          w = Math.min(W - s.x, Math.max(minW, s.w + dx));
        }
        if (drag.kind.includes('n')) {
          y = Math.min(bottom - minH, Math.max(0, s.y + dy));
          h = bottom - y;
        } else {
          h = Math.min(H - s.y, Math.max(minH, s.h + dy));
        }
      }
      rect = { x, y, w, h };
      draw();
    });
    const endDrag = () => {
      drag = null;
    };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    let result = null;
    dialog.addEventListener('click', (e) => {
      const action = e.target.closest('[data-crop]')?.dataset.crop;
      if (action === 'full') {
        rect = { x: 0, y: 0, w: W, h: H };
        draw();
      } else if (action === 'cancel') {
        dialog.close();
      } else if (action === 'apply') {
        result = { crop: cropFromView(img, rotation, rect) };
      }
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });

    draw();
    dialog.showModal();
  });
}
