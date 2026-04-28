/**
 * @file env.js
 * @description Sumber tunggal konfigurasi API base URL untuk seluruh aplikasi.
 *
 * Resolusi base URL (urutan prioritas):
 *   1. `import.meta.env.VITE_API_URL` (override eksplisit lewat .env / build-time)
 *   2. Auto-detect berdasarkan hostname browser:
 *        - localhost / 127.0.0.1 / ::1  -> LOCAL_API_URL
 *        - selain itu                    -> PRODUCTION_API_URL
 *   3. Fallback ke PRODUCTION_API_URL (mis. saat SSR / non-browser context).
 *
 * Dengan pendekatan ini, file service tidak perlu di-edit untuk berpindah
 * environment — cukup jalankan dev server di localhost, atau set
 * `VITE_API_URL` di file .env untuk override.
 */

export const LOCAL_API_URL = "http://localhost:3000/api";
export const PRODUCTION_API_URL = "https://wesign-backend-production.up.railway.app/api";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function resolveApiBaseUrl() {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (LOCAL_HOSTNAMES.has(host)) {
      return LOCAL_API_URL;
    }
  }

  return PRODUCTION_API_URL;
}

/**
 * API base URL aktif untuk environment saat ini.
 * Contoh: "http://localhost:3000/api" atau
 *         "https://wesign-backend-production.up.railway.app/api".
 */
export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Origin server (tanpa suffix `/api`) — dipakai oleh Socket.IO client.
 */
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");
