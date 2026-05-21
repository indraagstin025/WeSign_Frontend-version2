/**
 * @file renderToImage.js
 * @description Utility untuk merender elemen (paraf, stamp, text) ke base64 image.
 * Semua render menggunakan devicePixelRatio untuk hasil tajam di layar retina.
 */

/**
 * [M-3] Cap DPR ke 2 (cukup untuk retina display 2x dan 3x).
 *
 * Sebelumnya `Math.max(devicePixelRatio || 1, 3)` — minimal 3x.
 * Issue: di Mac retina dengan DPR=3, ini render canvas 3x×3x = 9x area
 * dari size logical. Memory cost untuk PNG 1000×400 jadi:
 *   - logical: 1000×400 = 400K pixel × 4 bytes = 1.6 MB raw
 *   - 3x DPR:  3000×1200 = 3.6M pixel × 4 bytes = 14.4 MB raw (9x bloat)
 *   - 2x DPR:  2000×800 = 1.6M pixel × 4 bytes = 6.4 MB raw (4x bloat)
 *
 * Visual difference 2x vs 3x di layar 3x: minimal (sub-pixel rendering
 * sudah cukup tajam). Tradeoff: 9x memory tidak worth it.
 *
 * Floor 1.5x agar layar non-retina (DPR=1) tetap dapat oversampling
 * sedikit untuk anti-aliasing yang lebih halus.
 */
const DPR = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2);

/**
 * Render inisial/paraf ke canvas → base64
 */
export function renderInitialsToImage(initials, { color = '#334155', fontStyle = 'bold', fontSize = 48 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Render pada ukuran besar agar tajam
  const renderSize = fontSize * 2;

  const fontMap = {
    bold: `bold ${renderSize}px Inter, sans-serif`,
    dotted: `bold ${renderSize * 0.85}px Inter, sans-serif`,
    italic: `italic ${renderSize}px Inter, sans-serif`,
    script: `italic ${renderSize}px 'Dancing Script', cursive`,
  };

  const font = fontMap[fontStyle] || fontMap.bold;
  ctx.font = font;

  const metrics = ctx.measureText(initials);
  const textWidth = metrics.width;
  const textHeight = renderSize * 1.2;

  const padding = 30;
  const logicalWidth = textWidth + padding * 2;
  const logicalHeight = textHeight + padding * 2;

  canvas.width = logicalWidth * DPR;
  canvas.height = logicalHeight * DPR;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;
  ctx.scale(DPR, DPR);

  ctx.clearRect(0, 0, logicalWidth, logicalHeight);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, logicalWidth / 2, logicalHeight / 2);

  return canvas.toDataURL('image/png');
}

/**
 * Render stamp ke canvas → base64
 */
export function renderStampToImage(label, { color = '#16a34a', borderWidth = 3 } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Render pada ukuran besar agar tajam
  const fontSize = 36;
  const font = `bold ${fontSize}px Inter, sans-serif`;
  ctx.font = font;

  const metrics = ctx.measureText(label);
  const textWidth = metrics.width;

  const paddingX = 40;
  const paddingY = 24;
  const logicalWidth = textWidth + paddingX * 2;
  const logicalHeight = fontSize + paddingY * 2;
  const renderBorderWidth = borderWidth * 2;

  canvas.width = logicalWidth * DPR;
  canvas.height = logicalHeight * DPR;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;
  ctx.scale(DPR, DPR);

  ctx.clearRect(0, 0, logicalWidth, logicalHeight);

  // Border (rounded rect)
  const radius = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = renderBorderWidth;
  ctx.beginPath();
  ctx.roundRect(renderBorderWidth, renderBorderWidth, logicalWidth - renderBorderWidth * 2, logicalHeight - renderBorderWidth * 2, radius);
  ctx.stroke();

  // Text
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, logicalWidth / 2, logicalHeight / 2);

  return canvas.toDataURL('image/png');
}

/**
 * Render teks anotasi ke canvas → base64
 */
export function renderTextToImage(text, { color = '#334155', fontSize = 14, fontFamily = 'Inter', bold = false, italic = false, underline = false } = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Render pada ukuran 3x lebih besar dari yang diminta agar tajam saat di-scale di PDF
  const renderFontSize = fontSize * 3;

  const fontWeight = bold ? 'bold' : 'normal';
  const fontStyleStr = italic ? 'italic' : 'normal';
  const font = `${fontStyleStr} ${fontWeight} ${renderFontSize}px ${fontFamily}, sans-serif`;
  ctx.font = font;

  const lines = text.split('\n');
  const lineHeight = renderFontSize * 1.5;
  
  let maxWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxWidth) maxWidth = w;
  }

  const padding = 20;
  const logicalWidth = maxWidth + padding * 2;
  const logicalHeight = lines.length * lineHeight + padding * 2;

  // Set canvas ke resolusi tinggi
  canvas.width = logicalWidth * DPR;
  canvas.height = logicalHeight * DPR;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;
  ctx.scale(DPR, DPR);

  ctx.clearRect(0, 0, logicalWidth, logicalHeight);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    const y = padding + i * lineHeight;
    ctx.fillText(line, padding, y);

    if (underline) {
      const w = ctx.measureText(line).width;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.moveTo(padding, y + renderFontSize + 3);
      ctx.lineTo(padding + w, y + renderFontSize + 3);
      ctx.stroke();
    }
  });

  return canvas.toDataURL('image/png');
}
