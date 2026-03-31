/**
 * @file api.js
 * @description Wrapper Fetch API dengan dukungan Timeout dan Penanganan Jaringan.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const DEFAULT_TIMEOUT = 15000; // 15 Detik (Batas wajar menunggu jaringan)

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
 * Wrapper fetch yang menangani JSON, token, timeout, dan error jaringan.
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('wesign_token');
  
  // 1. Setup AbortController untuk handling Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
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
  if (config.body && typeof config.body === 'object' && !isFormData) {
    config.body = JSON.stringify(config.body);
  }
  if (isFormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);

    // --- INTERCEPTOR 401 (UNAUTHORIZED) ---
    if (response.status === 401 && !options._retry && endpoint !== '/auth/login') {
      const refreshToken = localStorage.getItem('wesign_refresh_token');

      if (!refreshToken) {
        handleLogout();
        throw new Error('Sesi berakhir. Silakan login kembali.');
      }

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });

          if (refreshRes.ok) {
            const { data } = await refreshRes.json();
            localStorage.setItem('wesign_token', data.token);
            localStorage.setItem('wesign_refresh_token', data.refresh_token);
            isRefreshing = false;
            onTokenRefreshed(data.token);
          } else {
            isRefreshing = false;
            handleLogout();
            throw new Error('Sesi benar-benar berakhir.');
          }
        } catch (e) {
          isRefreshing = false;
          handleLogout();
          throw e;
        }
      }

      // Tunggu refresh selesai, lalu ulangi request asli
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          config.headers['Authorization'] = `Bearer ${newToken}`;
          resolve(apiFetch(endpoint, { ...options, _retry: true }));
        });
      });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Server mengirimkan respons yang tidak dapat dibaca.');
    }

    if (!response.ok) {
      if (response.status === 401) handleLogout();
      const error = new Error(data?.message || data?.error || `Error status: ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Permintaan gagal: Waktu habis.');
    if (err.message === 'Failed to fetch' || !navigator.onLine) {
      throw new Error('Koneksi internet terputus atau tidak stabil.');
    }
    throw err;
  }
}

function handleLogout() {
  localStorage.removeItem('wesign_token');
  localStorage.removeItem('wesign_refresh_token');
  localStorage.removeItem('wesign_user');
  // Hindari loop redirect jika sudah di login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login?expired=true';
  }
}
