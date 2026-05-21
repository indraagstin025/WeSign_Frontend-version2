/**
 * @file saveStatus.js
 * @description Pub/sub store ringan untuk status simpan global ("saving"/
 * "saved"/"error"). Dipakai oleh withRetryCoalesce untuk lapor ke UI dan
 * komponen SaveIndicator untuk render status.
 *
 * State machine:
 *   idle ──begin──▶ saving ──end(true,inflight==0)──▶ saved ──(2.5s)──▶ idle
 *                       │
 *                       └──end(false)──▶ error
 *
 * Counter inflight memastikan banyak request paralel digabungkan jadi satu
 * indikator "saving" sampai semuanya selesai.
 */

let status = 'idle';
let inflightCount = 0;
let lastErrorMessage = null;
let savedTimerId = null;
const subscribers = new Set();

function notify() {
  const snapshot = { status, inflightCount, lastErrorMessage };
  subscribers.forEach((cb) => {
    try { cb(snapshot); } catch (e) { console.error('[saveStatus] subscriber error:', e); }
  });
}

export const saveStatus = {
  begin() {
    inflightCount += 1;
    status = 'saving';
    if (savedTimerId) { clearTimeout(savedTimerId); savedTimerId = null; }
    notify();
  },

  end(success = true, errorMessage = null) {
    inflightCount = Math.max(0, inflightCount - 1);
    if (!success) {
      status = 'error';
      lastErrorMessage = errorMessage;
    } else if (inflightCount === 0) {
      status = 'saved';
      lastErrorMessage = null;
      // Auto kembali ke idle setelah 2.5s supaya banner "Tersimpan" tidak permanen
      if (savedTimerId) clearTimeout(savedTimerId);
      savedTimerId = setTimeout(() => {
        if (inflightCount === 0 && status === 'saved') {
          status = 'idle';
          savedTimerId = null;
          notify();
        }
      }, 2500);
    }
    notify();
  },

  subscribe(cb) {
    subscribers.add(cb);
    cb({ status, inflightCount, lastErrorMessage });
    return () => subscribers.delete(cb);
  },

  get() {
    return { status, inflightCount, lastErrorMessage };
  },

  /**
   * Reset paksa state — dipakai saat user pindah halaman atau reload manual.
   */
  reset() {
    inflightCount = 0;
    status = 'idle';
    lastErrorMessage = null;
    if (savedTimerId) { clearTimeout(savedTimerId); savedTimerId = null; }
    notify();
  },
};
