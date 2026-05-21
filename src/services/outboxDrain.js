/**
 * @file outboxDrain.js
 * @description Drain logic untuk outbox queue.
 *
 * Memanggil API call yang sesuai untuk setiap entry:
 *   - patch_position → updateDraftPosition (sudah ada retry+coalesce di dalamnya)
 *
 * Trigger drain:
 *   - App mount (useOutboxDrain)
 *   - window 'online' event
 *   - Socket reconnect
 *
 * Listener "dropped" di-emit kalau entry mencapai MAX_DRAIN_ATTEMPTS dan harus
 * di-rollback secara state. UI bisa subscribe untuk trigger refetch.
 */

import { outbox } from './outbox';
import { updateDraftPosition } from '../features/groups/api/groupSignatureService';
import { createLogger } from '../utils/logger';

const log = createLogger('outboxDrain');

// [M-7] Concurrency limit untuk drain. Sebelumnya serial — kalau 1 entry
// slow (mis. timeout 5s), semua entry behind block. Sekarang batch parallel
// dengan limit 3 — tetap konservatif untuk avoid thundering herd, tapi
// 1 slow entry tidak block 4 lain.
const DRAIN_CONCURRENCY = 3;

let isDraining = false;
const droppedSubscribers = new Set();

function emitDropped(entry) {
  droppedSubscribers.forEach((cb) => {
    try { cb(entry); } catch (e) { log.error('dropped cb error:', e?.message); }
  });
}

export function onOutboxDropped(cb) {
  droppedSubscribers.add(cb);
  return () => droppedSubscribers.delete(cb);
}

// [FIX] Status code yang menandakan permanent failure — retry sia-sia.
// 408 (timeout) & 429 (rate limit) DI-RETRY karena bersifat transient dari sisi
// server. Selain itu, semua 4xx adalah hasil validasi/forbidden permanent.
const PERMANENT_STATUSES = new Set([400, 401, 403, 404, 409, 410, 422]);

function isPermanentFailure(err) {
  return typeof err?.status === 'number' && PERMANENT_STATUSES.has(err.status);
}

async function drainEntry(entry) {
  if (entry.type !== 'patch_position') {
    log.warn('unknown type, dropping:', entry.type);
    outbox.remove(entry.id);
    return;
  }
  try {
    await updateDraftPosition(entry.signatureId, entry.payload);
    outbox.remove(entry.id);
  } catch (err) {
    if (err?.name === 'AbortError') {
      // Coalesced — entry tetap ada untuk dicoba lagi nanti
      return;
    }
    // [FIX] Permanent failure (4xx kecuali 408/429) → drop SEKALI tanpa retry.
    if (isPermanentFailure(err)) {
      log.warn(
        'permanent failure, dropping:', entry.id, entry.signatureId,
        'status=' + err.status, err?.message
      );
      outbox.remove(entry.id);
      emitDropped(entry);
      return;
    }
    const updated = outbox.bumpAttempt(entry.id);
    if (updated && updated.attempts >= outbox.MAX_DRAIN_ATTEMPTS) {
      log.warn('entry exhausted, dropping:', entry.id, entry.signatureId);
      outbox.remove(entry.id);
      emitDropped(entry);
    }
  }
}

/**
 * Drain semua entry dengan concurrency limit (DRAIN_CONCURRENCY).
 * Aman dipanggil berkali-kali — guard isDraining mencegah overlap.
 *
 * [M-7] Pakai chunked batches dengan Promise.allSettled supaya:
 * - 1 entry slow tidak block lainnya (parallel within batch)
 * - Server tidak overwhelmed (limit 3 concurrent)
 * - allSettled (bukan all) supaya 1 reject tidak abort batch
 */
export async function drainOutbox() {
  if (isDraining) return;
  isDraining = true;
  try {
    const entries = outbox.getAll();
    if (entries.length === 0) return;

    log.info('draining', entries.length, 'entries with concurrency', DRAIN_CONCURRENCY);

    // Process in batches of DRAIN_CONCURRENCY
    for (let i = 0; i < entries.length; i += DRAIN_CONCURRENCY) {
      const batch = entries.slice(i, i + DRAIN_CONCURRENCY);
      // Filter entries yang masih ada (bisa jadi sudah dihapus oleh proses
      // lain antara getAll() awal dan batch ini diproses)
      const stillExisting = batch.filter((entry) =>
        outbox.getAll().find((e) => e.id === entry.id)
      );
      if (stillExisting.length === 0) continue;

      await Promise.allSettled(stillExisting.map((entry) => drainEntry(entry)));
    }
  } finally {
    isDraining = false;
  }
}
