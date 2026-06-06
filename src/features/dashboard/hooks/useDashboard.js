import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api/dashboardApi';

/**
 * @hook useDashboard
 * @description Hook untuk mengelola data dashboard (counts, actions, activities).
 */
export const useDashboard = () => {
  const [data, setData] = useState({
    counts: { waiting: 0, process: 0, completed: 0, total: 0, actionRequired: 0 },
    actions: [],
    activities: [],
    recentDocuments: [],
    activeSignings: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await dashboardApi.getSummary();
      setData(normalizeDashboardSummary(summary));
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

const normalizeDashboardSummary = (summary = {}) => {
  const actions = Array.isArray(summary.actions) ? summary.actions : [];
  const activities = Array.isArray(summary.activities) ? summary.activities : [];
  const activeSignings = actions
    .filter((item) => ['NEED_SIGNATURE', 'NEED_YOUR_SIGNATURE', 'DRAFT'].includes(item?.status))
    .map(normalizeActionItem);

  const waiting = Number(summary.counts?.waiting || 0);
  const process = Number(summary.counts?.process || 0);
  const completed = Number(summary.counts?.completed || 0);

  return {
    counts: {
      waiting,
      process,
      completed,
      total: waiting + process + completed,
      actionRequired: activeSignings.length,
    },
    actions,
    activities,
    activeSignings,
    recentDocuments: activities.map(normalizeActivityItem),
  };
};

const normalizeActionItem = (item) => ({
  id: item.id,
  title: item.title || 'Untitled',
  ownerName: item.ownerName || '-',
  status: item.status,
  type: item.type || 'document',
  updatedAt: item.updatedAt,
  groupId: item.groupId,
  count: item.count || 0,
});

const normalizeActivityItem = (item) => ({
  id: item.id,
  title: item.title || 'Untitled',
  status: item.status || 'UNKNOWN',
  type: item.type || 'document',
  activityType: item.activityType || 'update',
  updatedAt: item.updatedAt,
  groupId: item.groupId,
});
