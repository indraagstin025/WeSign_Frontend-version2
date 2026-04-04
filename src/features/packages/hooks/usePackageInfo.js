import { useState, useEffect, useCallback } from 'react';
import { getPackageDetails, updatePackage } from '../api/packageService';

/**
 * Hook for managing the logic of the Package Info Modal.
 * Handles fetching details, editing, and deletion state.
 */
export const usePackageInfo = (isOpen, pkg, onRefresh, onClose) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Fetch package details from the API
   */
  const fetchPackageDetails = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPackageDetails(id);
      if (response?.status === 'success') {
        setDetails(response.data);
        setEditTitle(response.data.title || '');
        setEditCategory(response.data.label || 'General');
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat detail paket.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync data when modal opens
  useEffect(() => {
    if (isOpen && pkg?.id) {
      fetchPackageDetails(pkg.id);
      setIsEditing(false);
    }
  }, [isOpen, pkg, fetchPackageDetails]);

  /**
   * Update package information
   */
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await updatePackage(pkg.id, { title: editTitle, label: editCategory });
      setDetails((prev) => ({ ...prev, title: editTitle, label: editCategory }));
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui paket.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Wrapper for closing the modal with safety checks
   */
  const handleClose = useCallback(() => {
    if (saving || showDeleteConfirm) return;
    setDetails(null);
    setIsEditing(false);
    onClose();
  }, [saving, showDeleteConfirm, onClose]);

  return {
    details,
    loading,
    error,
    isEditing,
    setIsEditing,
    editTitle,
    setEditTitle,
    editCategory,
    setEditCategory,
    saving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleSaveEdit,
    handleClose
  };
};
