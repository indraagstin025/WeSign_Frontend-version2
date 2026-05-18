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
 *
 * Validasi tambahan (H-3 fix):
 *   - URL hasil resolve harus valid (parseable via URL constructor)
 *   - Production mode TIDAK BOLEH point ke localhost — fail-fast saat build
 *   - Development mode boleh apa saja (tidak validate)
 */

export const LOCAL_API_URL = "http://localhost:3000/api";
export const PRODUCTION_API_URL = "https://wesign-backend-production.up.railway.app/api";

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isLocalhostUrl(value) {
  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
  } catch {
    return false;
  }
}

function resolveApiBaseUrl() {
  const isProduction = import.meta.env.MODE === "production";
  const envUrl = import.meta.env?.VITE_API_URL;

  let resolved;
  if (typeof envUrl === "string" && envUrl.trim() !== "") {
    resolved = envUrl.trim().replace(/\/+$/, "");
  } else {
    resolved = isProduction ? PRODUCTION_API_URL : LOCAL_API_URL;
  }

  // [H-3] Validate hasil resolve — prevent silent broken state di production
  if (!isValidUrl(resolved)) {
    const message = `[env] Invalid API_BASE_URL: "${resolved}". Periksa VITE_API_URL atau PRODUCTION_API_URL.`;
    if (isProduction) throw new Error(message);
    console.warn(message);
  }

  if (isProduction && isLocalhostUrl(resolved)) {
    throw new Error(
      `[env] Production build TIDAK BOLEH pakai localhost API: "${resolved}". ` +
      `Set VITE_API_URL ke production URL atau biarkan default (PRODUCTION_API_URL).`
    );
  }

  return resolved;
}

/**
 * API base URL aktif untuk environment saat ini.
 */
export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Origin server (tanpa suffix `/api`) — dipakai oleh Socket.IO client.
 */
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");
