/**
 * @file idempotencyKey.js
 * @description Helper untuk membentuk Idempotency-Key yang stabil per
 *   request final signing. Key dipakai backend supaya retry/double-click
 *   tidak membuat job ganda. Lihat
 *   docs/pdf-signing-worker-queue-implementation.md (section "Idempotency
 *   Key" + "Idempotency di Frontend").
 *
 * Format key:
 *   - personal: personal-sign:{documentId}:{draftHash}
 *   - package : package-sign:{packageId}:{draftHash}
 *   - group   : group-finalize:{groupId}:{documentId}:{auditTrailMode}
 *
 * `draftHash` = SHA-256 (hex) dari canonical JSON payload signature:
 *   - Object key di-sort ascending recursive.
 *   - Array order dipertahankan (urutan signer matter).
 *   - Number coordinate / width / height dibulatkan ke 4 desimal supaya
 *     drag/resize sub-pixel tidak menghasilkan key berbeda untuk submit
 *     yang user persepsikan sama.
 *   - Field text bebas (nama signer, dll) tidak ikut karena yang menjadi
 *     ground truth itu position + size + image url.
 */

/**
 * Stable stringify: object key sort recursive, array preserve order.
 */
const stableStringify = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

const COORDINATE_FIELDS = new Set([
  "positionX",
  "positionY",
  "width",
  "height",
]);

const round4 = (n) =>
  Number.isFinite(n) ? Math.round(Number(n) * 10000) / 10000 : n;

/**
 * Bulatkan field koordinat di signature object (recursive).
 */
const normalizeSignatureGeometry = (sig) => {
  if (!sig || typeof sig !== "object") return sig;
  const out = {};
  for (const k of Object.keys(sig)) {
    const v = sig[k];
    if (COORDINATE_FIELDS.has(k) && typeof v === "number") {
      out[k] = round4(v);
    } else {
      out[k] = v;
    }
  }
  return out;
};

/**
 * Hex-encode ArrayBuffer.
 */
const bufferToHex = (buffer) => {
  const arr = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < arr.length; i++) {
    hex += arr[i].toString(16).padStart(2, "0");
  }
  return hex;
};

/**
 * @returns {Promise<string>} sha256 hex.
 */
async function sha256Hex(input) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufferToHex(digest);
}

/**
 * @param {Array<object>} signatures - Slim signature payload (id boleh lokal).
 * @returns {Promise<string>} draftHash sha256 hex.
 */
export async function buildDraftHash(signatures) {
  const normalized = (signatures || []).map(normalizeSignatureGeometry);
  return sha256Hex(stableStringify(normalized));
}

/**
 * @param {string} documentId
 * @param {Array<object>} signatures
 */
export async function buildPersonalIdempotencyKey(documentId, signatures) {
  const draftHash = await buildDraftHash(signatures);
  return `personal-sign:${documentId}:${draftHash}`;
}

/**
 * @param {string} packageId
 * @param {Array<object>} signatures - Flat array dari semua signature
 *   (gabungan semua dokumen di paket).
 */
export async function buildPackageIdempotencyKey(packageId, signatures) {
  const draftHash = await buildDraftHash(signatures);
  return `package-sign:${packageId}:${draftHash}`;
}

/**
 * @param {string|number} groupId
 * @param {string} documentId
 * @param {"embedded"|"separate"|"none"} auditTrailMode
 */
export function buildGroupFinalizeIdempotencyKey(groupId, documentId, auditTrailMode) {
  return `group-finalize:${groupId}:${documentId}:${auditTrailMode || "embedded"}`;
}

export default {
  buildDraftHash,
  buildPersonalIdempotencyKey,
  buildPackageIdempotencyKey,
  buildGroupFinalizeIdempotencyKey,
};
