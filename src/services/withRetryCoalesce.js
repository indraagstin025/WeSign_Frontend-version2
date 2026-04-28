/**
 * @file withRetryCoalesce.js
 * @description Wrapper retry + coalesce untuk mutation HTTP yang sering
 * dipanggil berulang dengan key sama (mis. PATCH /signature/:id/position
 * saat user drag).
 *
 * Fitur:
 *   - Retry exponential backoff untuk transient errors (5xx/408/429/network).
 *     Tidak retry untuk 4xx (validation/auth/forbidden) — itu permanent.
 *   - Coalesce: kalau request baru datang dengan key yang sama saat yang lama
 *     belum selesai, yang lama di-abort. Mencegah out-of-order writes ke server.
 *   - Lapor status ke saveStatus store agar UI bisa tampilkan "saving"/"saved"/
 *     "error" indicator.
 *
 * Usage:
 *   const result = await withRetryCoalesce(
 *     `patch:position:${signatureId}`,
 *     (signal) => apiFetch(`/path`, { method: 'PATCH', body, signal }),
 *     { retries: 3, baseDelay: 1000, maxDelay: 4000 }
 *   );
 */

import { saveStatus } from './saveStatus';

const inflight = new Map();

const RETRY_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

function isRetryable(err) {
  if (err?.name === 'AbortError') return false;
  if (typeof err?.status === 'number') return RETRY_STATUSES.has(err.status);
  // Network error tanpa status code (offline, DNS gagal, fetch failed)
  return true;
}

export function withRetryCoalesce(key, fn, opts = {}) {
  const {
    retries = 3,
    baseDelay = 1000,
    maxDelay = 4000,
    trackSaveStatus = true,
  } = opts;

  // Coalesce: abort yang lama untuk key yang sama
  const prev = inflight.get(key);
  if (prev) prev.abort();

  const controller = new AbortController();
  inflight.set(key, controller);

  const run = async () => {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (controller.signal.aborted) {
        throw new DOMException('Aborted by coalesce', 'AbortError');
      }
      try {
        return await fn(controller.signal);
      } catch (err) {
        lastErr = err;
        if (err?.name === 'AbortError') throw err;
        if (!isRetryable(err) || attempt >= retries) throw err;
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise((resolve) => {
          const t = setTimeout(resolve, delay);
          controller.signal.addEventListener('abort', () => {
            clearTimeout(t);
            resolve();
          }, { once: true });
        });
      }
    }
    throw lastErr;
  };

  if (trackSaveStatus) saveStatus.begin();

  const promise = run();

  promise.then(
    () => {
      if (trackSaveStatus) saveStatus.end(true);
    },
    (err) => {
      if (!trackSaveStatus) return;
      if (err?.name === 'AbortError') {
        // Bukan failure — request dibatalkan karena ada yang lebih baru
        saveStatus.end(true);
      } else {
        saveStatus.end(false, err?.message || 'Gagal menyimpan');
      }
    }
  );

  promise.finally(() => {
    if (inflight.get(key) === controller) inflight.delete(key);
  });

  return promise;
}

/**
 * Membatalkan semua request in-flight (mis. saat user pindah halaman
 * atau logout).
 */
export function abortAllInflight() {
  inflight.forEach((controller) => controller.abort());
  inflight.clear();
}
