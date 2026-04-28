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

let isDraining = false;
const droppedSubscribers = new Set();

function emitDropped(entry) {
  droppedSubscribers.forEach((cb) => {
    try { cb(entry); } catch (e) { console.error('[outboxDrain] dropped cb error:', e); }
  });
}

export function onOutboxDropped(cb) {
  droppedSubscribers.add(cb);
  return () => droppedSubscribers.delete(cb);
}

async function drainEntry(entry) {
  if (entry.type !== 'patch_position') {
    console.warn('[outboxDrain] unknown type, dropping:', entry.type);
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
    const updated = outbox.bumpAttempt(entry.id);
    if (updated && updated.attempts >= outbox.MAX_DRAIN_ATTEMPTS) {
      console.warn(
        '[outboxDrain] entry exhausted, dropping:', entry.id, entry.signatureId
      );
      outbox.remove(entry.id);
      emitDropped(entry);
    }
  }
}

/**
 * Drain semua entry secara serial (hindari thundering herd ke server).
 * Aman dipanggil berkali-kali — guard isDraining mencegah overlap.
 */
export async function drainOutbox() {
  if (isDraining) return;
  isDraining = true;
  try {
    const entries = outbox.getAll();
    if (entries.length === 0) return;
    console.log('[outboxDrain] draining', entries.length, 'entries');
    for (const entry of entries) {
      // Cek lagi apakah masih ada — bisa jadi sudah dihapus oleh proses lain
      // (mis. user mengulang drag sehingga payload baru menggantikan entry lama).
      if (!outbox.getAll().find((e) => e.id === entry.id)) continue;
      await drainEntry(entry);
    }
  } finally {
    isDraining = false;
  }
}
