/**
 * @file apiUpload.js
 * @description Helper untuk mengunggah file dengan dukungan pelacakan progress (XHR).
 * Sesuai untuk file besar (PDF) guna memberikan feedback visual kepada pengguna.
 */

import { API_BASE_URL } from '@/config/env';

/**
 * Mengunggah FormData dengan monitor progress.
 * @param {string} endpoint - API Endpoint (e.g., '/documents')
 * @param {FormData} formData - Data yang akan diunggah
 * @param {object} options - { onProgress, signal }
 * @param {boolean} _isRetry - Internal flag untuk mencegah infinite retry
 * @returns {Promise<object>} Response data
 */
export function apiUpload(endpoint, formData, { onProgress, signal } = {}, _isRetry = false) {
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
      } catch (e) {
        responseData = { message: 'Respons server tidak valid.' };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseData);
      } else if (xhr.status === 401 && !_isRetry) {
        // ✅ Coba refresh token dulu, bukan langsung force logout
        console.warn('[apiUpload] 401 detected, attempting token refresh...');
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
            } catch { /* CSRF refresh failure non-fatal */ }

            console.log('[apiUpload] Token refreshed, retrying upload...');
            // Retry upload dengan token baru
            resolve(apiUpload(endpoint, formData, { onProgress, signal }, true));
          } else {
            throw new Error('Refresh failed');
          }
        } catch {
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
        const error = new Error(responseData.message || responseData.error || `Gagal mengunggah (Status: ${xhr.status})`);
        error.status = xhr.status;
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

