/**
 * @file useSigningJobPolling.js
 * @description Hook polling status SigningJob dengan backoff dan
 *   network-error tolerance. Dipakai bersama oleh personal/package/group
 *   flow setelah enqueue job di backend.
 *
 * Behavior:
 *   - Polling start setiap 1500ms, lalu backoff: 1500 → 2500 → 4000 → 5000ms
 *     (cap 5000ms). Reset ke 1500ms saat status atau progress berubah.
 *   - Stop saat status terminal (completed/failed/cancelled).
 *   - Saat network error, tidak langsung fail job: tampilkan "reconnecting"
 *     state ke caller dan tetap retry dengan delay sama.
 *   - AbortController cleanup supaya tidak set state setelah unmount.
 *
 * Output state:
 *   {
 *     job: { id, status, progress, result, errorCode, errorMessage,
 *            retryable, attemptCount, ... },
 *     isPolling,
 *     isReconnecting,
 *     pollingError,        // network error terakhir (null kalau OK)
 *     retry: () => Promise<void>   // panggil endpoint retry job
 *     cancel: () => Promise<void>  // panggil endpoint cancel job
 *   }
 *
 * Usage:
 *   const { job, isReconnecting } = useSigningJobPolling({
 *     jobId: "...",
 *     enabled: true,
 *     onCompleted: (result) => { ... },
 *     onFailed: (err) => { ... },
 *   });
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSigningJob,
  retrySigningJob,
  cancelSigningJob,
} from "../api/signingJobService";

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);
const DEFAULT_INITIAL_INTERVAL_MS = 1500;
const DEFAULT_MAX_INTERVAL_MS = 5000;

const BACKOFF_LADDER = [1500, 2500, 4000, 5000];

const isNetworkOrTimeoutError = (err) => {
  if (!err) return false;
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const message = String(err.message || "").toLowerCase();
  return (
    message.includes("koneksi") ||
    message.includes("waktu tunggu") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("timeout")
  );
};

/**
 * @param {object} params
 * @param {string|null} params.jobId
 * @param {boolean} [params.enabled=true]
 * @param {(result: object|null, job: object) => void} [params.onCompleted]
 * @param {(error: { code, message }, job: object) => void} [params.onFailed]
 * @param {(job: object) => void} [params.onCancelled]
 * @param {number} [params.initialIntervalMs=1500]
 * @param {number} [params.maxIntervalMs=5000]
 */
export function useSigningJobPolling({
  jobId,
  enabled = true,
  onCompleted,
  onFailed,
  onCancelled,
  initialIntervalMs = DEFAULT_INITIAL_INTERVAL_MS,
  maxIntervalMs = DEFAULT_MAX_INTERVAL_MS,
} = {}) {
  const [job, setJob] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [pollingError, setPollingError] = useState(null);

  const lastSnapshotRef = useRef(null); // { status, progress }
  const backoffStepRef = useRef(0);
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);
  const onCancelledRef = useRef(onCancelled);
  const completedFiredRef = useRef(false);

  // Refresh refs on each render so stale closures don't fire wrong callback.
  onCompletedRef.current = onCompleted;
  onFailedRef.current = onFailed;
  onCancelledRef.current = onCancelled;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const computeNextDelay = useCallback(() => {
    const idx = Math.min(backoffStepRef.current, BACKOFF_LADDER.length - 1);
    const ladderValue = BACKOFF_LADDER[idx];
    return Math.min(ladderValue, maxIntervalMs);
  }, [maxIntervalMs]);

  // Pakai ref untuk pollOnce supaya scheduleNext tidak butuh dependency
  // ke pollOnce (ada cyclical: pollOnce → scheduleNext → pollOnce).
  const pollOnceRef = useRef(null);

  const scheduleNext = useCallback((delay) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      pollOnceRef.current?.();
    }, delay);
  }, []);

  const pollOnce = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!jobId || !enabled) return;

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await getSigningJob(jobId, { signal: ac.signal });
      if (!mountedRef.current) return;
      const next = res?.data || null;
      setJob(next);
      setPollingError(null);
      setIsReconnecting(false);

      if (!next) {
        // Should not happen, treat as scheduling next retry.
        backoffStepRef.current += 1;
        scheduleNext(computeNextDelay());
        return;
      }

      // Reset backoff kalau status atau progress berubah — UI akan
      // refresh lebih responsif saat mendekati selesai.
      const snapshot = { status: next.status, progress: next.progress };
      const prev = lastSnapshotRef.current;
      const changed =
        !prev ||
        prev.status !== snapshot.status ||
        prev.progress !== snapshot.progress;
      lastSnapshotRef.current = snapshot;
      if (changed) {
        backoffStepRef.current = 0;
      }

      // Terminal handling.
      if (next.status === "completed") {
        if (!completedFiredRef.current) {
          completedFiredRef.current = true;
          try {
            onCompletedRef.current?.(next.result || null, next);
          } catch {
            /* swallow callback errors; not our concern */
          }
        }
        setIsPolling(false);
        return;
      }
      if (next.status === "failed") {
        setIsPolling(false);
        try {
          onFailedRef.current?.(
            {
              code: next.errorCode || null,
              message: next.errorMessage || null,
              retryable: !!next.retryable,
            },
            next,
          );
        } catch {
          /* noop */
        }
        return;
      }
      if (next.status === "cancelled") {
        setIsPolling(false);
        try {
          onCancelledRef.current?.(next);
        } catch {
          /* noop */
        }
        return;
      }

      // Lanjut polling.
      backoffStepRef.current += changed ? 0 : 1;
      scheduleNext(computeNextDelay());
    } catch (err) {
      if (!mountedRef.current) return;
      // AbortError → caller cancel atau unmount; jangan reschedule.
      if (err?.name === "AbortError") return;

      if (isNetworkOrTimeoutError(err)) {
        // Tidak fail job, tetap polling. Tampilkan reconnecting flag
        // ke UI supaya user tahu kita masih mencoba.
        setPollingError(err);
        setIsReconnecting(true);
        backoffStepRef.current += 1;
        scheduleNext(computeNextDelay());
        return;
      }

      // Non-network error (mis. 404 → job hilang). Stop polling dan
      // expose error ke caller.
      setPollingError(err);
      setIsPolling(false);
    }
  }, [jobId, enabled, scheduleNext, computeNextDelay]);

  // Sinkron ref ke versi callback terbaru.
  pollOnceRef.current = pollOnce;

  useEffect(() => {
    mountedRef.current = true;
    if (!jobId || !enabled) {
      setIsPolling(false);
      setIsReconnecting(false);
      return undefined;
    }
    completedFiredRef.current = false;
    backoffStepRef.current = 0;
    lastSnapshotRef.current = null;
    setIsPolling(true);
    pollOnce();
    return () => {
      mountedRef.current = false;
      clearTimer();
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, enabled]);

  const retry = useCallback(async () => {
    if (!jobId) return null;
    const res = await retrySigningJob(jobId);
    setJob(res?.data || null);
    completedFiredRef.current = false;
    setIsPolling(true);
    backoffStepRef.current = 0;
    scheduleNext(initialIntervalMs);
    return res?.data || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, initialIntervalMs]);

  const cancel = useCallback(async () => {
    if (!jobId) return null;
    const res = await cancelSigningJob(jobId);
    setJob(res?.data || null);
    setIsPolling(false);
    return res?.data || null;
  }, [jobId]);

  return {
    job,
    isPolling,
    isReconnecting,
    pollingError,
    retry,
    cancel,
  };
}

export default useSigningJobPolling;

export const __TEST__ = { TERMINAL_STATUSES, BACKOFF_LADDER };
