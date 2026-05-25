/**
 * @file apiUpload.js
 * @description Helper untuk mengunggah file dengan dukungan pelacakan progress (XHR).
 * Sesuai untuk file besar (PDF) guna memberikan feedback visual kepada pengguna.
 */

import { API_BASE_URL } from '@/config/env';
import { createLogger } from '../utils/logger';

const log = createLogger('apiUpload');

/**
 * Map error code/status ke friendly message Bahasa Indonesia.
 * Konsisten dengan getFriendlyErrorMessage di api.js.
 *
 * [M-1] Sebelumnya kalau backend return error JSON, frontend show generic
 * "Gagal mengunggah (Status: 413)" — tidak informatif. Sekarang map ke
 * pesan yang relevan dengan konteks upload.
 */
function getUploadErrorMessage(code, status, originalMessage) {
  const codeMessages = {
    SUPABASE_ERROR: 'Gagal mengunggah berkas ke penyimpanan. Layanan penyimpanan sedang tidak tersedia, silakan coba beberapa saat lagi.',
    FILE_TOO_LARGE: 'Ukuran berkas terlalu besar. Periksa batas ukuran upload.',
    INVALID_FILE_TYPE: 'Format berkas tidak didukung. Gunakan format yang sesuai (PDF, dll).',
    QUOTA_EXCEEDED: 'Kuota upload Anda sudah penuh. Hapus dokumen lama atau upgrade akun.',
    VALIDATION_ERROR: originalMessage || 'Data yang dikirimkan tidak valid.',
  };
  if (code && codeMessages[code]) return codeMessages[code];

  const statusMessages = {
    400: originalMessage || 'Permintaan upload tidak valid.',
    403: 'Anda tidak memiliki izin untuk mengunggah.',
    413: 'Ukuran berkas melebihi batas server (413 Request Entity Too Large).',
    422: originalMessage || 'Berkas tidak dapat diproses oleh server.',
    429: 'Terlalu banyak upload. Tunggu sebentar sebelum mencoba lagi.',
    500: 'Server error saat memproses upload. Coba lagi dalam beberapa saat.',
    502: 'Layanan upload sedang tidak tersedia (Bad Gateway).',
    503: 'Server sedang dalam pemeliharaan.',
    504: 'Server tidak merespons (Gateway Timeout). Periksa koneksi Anda.',
  };
  return statusMessages[status] || originalMessage || `Gagal mengunggah (Status: ${status}).`;
}

/**
 * Mengunggah FormData dengan monitor progress.
 * @param {string} endpoint - API Endpoint (e.g., '/documents')
 * @param {FormData} formData - Data yang akan diunggah
 * @param {object} options - { onProgress, signal }
 * @param {boolean} _isRetry - Internal flag untuk mencegah infinite retry
 * @returns {Promise<object>} Response data
 */
export function apiUpload(endpoint, formData, { onProgress, signal, idempotencyKey } = {}, _isRetry = false) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem('wesign_token');
    const csrfToken = localStorage.getItem('wesign_csrf_token');

    xhr.open('POST', `${API_BASE_URL}${endpoint}`);

    // Set Authorization Header
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // ✅ Set CSRF Token Header (diperlukan oleh csrfValidation middleware)
    if (csrfToken) {
      xhr.setRequestHeader('X-CSRF-Token', csrfToken);
    }

    if (idempotencyKey) {
      xhr.setRequestHeader('Idempotency-Key', idempotencyKey);
    }

    // Monitor Progress
    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });
    }

    // Handle Abort (via signal if provided)
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Unggahan dibatalkan oleh pengguna.'));
      });
    }

    // Handle Response
    xhr.onload = async () => {
      let responseData;
      try {
        responseData = JSON.parse(xhr.responseText);
      } catch (parseErr) {
        // [M-1] Kalau parse gagal (server return HTML error page atau text),
        // tetap log warn untuk debugging tapi jangan break — pakai fallback message.
        log.warn('failed to parse response JSON:', parseErr.message);
        responseData = { message: 'Respons server tidak valid.' };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseData);
      } else if (xhr.status === 401 && !_isRetry) {
        // ✅ Coba refresh token dulu, bukan langsung force logout
        log.warn('401 detected, attempting token refresh...');
        try {
          const refreshToken = localStorage.getItem('wesign_refresh_token');
          if (!refreshToken) throw new Error('No refresh token');

          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            localStorage.setItem('wesign_token', refreshData.data.token);
            localStorage.setItem('wesign_refresh_token', refreshData.data.refresh_token);

            // Fetch CSRF token baru
            try {
              const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${refreshData.data.token}` },
              });
              if (meRes.ok) {
                const meData = await meRes.json();
                if (meData?.data?.csrfToken) {
                  localStorage.setItem('wesign_csrf_token', meData.data.csrfToken);
                }
              }
            } catch (csrfErr) {
              log.warn('CSRF refresh failed (non-fatal):', csrfErr.message);
            }

            log.info('Token refreshed, retrying upload...');
            // Retry upload dengan token baru
            resolve(apiUpload(endpoint, formData, { onProgress, signal, idempotencyKey }, true));
          } else {
            throw new Error('Refresh failed');
          }
        } catch (refreshErr) {
          log.error('refresh failed, forcing logout:', refreshErr.message);
          // Refresh gagal — force logout
          localStorage.removeItem('wesign_token');
          localStorage.removeItem('wesign_refresh_token');
          localStorage.removeItem('wesign_csrf_token');
          localStorage.removeItem('wesign_user');
          localStorage.removeItem('wesign_login_at');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true';
          }
          reject(new Error('Sesi berakhir. Silakan login kembali.'));
        }
      } else {
        // [M-1] Pakai friendly error mapper alih-alih generic "Gagal (Status: X)"
        const friendlyMessage = getUploadErrorMessage(
          responseData?.code,
          xhr.status,
          responseData?.message || responseData?.error
        );
        const error = new Error(friendlyMessage);
        error.status = xhr.status;
        error.code = responseData?.code;
        error.data = responseData;
        reject(error);
      }
    };

    // Handle Errors
    xhr.onerror = () => {
      if (!window.navigator.onLine) {
        reject(new Error('Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.'));
      } else {
        reject(new Error('Terjadi kesalahan jaringan saat mengunggah file.'));
      }
    };

    xhr.ontimeout = () => {
      reject(new Error('Waktu unggah habis (Request Timeout).'));
    };

    // Kirim
    xhr.send(formData);
  });
}

