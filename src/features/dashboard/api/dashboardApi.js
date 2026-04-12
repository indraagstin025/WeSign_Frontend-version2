import { apiFetch } from '../../../services/api';

/**
 * @namespace dashboardApi
 * @description Menyediakan akses ke endpoint backend Dashboard (/api/dashboard).
 */
export const dashboardApi = {
  /**
   * Mengambil ringkasan dashboard lengkap (Counts, Actions, Activities).
   * @returns {Promise<Object>} Data dashboard dari backend.
   */
  getSummary: async () => {
    try {
      const response = await apiFetch('/dashboard');
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Gagal memuat data dashboard.');
    } catch (error) {
      console.error('[dashboardApi] getSummary error:', error);
      throw error;
    }
  }
};
