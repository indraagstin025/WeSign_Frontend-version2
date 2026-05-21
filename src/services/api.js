/**
 * @file api.js
 * @description Wrapper Fetch API dengan dukungan Timeout dan Penanganan Jaringan.
 */

import { API_BASE_URL } from "@/config/env";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "@/config/timeouts";

const DEFAULT_TIMEOUT = DEFAULT_REQUEST_TIMEOUT_MS;

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Ambil CSRF token dari localStorage
 */
function getCsrfToken() {
  return localStorage.getItem("wesign_csrf_token") || "";
}

/**
 * Simpan CSRF token ke localStorage
 */
function setCsrfToken(token) {
  if (token) {
    localStorage.setItem("wesign_csrf_token", token);
  }
}

/**
 * Wrapper fetch yang menangani JSON, token, timeout, CSRF, dan error jaringan.
 *
 * @param {string} endpoint - API endpoint relative ke API_BASE_URL (e.g., '/auth/login')
 * @param {object} [options={}] - Fetch options + WeSign-specific options
 * @param {string} [options.method='GET'] - HTTP method
 * @param {object|FormData} [options.body] - Request body (auto-serialize JSON)
 * @param {object} [options.headers] - Additional headers (Authorization & CSRF auto-handled)
 * @param {number} [options.timeout=DEFAULT_TIMEOUT] - Custom timeout dalam ms
 * @param {AbortSignal} [options.signal] - External abort signal (untuk cancel/coalesce)
 * @param {string} [options._tokenOverride] - Internal: token override (dipakai oleh retry handler setelah refresh)
 * @param {boolean} [options._retry] - Internal: marker bahwa ini adalah retry attempt
 * @returns {Promise<object>} Parsed JSON response dari backend
 * @throws {Error} Network error, timeout, atau backend error (dengan friendly message)
 */
export async function apiFetch(endpoint, options = {}) {
  // [H-1] Token resolution priority:
  //   1. options._tokenOverride — di-pass dari retry handler setelah refresh
  //      sukses. Mencegah race antara localStorage.setItem dan retry yang
  //      baca dari localStorage di micro-task berikutnya.
  //   2. localStorage 'wesign_token' — token aktif normal
  const token = options._tokenOverride || localStorage.getItem("wesign_token");
  const csrfToken = getCsrfToken();

  // 1. Setup AbortController untuk handling Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

  // External signal support — caller bisa membatalkan request lebih awal
  // (dipakai oleh withRetryCoalesce untuk membatalkan request lama saat
  // request baru datang untuk signature yang sama).
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Add CSRF token untuk non-GET requests
  const isModifyingRequest = ["POST", "PUT", "DELETE", "PATCH"].includes(options.method?.toUpperCase());
  if (isModifyingRequest && csrfToken) {
    defaultHeaders["X-CSRF-Token"] = csrfToken;
  }

  const config = {
    ...options,
    signal: controller.signal,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const isFormData = config.body instanceof FormData;
  if (config.body && typeof config.body === "object" && !isFormData) {
    config.body = JSON.stringify(config.body);
  }
  if (isFormData) {
    delete config.headers["Content-Type"];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);

    // --- INTERCEPTOR 401 (UNAUTHORIZED) ---
    // Skip auto-refresh untuk endpoint auth publik (reset-password, forgot-password)
    const skipRefreshEndpoints = ["/auth/login", "/auth/reset-password", "/auth/forgot-password"];
    const shouldSkipRefresh = skipRefreshEndpoints.some((p) => endpoint.startsWith(p));
    if (response.status === 401 && !options._retry && !shouldSkipRefresh) {
      console.warn(`[apiFetch] 401 detected on ${options.method} ${endpoint}, attempting token refresh...`);
      const refreshToken = localStorage.getItem("wesign_refresh_token");

      if (!refreshToken) {
        console.error("[apiFetch] Missing refresh token, forcing logout");
        handleLogout();
        throw new Error("Sesi berakhir. Silakan login kembali.");
      }

      // ✅ PENTING: Daftarkan subscriber DULU sebelum memulai refresh
      // Ini mencegah race condition dimana onTokenRefreshed() dipanggil
      // sebelum subscriber terdaftar (menyebabkan Promise tidak pernah resolve)
      //
      // [H-1] Pass newToken langsung ke retry via _tokenOverride supaya
      // tidak ada micro-task race antara localStorage.setItem dan retry
      // yang baca dari localStorage. Sebelumnya kalau retry kick in
      // sebelum localStorage flush ke disk (rare tapi possible), retry
      // pakai token lama -> 401 lagi -> infinite loop risk.
      const retryPromise = new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          console.log("[apiFetch] Retrying request after token refresh...");
          resolve(apiFetch(endpoint, {
            ...options,
            _retry: true,
            _tokenOverride: newToken,
          }));
        });
      });

      // Mulai refresh hanya jika belum ada proses refresh yang berjalan
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshRes.ok) {
            const { data } = await refreshRes.json();
            localStorage.setItem("wesign_token", data.token);
            localStorage.setItem("wesign_refresh_token", data.refresh_token);

            // ✅ Fetch CSRF token baru dari /auth/me setelah refresh berhasil
            try {
              const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
                method: "GET",
                headers: { Authorization: `Bearer ${data.token}` },
              });
              if (meRes.ok) {
                const meData = await meRes.json();
                if (meData?.data?.csrfToken) {
                  setCsrfToken(meData.data.csrfToken);
                }
              }
            } catch {
              console.warn("[apiFetch] Failed to refresh CSRF token after token refresh");
            }

            isRefreshing = false;
            console.log("[apiFetch] Token refreshed successfully");
            onTokenRefreshed(data.token); // Sekarang subscriber sudah terdaftar → callback akan dipanggil
          } else {
            isRefreshing = false;
            refreshSubscribers = []; // Bersihkan subscriber yang menunggu
            console.error("[apiFetch] Token refresh failed, forcing logout");
            handleLogout();
            throw new Error("Sesi benar-benar berakhir.");
          }
        } catch (e) {
          isRefreshing = false;
          refreshSubscribers = []; // Bersihkan subscriber yang menunggu
          console.error("[apiFetch] Error during token refresh:", e.message);
          handleLogout();
          throw e;
        }
      }

      return retryPromise;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Server mengirimkan respons yang tidak dapat dibaca.");
    }

    if (!response.ok) {
      // Jangan auto-logout untuk endpoint auth publik yang bisa return 401
      // (login: password salah, reset-password: token expired/invalid, forgot-password: edge case)
      const authPublicEndpoints = ["/auth/login", "/auth/reset-password", "/auth/forgot-password"];
      const isAuthPublic = authPublicEndpoints.some((p) => endpoint.startsWith(p));
      if (response.status === 401 && !isAuthPublic) handleLogout();

      // Petakan error code dari backend ke pesan ramah pengguna
      const errorCode = data?.code;
      const friendlyMessage = getFriendlyErrorMessage(errorCode, response.status, data?.message);

      const error = new Error(friendlyMessage);
      error.status = response.status;
      error.code = errorCode;
      error.data = data;
      throw error;
    }

    // Capture CSRF token dari response jika ada (dari /auth/me atau endpoint lain yang return csrfToken)
    if (data?.data?.csrfToken) {
      setCsrfToken(data.data.csrfToken);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    // [FIX] AbortError dari coalesce/cancel adalah expected — tidak perlu log spam.
    // Caller (mis. withRetryCoalesce / outboxDrain) sudah handle ini.
    const isCallerAbort = err.name === "AbortError" && options.signal?.aborted;
    if (!isCallerAbort) {
      console.error("[apiFetch] Error caught:", {
        errorName: err.name,
        errorMessage: err.message,
        endpoint,
        method: options.method,
        stack: err.stack,
      });
    }

    if (err.name === "AbortError") {
      // Bedakan: kalau caller intentionally cancel (external signal aborted),
      // propagate AbortError agar withRetryCoalesce bisa membedakan dari timeout.
      if (options.signal?.aborted) throw err;
      throw new Error("Permintaan gagal: Waktu tunggu habis. Coba lagi dalam beberapa saat.");
    }
    if (err.message === "Failed to fetch" || err.message?.includes("fetch failed") || !navigator.onLine) {
      console.error("[apiFetch] Network error detected");
      throw new Error("Koneksi internet terputus atau tidak stabil. Periksa koneksi Anda dan coba lagi.");
    }
    throw err;
  }
}

function handleLogout() {
  localStorage.removeItem("wesign_token");
  localStorage.removeItem("wesign_refresh_token");
  localStorage.removeItem("wesign_csrf_token");
  localStorage.removeItem("wesign_user");

  // Hindari loop redirect jika sudah di login
  if (window.location.pathname === "/login") return;

  // [M-5] Dispatch custom event ke App-level untuk SPA navigation.
  // Sebelumnya pakai `window.location.href = '/login?expired=true'` yang
  // cause full page reload (white flash, tear-down semua state). Sekarang:
  // - App.jsx subscribe ke 'wesign:auth-expired' event dan call navigate()
  // - Kalau tidak ada listener (mis. service dipanggil sebelum App mount),
  //   fallback ke window.location.href untuk safety
  const expiredEvent = new CustomEvent('wesign:auth-expired', {
    detail: { reason: 'session-expired' },
  });
  const dispatched = window.dispatchEvent(expiredEvent);

  // Fallback kalau event tidak di-handle (preventDefault tidak called atau
  // tidak ada listener yang call event.handled = true)
  if (!expiredEvent.defaultPrevented) {
    window.location.href = "/login?expired=true";
  }
}

/**
 * Memetakan error code dari backend atau HTTP status ke pesan yang ramah pengguna.
 * @param {string|undefined} code - Error code dari backend (misal: 'SUPABASE_ERROR')
 * @param {number} status - HTTP status code
 * @param {string|undefined} originalMessage - Pesan asli dari backend
 * @returns {string} Pesan error yang ramah pengguna
 */
function getFriendlyErrorMessage(code, status, originalMessage) {
  // Peta error code spesifik dari backend
  const codeMessages = {
    SUPABASE_ERROR: "Gagal mengunggah berkas ke penyimpanan. Layanan penyimpanan sedang tidak tersedia, silakan coba beberapa saat lagi.",
    UNAUTHORIZED: "Sesi Anda telah berakhir. Silakan login kembali.",
    FORBIDDEN: "Anda tidak memiliki izin untuk melakukan aksi ini.",
    NOT_FOUND: "Data yang diminta tidak ditemukan.",
    VALIDATION_ERROR: originalMessage || "Data yang dikirimkan tidak valid.",
    FILE_TOO_LARGE: "Ukuran berkas terlalu besar. Maksimal 20MB.",
    INVALID_FILE_TYPE: "Format berkas tidak didukung. Gunakan format PDF.",
  };

  if (code && codeMessages[code]) {
    return codeMessages[code];
  }

  // Peta berdasarkan HTTP status jika tidak ada error code spesifik
  const statusMessages = {
    400: originalMessage || "Permintaan tidak valid. Periksa kembali data yang dikirimkan.",
    401: originalMessage || "Sesi Anda telah berakhir. Silakan login kembali.",
    403: "Anda tidak memiliki izin untuk melakukan aksi ini.",
    404: "Data yang diminta tidak ditemukan.",
    408: "Permintaan gagal: Waktu tunggu habis. Coba lagi dalam beberapa saat.",
    413: "Ukuran berkas terlalu besar. Maksimal 20MB.",
    429: "Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.",
    500: "Terjadi kesalahan pada server. Tim kami sudah diberitahu. Silakan coba lagi.",
    502: "Layanan sedang tidak tersedia (Bad Gateway). Silakan coba beberapa saat lagi.",
    503: "Server sedang dalam pemeliharaan. Silakan coba beberapa menit lagi.",
    504: "Server tidak merespons (Gateway Timeout). Periksa koneksi Anda dan coba lagi.",
  };

  return statusMessages[status] || originalMessage || `Terjadi kesalahan yang tidak terduga (${status}).`;
}
