/**
 * @file authService.js
 * @description Layanan API untuk operasi autentikasi (Login, Register, Me, Logout).
 *              Berkomunikasi dengan Backend-DigiSign endpoint /api/auth/*
 */

import { apiFetch } from '../../../services/api';

/**
 * Registrasi akun baru.
 * @param {{ name: string, email: string, password: string }} payload
 * @returns {Promise<object>} Data user yang baru dibuat
 */
export async function registerUser({ name, email, password }) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
  return data;
}

/**
 * Login pengguna dan simpan token ke localStorage.
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<object>} Data user + session token
 */
export async function loginUser({ email, password }) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  // Simpan token dari respons server ke localStorage
  if (data?.data?.token) {
    localStorage.setItem('wesign_token', data.data.token);
    localStorage.setItem('wesign_login_at', Date.now().toString()); // ⏱️ Catat waktu login
  }
  if (data?.data?.refresh_token) {
    localStorage.setItem('wesign_refresh_token', data.data.refresh_token);
  }

  return data;
}

/**
 * Ambil data profil pengguna yang sedang login.
 * @returns {Promise<object>} Data user dari token aktif
 */
export async function getMe() {
  return apiFetch('/auth/me', { method: 'GET' });
}

/**
 * Logout pengguna dan hapus token dari localStorage serta database (Blacklist).
 * @returns {Promise<object>} Pesan konfirmasi logout
 */
export async function logoutUser() {
  const refreshToken = localStorage.getItem('wesign_refresh_token');

  try {
    // Beritahu backend untuk mencabut token ini dari database
    const data = await apiFetch('/auth/logout', { 
      method: 'POST', 
      body: { refresh_token: refreshToken } 
    });
    
    return data;
  } catch (err) {
    console.error("Gagal logout di server:", err.message);
  } finally {
    // Apapun yang terjadi, bersihkan local storage agar user keluar
    localStorage.clear();
    window.location.href = '/login';
  }
}
