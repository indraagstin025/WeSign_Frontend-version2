/**
 * @file env.js
 * @description Sumber tunggal konfigurasi API base URL untuk seluruh aplikasi.
 *
 * Resolusi base URL (urutan prioritas):
 *   1. `import.meta.env.VITE_API_URL` — override eksplisit (opsional, kalau di-set).
 *   2. `import.meta.env.MODE === "production"` (saat `vite build`)  -> PRODUCTION_API_URL.
 *   3. Default (saat `vite dev` / mode lain)                         -> LOCAL_API_URL.
 *
 * Dengan pola ini, tidak perlu file `.env` sama sekali:
 *   - `npm run dev`   -> otomatis http://localhost:3000/api
 *   - `npm run build` -> otomatis https://wesign-backend-production.up.railway.app/api
 */

export const LOCAL_API_URL = "http://localhost:3000/api";
export const PRODUCTION_API_URL = "https://wesign-backend-production.up.railway.app/api";

function resolveApiBaseUrl() {
  const envUrl = import.meta.env?.VITE_API_URL;
  if (typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  return import.meta.env.MODE === "production" ? PRODUCTION_API_URL : LOCAL_API_URL;
}

/**
 * API base URL aktif untuk environment saat ini.
 */
export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Origin server (tanpa suffix `/api`) — dipakai oleh Socket.IO client.
 */
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");
