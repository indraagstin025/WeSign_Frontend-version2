import React, { useState, useCallback } from 'react';
import { useUserQuota } from './useUserQuota';
import { useUserProfile } from './useUserProfile';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * @hook useProfilePage
 * @description Page-level hook for ProfilePage, orchestrating multiple sub-hooks
 *              and managing UI-specific states (Modals, Tabs).
 */
export const useProfilePage = () => {
    const { quota, loading: loadingQuota, error: errorQuota, refreshQuota } = useUserQuota();
    const { 
        user, 
        pictureHistory,
        formData, 
        fieldErrors,
        loading: loadingProfile, 
        isUpdating, 
        isUploadingPicture,
        error: errorProfile, 
        handleInputChange, 
        handleUpdateProfile,
        handleUploadPicture,
        handleSelectOldPicture,
        handleDeletePicture,
        validateForm
    } = useUserProfile();

    // --- UI States: Tabs & Modals ---
    const [activeTab, setActiveTab] = useState('pribadi');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        variant: 'info',
        onConfirm: null,
        confirmText: 'Ya, Lanjutkan',
        icon: null
    });

    const closeModal = useCallback(() => setModal(prev => ({ ...prev, isOpen: false })), []);

    // --- Action Handlers: Avatar & Profile ---

    const onAvatarUpload = useCallback(async (file) => {
        setIsUploadModalOpen(false); // Close upload modal immediately
        const result = await handleUploadPicture(file);
        
        setModal({
            isOpen: true,
            title: result.success ? 'Berhasil' : (result.isDuplicate ? 'Informasi' : 'Gagal'),
            message: result.message,
            variant: result.success ? 'info' : (result.isDuplicate ? 'warning' : 'danger'),
            confirmText: 'Tutup',
            onConfirm: closeModal,
            cancelText: null,
            icon: result.success 
                ? <CheckCircle2 className="text-emerald-500" size={40} />
                : <AlertCircle className={result.isDuplicate ? "text-amber-500" : "text-red-500"} size={40} />
        });
    }, [handleUploadPicture, closeModal]);

    const onSelectOldAvatar = useCallback(async (id) => {
        const result = await handleSelectOldPicture(id);
        setModal({
            isOpen: true,
            title: result.success ? 'Berhasil' : 'Gagal',
            message: result.message,
            variant: result.success ? 'info' : 'danger',
            confirmText: 'Selesai',
            onConfirm: closeModal,
            cancelText: null
        });
    }, [handleSelectOldPicture, closeModal]);

    const onDeleteAvatarHistory = useCallback((id) => {
        setModal({
            isOpen: true,
            title: 'Hapus Foto?',
            message: 'Tindakan ini akan menghapus foto dari riwayat secara permanen.',
            variant: 'danger',
            confirmText: 'Ya, Hapus',
            onConfirm: async () => {
                closeModal();
                const result = await handleDeletePicture(id);
                setModal({
                    isOpen: true,
                    title: result.success ? 'Terhapus' : 'Gagal',
                    message: result.message,
                    variant: result.success ? 'info' : 'danger',
                    confirmText: 'Tutup',
                    onConfirm: closeModal,
                    cancelText: null
                });
            },
            cancelText: 'Batal'
        });
    }, [handleDeletePicture, closeModal]);

    const executeSave = useCallback(async () => {
        closeModal(); 
        const result = await handleUpdateProfile();
        
        setModal({
            isOpen: true,
            title: result.success ? 'Berhasil Diperbarui' : 'Gagal Menyimpan',
            message: result.message,
            variant: result.success ? 'info' : 'danger',
            confirmText: 'Tutup',
            onConfirm: closeModal,
            cancelText: null,
            icon: result.success 
                ? <CheckCircle2 className="text-emerald-500" size={40} />
                : <AlertCircle className="text-red-500" size={40} />
        });
    }, [handleUpdateProfile, closeModal]);

    const handleSave = useCallback(() => {
        const isValid = validateForm();
        if (!isValid) return;

        setModal({
            isOpen: true,
            title: 'Konfirmasi Perubahan',
            message: 'Apakah Anda yakin ingin menyimpan perubahan pada profil Anda?',
            variant: 'info',
            confirmText: 'Ya, Simpan',
            onConfirm: executeSave,
            cancelText: 'Batal',
            icon: null
        });
    }, [validateForm, executeSave]);

    // --- Derived States ---
    const isLoading = loadingQuota || loadingProfile;
    const error = errorQuota || errorProfile;

    return {
        // Data & Hooks Status
        data: {
          user,
          quota,
          pictureHistory,
          formData,
          fieldErrors,
          isLoading,
          isUpdating,
          isUploadingPicture,
          error,
        },
        // UI States
        ui: {
          activeTab,
          setActiveTab,
          isUploadModalOpen,
          setIsUploadModalOpen,
          modal,
          closeModal,
        },
        // Actions
        actions: {
          handleInputChange,
          handleSave,
          onAvatarUpload,
          onSelectOldAvatar,
          onDeleteAvatarHistory,
          refreshQuota,
        }
    };
};
