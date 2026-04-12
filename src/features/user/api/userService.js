/**
 * @file userService.js
 * @description Layanan API untuk manajemen profil dan kuota pengguna.
 *              Berkomunikasi dengan Backend-DigiSign endpoint /api/users/*
 */

import { apiFetch } from '../../../services/api';

/**
 * Mengambil profil lengkap user yang sedang login.
 * @returns {Promise<object>} Data profil user
 */
export async function getMyProfile() {
  return apiFetch('/users/me', {
    method: 'GET',
  });
}

/**
 * Mengambil informasi kuota dan penggunaan (usage) user.
 * @returns {Promise<object>} Data kuota, limit, dan persentase penggunaan
 */
export async function getUserQuota() {
  return apiFetch('/users/me/quota', {
    method: 'GET',
  });
}

/**
 * Memperbarui data profil teks (nama, telepon, dll).
 * @param {object} data - Objek berisi field profil
 * @returns {Promise<object>} Data profil terbaru
 */
export async function updateProfile(data) {
  return apiFetch('/users/me', {
    method: 'PUT',
    body: data,
  });
}

/**
 * Mengunggah foto profil baru.
 * @param {File} file - Objek file gambar dari input
 * @returns {Promise<object>} Data profil terbaru termasuk URL foto
 */
export async function updateProfilePicture(file) {
  const formData = new FormData();
  formData.append('profilePicture', file);
  
  return apiFetch('/users/me', {
    method: 'PUT',
    body: formData,
    timeout: 60000, // 60 detik — upload file memerlukan waktu lebih lama dari request biasa
  });
}

/**
 * Mengambil histori foto profil user.
 * @returns {Promise<object>} Daftar histori foto profil
 */
export async function getProfilePictureHistory() {
  return apiFetch('/users/me/pictures', {
    method: 'GET',
  });
}

/**
 * Menghapus foto profil dari histori.
 * @param {string} pictureId - ID foto yang ingin dihapus
 * @returns {Promise<object>} Status penghapusan
 */
export async function deleteProfilePicture(pictureId) {
  return apiFetch(`/users/me/pictures/${pictureId}`, {
    method: 'DELETE',
  });
}

/**
 * Mengupdate progres tour onboarding user.
 * @param {string} tourKey - ID unik tour
 * @returns {Promise<object>} Status progres terbaru
 */
export async function updateTourProgress(tourKey) {
  return apiFetch('/users/me/tour-progress', {
    method: 'PATCH',
    body: { tourKey },
  });
}
