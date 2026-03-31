/**
 * @file apiUpload.js
 * @description Helper untuk mengunggah file dengan dukungan pelacakan progress (XHR).
 * Sesuai untuk file besar (PDF) guna memberikan feedback visual kepada pengguna.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Mengunggah FormData dengan monitor progress.
 * @param {string} endpoint - API Endpoint (e.g., '/documents')
 * @param {FormData} formData - Data yang akan diunggah
 * @param {object} options - { onProgress, signal }
 * @returns {Promise<object>} Response data
 */
export function apiUpload(endpoint, formData, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const token = localStorage.getItem('wesign_token');

    xhr.open('POST', `${API_BASE_URL}${endpoint}`);

    // Set Authorization Header
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
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
    xhr.onload = () => {
      let responseData;
      try {
        responseData = JSON.parse(xhr.responseText);
      } catch (e) {
        responseData = { message: 'Respons server tidak valid.' };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseData);
      } else {
        // Handle 401 Global (Unauthorized)
        if (xhr.status === 401) {
          localStorage.removeItem('wesign_token');
          localStorage.removeItem('wesign_refresh_token');
          localStorage.removeItem('wesign_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true';
          }
        }
        
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
