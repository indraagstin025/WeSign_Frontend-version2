/**
 * @file SigningJobStatusModal.jsx
 * @description Modal universal untuk menampilkan progress / status
 *   SigningJob async. Dipakai oleh personal/package/group flow setelah
 *   submit final.
 *
 * Props:
 *   isOpen           - boolean
 *   job              - { id, status, progress, errorCode, errorMessage,
 *                        retryable, attemptCount } | null
 *   isReconnecting   - bool: lagi network blip, polling masih jalan
 *   onClose          - (): void
 *   onRetry          - async () => void  (panggil endpoint retry)
 *   onCancel         - async () => void  (panggil endpoint cancel; opsional)
 *   onConfirmDone    - async () => void  (panggil saat user klik tombol selesai)
 *   labels           - { processingHint?: string }
 */

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  WifiOff,
  X,
} from "lucide-react";

const STATUS_LABEL = {
  queued: "Menunggu giliran...",
  processing: "Dokumen sedang diproses...",
  completed: "Berhasil diproses",
  failed: "Gagal diproses",
  cancelled: "Dibatalkan",
};

const isTerminal = (status) =>
  status === "completed" || status === "failed" || status === "cancelled";

const SigningJobStatusModal = ({
  isOpen,
  job,
  isReconnecting = false,
  onClose,
  onRetry,
  onCancel,
  onConfirmDone,
  labels = {},
}) => {
  if (!isOpen) return null;

  const status = job?.status || "queued";
  const progress = Math.max(0, Math.min(100, Number(job?.progress || 0)));
  const errorMessage = job?.errorMessage;
  const retryable = !!job?.retryable;

  let theme = "info";
  if (status === "completed") theme = "success";
  else if (status === "failed") theme = "error";
  else if (status === "cancelled") theme = "warning";

  const tones = {
    success: {
      icon: <CheckCircle2 size={32} className="text-emerald-500" />,
      bg: "bg-emerald-500/10",
      glow: "shadow-[0_0_40px_rgba(16,185,129,0.15)]",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
    error: {
      icon: <XCircle size={32} className="text-rose-500" />,
      bg: "bg-rose-500/10",
      glow: "shadow-[0_0_40px_rgba(244,63,94,0.15)]",
      button: "bg-rose-600 hover:bg-rose-700",
    },
    warning: {
      icon: <AlertCircle size={32} className="text-amber-500" />,
      bg: "bg-amber-500/10",
      glow: "shadow-[0_0_40px_rgba(245,158,11,0.15)]",
      button: "bg-amber-600 hover:bg-amber-700",
    },
    info: {
      icon: <Loader2 size={32} className="text-sky-500 animate-spin" />,
      bg: "bg-sky-500/10",
      glow: "shadow-[0_0_40px_rgba(56,189,248,0.15)]",
      button: "bg-sky-600 hover:bg-sky-700",
    },
  };
  const tone = tones[theme];

  const showCloseButton = isTerminal(status);

  // [REVIEW FIX H-2] Saat status `completed`, klik X / backdrop harus
  // memicu `onConfirmDone` (bila tersedia) supaya consumer hook bisa
  // menjalankan side-effect penting: clear draft (personal/package),
  // update status COMPLETED + invalidate cache (group), navigate, dst.
  // Sebelumnya tombol "Selesai" saja yang memanggil `onConfirmDone`,
  // sehingga close lewat X/backdrop melewatkan handler dan UI bisa
  // false-success (draft tidak ter-clear, group status tidak update).
  // Untuk failed/cancelled, biarkan `onClose` apa adanya — tidak ada
  // post-success action yang perlu dijalankan.
  const handleDismiss =
    status === "completed" && onConfirmDone ? onConfirmDone : onClose;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={showCloseButton ? handleDismiss : undefined}
      />
      <div
        className={`relative w-full max-w-sm bg-white dark:bg-[#111b21] rounded-[2.5rem] border border-zinc-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${tone.glow}`}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-6 right-6 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        )}

        <div className="p-8 pt-12 flex flex-col items-center text-center">
          <div
            className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 ${tone.bg} relative`}
          >
            {tone.icon}
          </div>

          <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-3">
            {STATUS_LABEL[status] || "Memproses..."}
          </h3>

          {/* Progress bar saat processing/queued */}
          {(status === "queued" || status === "processing") && (
            <div className="w-full mb-4">
              <div className="h-1.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                {progress > 0 ? `${progress}%` : "Memulai..."}
              </p>
            </div>
          )}

          {/* Hint text */}
          {(status === "queued" || status === "processing") && (
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 px-2">
              {labels.processingHint ||
                "Tetap di halaman ini sampai proses selesai. Jika menutup halaman, status akan dipulihkan saat Anda kembali."}
            </p>
          )}

          {/* Reconnecting indicator */}
          {isReconnecting && !isTerminal(status) && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs mb-3">
              <WifiOff size={14} />
              <span>Mencoba menyambungkan kembali...</span>
            </div>
          )}

          {/* Error message + retry */}
          {status === "failed" && (
            <>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 leading-relaxed mb-2 px-2">
                {errorMessage || "Terjadi kesalahan saat memproses dokumen."}
              </p>
              {job?.attemptCount > 0 && (
                <p className="text-xs text-zinc-400 mb-4">
                  Percobaan ke-{job.attemptCount}
                </p>
              )}
              <div className="w-full flex flex-col gap-2 mt-2">
                {retryable && onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className={`w-full py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-xl border-none cursor-pointer active:scale-95 ${tone.button}`}
                  >
                    Coba Lagi
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all border-none cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </>
          )}

          {/* Cancelled */}
          {status === "cancelled" && (
            <>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 px-2">
                Permintaan tanda tangan dibatalkan.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-xl border-none cursor-pointer active:scale-95 bg-zinc-600 hover:bg-zinc-700"
              >
                Tutup
              </button>
            </>
          )}

          {/* Completed */}
          {status === "completed" && (
            <>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4 px-2">
                Dokumen Anda telah berhasil ditandatangani.
              </p>
              <button
                type="button"
                onClick={onConfirmDone || onClose}
                className={`w-full py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-xl border-none cursor-pointer active:scale-95 ${tone.button}`}
              >
                Selesai
              </button>
            </>
          )}

          {/* Optional cancel button while queued */}
          {status === "queued" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:underline border-none bg-transparent cursor-pointer"
            >
              Batalkan permintaan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SigningJobStatusModal;
