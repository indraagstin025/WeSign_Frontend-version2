/**
 * @file outbox.js
 * @description Persistent outbox queue untuk mutation HTTP yang gagal karena
 * jaringan. Survive page reload (pakai localStorage).
 *
 * Use case: user offline saat drag → updateDraftPosition gagal setelah retry
 * exhausted → enqueue ke outbox → drain saat online event / reconnect / app
 * remount. Posisi tetap aman walaupun user reload tab.
 *
 * Schema entry:
 *   {
 *     id: string,          // unique, untuk dedup & remove
 *     type: 'patch_position',
 *     signatureId: string,
 *     payload: object,     // { positionX, positionY, width, height, pageNumber }
 *     attempts: number,    // berapa kali drain dicoba
 *     createdAt: number,   // ms timestamp
 *     lastTryAt: number,
 *   }
 *
 * Capacity guard: maksimal 200 entry. Kalau penuh, entry tertua dibuang.
 * Setelah `MAX_DRAIN_ATTEMPTS` gagal drain → drop entry + emit event "dropped"
 * supaya caller bisa rollback state.
 */

const STORAGE_KEY = 'wesign_outbox_v1';
const MAX_ENTRIES = 200;
const MAX_DRAIN_ATTEMPTS = 5;

let cache = null;
const subscribers = new Set();

function read() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(cache)) cache = [];
  } catch (e) {
    console.warn('[outbox] read error:', e?.message);
    cache = [];
  }
  return cache;
}

function write(entries) {
  cache = entries;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    if (e?.name === 'QuotaExceededError' && entries.length > 1) {
      // [H-5] Quota exceeded — strategi recovery bertingkat:
      //   1. Pertama, drop oldest half (entries lama yang lebih likely sudah
      //      stale/relevan).
      //   2. Kalau retry write masih gagal (storage benar-benar penuh), clear
      //      semua + emit dropped event supaya caller bisa rollback state UI
      //      (tidak silent hilang seperti sebelumnya).
      const trimmed = entries.slice(Math.floor(entries.length / 2));
      const dropped = entries.slice(0, Math.floor(entries.length / 2));
      cache = trimmed;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        console.warn(
          `[outbox] quota exceeded, dropped ${dropped.length} oldest entries to fit ${trimmed.length} latest`
        );
        // Emit dropped event untuk entry yang dibuang
        dropped.forEach((entry) => emitDropped(entry));
      } catch (e2) {
        // Storage benar-benar penuh atau corrupt — clear all + remove key
        console.error('[outbox] quota exceeded after trim, clearing all:', e2?.message);
        cache = [];
        try { localStorage.removeItem(STORAGE_KEY); } catch (e3) {
          console.error('[outbox] failed to remove storage key:', e3?.message);
        }
        // Emit dropped untuk semua entry yang hilang
        entries.forEach((entry) => emitDropped(entry));
      }
    } else {
      console.warn('[outbox] write error:', e?.message);
    }
  }
  notify();
}

// Dropped event subscribers — caller bisa subscribe untuk dapat notifikasi
// saat entry di-drop karena localStorage quota exceeded (BUKAN drain failure
// — itu di outboxDrain.onOutboxDropped dengan reason berbeda).
const quotaDroppedSubscribers = new Set();

/**
 * Subscribe to quota-dropped events. Dipanggil saat entry di-drop dari
 * localStorage karena `QuotaExceededError` (storage penuh).
 *
 * Caller umumnya akan rollback state UI (signatures kembali ke last-saved
 * position) dan show toast warning ke user.
 */
export function onOutboxQuotaDropped(cb) {
  quotaDroppedSubscribers.add(cb);
  return () => quotaDroppedSubscribers.delete(cb);
}

function emitDropped(entry) {
  quotaDroppedSubscribers.forEach((cb) => {
    try { cb(entry); } catch (err) {
      console.error('[outbox] quota dropped subscriber error:', err?.message);
    }
  });
}

function notify() {
  subscribers.forEach((cb) => {
    try { cb(read()); } catch (e) { console.error('[outbox] subscriber error:', e); }
  });
}

function genId() {
  return `ob_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const outbox = {
  /**
   * Enqueue mutation. Kalau sudah ada entry untuk signatureId+type yang sama,
   * payload-nya di-replace (latest-write-wins) — tidak perlu menyimpan riwayat
   * setiap drag, hanya posisi terakhir.
   */
  enqueue(type, signatureId, payload) {
    const entries = read();
    const existing = entries.find(
      (e) => e.type === type && e.signatureId === signatureId
    );
    if (existing) {
      existing.payload = { ...existing.payload, ...payload };
      existing.lastTryAt = Date.now();
      // Jangan reset attempts — biar tetap bisa "menyerah" di akhirnya
      write(entries);
      return existing;
    }
    const entry = {
      id: genId(),
      type,
      signatureId,
      payload,
      attempts: 0,
      createdAt: Date.now(),
      lastTryAt: 0,
    };
    entries.push(entry);
    if (entries.length > MAX_ENTRIES) entries.shift();
    write(entries);
    return entry;
  },

  remove(id) {
    const entries = read();
    const next = entries.filter((e) => e.id !== id);
    if (next.length !== entries.length) write(next);
  },

  /** Increment attempts counter, persist. Return updated entry. */
  bumpAttempt(id) {
    const entries = read();
    const e = entries.find((x) => x.id === id);
    if (!e) return null;
    e.attempts += 1;
    e.lastTryAt = Date.now();
    write(entries);
    return e;
  },

  getAll() {
    return [...read()];
  },

  size() {
    return read().length;
  },

  clear() {
    write([]);
  },

  subscribe(cb) {
    subscribers.add(cb);
    cb(read());
    return () => subscribers.delete(cb);
  },

  MAX_DRAIN_ATTEMPTS,
};
