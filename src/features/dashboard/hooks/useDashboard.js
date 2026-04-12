import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api/dashboardApi';

/**
 * @hook useDashboard
 * @description Hook untuk mengelola data dashboard (counts, actions, activities).
 */
export const useDashboard = () => {
  const [data, setData] = useState({
    counts: { waiting: 0, process: 0, completed: 0 },
    actions: [],
    activities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await dashboardApi.getSummary();
      setData(summary);
    } catch (err) {
      setError(err.message || 'Gagal mengambil data dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    ...data,
    loading,
    error,
    refresh: fetchDashboard
  };
};
