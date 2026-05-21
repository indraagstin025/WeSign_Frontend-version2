/**
 * @file authService.js
 * @description Layanan API untuk operasi autentikasi (Login, Register, Me, Logout).
 *              Berkomunikasi dengan Backend-DigiSign endpoint /api/auth/*
 */

import { apiFetch } from "../../../services/api";
import { createLogger } from "../../../utils/logger";

// [L-5] Scoped logger agar console output konsisten dengan service lain.
// Sebelumnya pakai console.warn/error langsung tanpa prefix.
const log = createLogger("AuthService");

/**
 * Registrasi akun baru.
 * @param {{ name: string, email: string, password: string, isCompany?: boolean }} payload
 * @returns {Promise<object>} Data user yang baru dibuat
 */
export async function registerUser({ name, email, password, isCompany }) {
  const data = await apiFetch("/auth/register", {
    method: "POST",
    body: { name, email, password, isCompany },
  });
  return data;
}

/**
 * Login pengguna dan simpan token ke localStorage.
 *
 * [M-4] Bersihkan auth state lama sebelum request login. Sebelumnya kalau
 * user pernah login dengan akun A, lalu logout incomplete (mis. tab
 * crash sebelum logout API selesai), token akun A tertinggal di
 * localStorage. Saat login akun B, request akan kirim Authorization:
 * Bearer <tokenA> -> backend reject 401 -> trigger refresh -> chain
 * confusing. Clear duluan agar request login truly anonymous.
 *
 * @param {{ email: string, password: string, rememberMe?: boolean }} payload
 * @returns {Promise<object>} Data user + session token
 */
export async function loginUser({ email, password, rememberMe }) {
  // [M-4] Clear stale auth state before fresh login.
  // Tidak hapus 'wesign_user' di sini — dibiarkan agar UI lama (kalau ada
  // route protect lambat) tidak flash logout. UserContext.refreshUser()
  // akan overwrite setelah login sukses.
  localStorage.removeItem("wesign_token");
  localStorage.removeItem("wesign_refresh_token");
  localStorage.removeItem("wesign_csrf_token");
  localStorage.removeItem("wesign_login_at");

  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: { email, password, rememberMe },
  });

  // Simpan token dari respons server ke localStorage
  if (data?.data?.token) {
    localStorage.setItem("wesign_token", data.data.token);
    localStorage.setItem("wesign_login_at", Date.now().toString()); // ⏱️ Catat waktu login
  }
  if (data?.data?.refresh_token) {
    localStorage.setItem("wesign_refresh_token", data.data.refresh_token);
  }

  return data;
}

/**
 * Ambil data profil pengguna yang sedang login.
 * @returns {Promise<object>} Data user dari token aktif
 */
export async function getMe() {
  return apiFetch("/auth/me", { method: "GET" });
}

/**
 * Wrapper untuk ambil CSRF token explicitly (opsional, biasanya automatic via /auth/me)
 */
export async function getCsrfToken() {
  try {
    const response = await getMe();
    if (response?.data?.csrfToken) {
      localStorage.setItem("wesign_csrf_token", response.data.csrfToken);
      return response.data.csrfToken;
    }
  } catch (err) {
    log.warn("Failed to fetch CSRF token:", err.message);
  }
  return null;
}

/**
 * Logout pengguna dan hapus token dari localStorage serta database (Blacklist).
 * @returns {Promise<object>} Pesan konfirmasi logout
 */
export async function logoutUser() {
  const refreshToken = localStorage.getItem("wesign_refresh_token");

  try {
    // Beritahu backend untuk mencabut token ini dari database
    const data = await apiFetch("/auth/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
    });

    return data;
  } catch (err) {
    log.error("Gagal logout di server:", err.message);
  } finally {
    // Hapus hanya data autentikasi, bukan SEMUA localStorage
    localStorage.removeItem("wesign_token");
    localStorage.removeItem("wesign_refresh_token");
    localStorage.removeItem("wesign_csrf_token");
    localStorage.removeItem("wesign_user");
    localStorage.removeItem("wesign_login_at");
    window.location.href = "/login";
  }
}

/**
 * Meminta link reset password melalui email (mocking log).
 * @param {string} email
 * @returns {Promise<object>} Pesan sukses dari server
 */
export async function forgotPassword(email) {
  return await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/**
 * Mereset password menggunakan secure token.
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<object>} Pesan sukses
 */
export async function resetPassword(token, newPassword) {
  return await apiFetch("/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}
