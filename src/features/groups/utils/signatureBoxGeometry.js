/**
 * @file signatureBoxGeometry.js
 * @description Constants & pure utility functions untuk konversi koordinat
 *   signature box di group signing.
 *
 * COORD MODEL:
 * Backend store `positionX/Y/width/height` sebagai fraksi 0-1 dari halaman PDF.
 * Komponen render convert fraksi ↔ pixel.
 *
 * Padding visual untuk handle resize: 12px CSS padding + 1px border = 13px
 * per sisi (CONTENT_OFFSET). Total reduction: 26px (TOTAL_REDUCTION).
 * Inner image (yang disimpan di DB) = outer box - TOTAL_REDUCTION.
 */

export const CSS_PADDING = 12;
export const CSS_BORDER = 1;
export const CONTENT_OFFSET = CSS_PADDING + CSS_BORDER;
export const TOTAL_REDUCTION = CONTENT_OFFSET * 2;

/**
 * Hitung inner aspect ratio dari outer box dimensions.
 * @param {number} outerW
 * @param {number} outerH
 * @returns {number}
 */
export const innerRatioFromBox = (outerW, outerH) => {
  const innerW = Math.max(1, outerW - TOTAL_REDUCTION);
  const innerH = Math.max(1, outerH - TOTAL_REDUCTION);
  return innerW / innerH;
};

/**
 * Hitung outer height dari outer width berdasarkan inner aspect ratio.
 * Padding-aware: outer→inner→outer conversion supaya konsisten.
 * @param {number} outerW
 * @param {number} ratio - inner aspect ratio
 * @returns {number}
 */
export const outerHeightFromOuterWidth = (outerW, ratio) => {
  const innerW = Math.max(1, outerW - TOTAL_REDUCTION);
  const innerH = innerW / (ratio || 1);
  return Math.max(1, innerH + TOTAL_REDUCTION);
};

/**
 * Linear interpolation.
 */
export const lerp = (from, to, amount) => from + (to - from) * amount;

/**
 * Tulis box (x, y, w, h) ke DOM element via direct style mutation.
 * Bypass React reconciliation — dipakai untuk drag/resize 60fps.
 */
export const writeBoxToDom = (element, box) => {
  element.style.width = `${box.w}px`;
  element.style.height = `${box.h}px`;
  element.style.transform = `translate(${box.x}px, ${box.y}px)`;
};

/**
 * Schedule box write ke next animation frame, dengan coalescing kalau sudah
 * ada frame pending. Dipakai resize handler untuk batasi DOM write ke ~60fps
 * walau interact.js fire move event lebih cepat.
 */
export const scheduleBoxWrite = (frameRef, pendingRef, element, box) => {
  pendingRef.current = box;
  if (frameRef.current) return;
  frameRef.current = requestAnimationFrame(() => {
    frameRef.current = null;
    const nextBox = pendingRef.current;
    pendingRef.current = null;
    if (nextBox) writeBoxToDom(element, nextBox);
  });
};

/**
 * Konversi fraksi backend (0-1) → outer pixel position+size.
 */
export const fractionToOuterBox = (frac, parentRect) => ({
  x: frac.positionX * parentRect.width - CONTENT_OFFSET,
  y: frac.positionY * parentRect.height - CONTENT_OFFSET,
  w: frac.width * parentRect.width + TOTAL_REDUCTION,
  h: frac.height * parentRect.height + TOTAL_REDUCTION,
});

/**
 * Konversi outer pixel box → fraksi backend (0-1).
 */
export const outerBoxToFraction = (box, parentRect) => ({
  positionX: (box.x + CONTENT_OFFSET) / parentRect.width,
  positionY: (box.y + CONTENT_OFFSET) / parentRect.height,
  width: (box.w - TOTAL_REDUCTION) / parentRect.width,
  height: (box.h - TOTAL_REDUCTION) / parentRect.height,
});

/**
 * Throttle leading-only — sama dengan utils/throttle.js project lama yang
 * terbukti work smooth.
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
