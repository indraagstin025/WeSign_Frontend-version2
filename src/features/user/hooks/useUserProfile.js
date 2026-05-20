import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../../../context/UserContext';
import { updateProfile, updateProfilePicture, getProfilePictureHistory, deleteProfilePicture as apiDeletePicture } from '../api/userService';

/**
 * @hook useUserProfile
 * @description Hook kustom untuk mengambil dan memperbarui data profil pengguna.
 */
export const useUserProfile = () => {
    const { user, setUser, loading: globalLoading } = useUser();
    const [pictureHistory, setPictureHistory] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || user?.phone || '',
        title: user?.title || '',
        address: user?.address || ''
    });

    const [fieldErrors, setFieldErrors] = useState({});

    /**
     * Memuat histori foto profil.
     */
    const fetchPictureHistory = useCallback(async () => {
        try {
            const response = await getProfilePictureHistory();
            if (response?.status === 'success') {
                setPictureHistory(response.data || []);
            }
        } catch (err) {
            console.error('[useUserProfile] Fetch History Error:', err);
        }
    }, []);

    /**
     * [FE-10] Effect 1: sync formData saat user object dari context berubah
     *   (mis. setelah update profile sukses, `setUser(updatedData)` ganti
     *   reference user). Ini efek murah (cuma copy field), aman re-fire.
     */
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || user.phone || '',
                title: user.title || '',
                address: user.address || ''
            });
        }
    }, [user]);

    /**
     * [FE-10] Effect 2: fetch picture history hanya saat user.id berubah
     *   (mount + login switch), bukan setiap user object reference berubah.
     *
     *   Sebelumnya kedua sync formData + fetchPictureHistory berbarengan di
     *   1 effect dengan deps `[user, fetchPictureHistory]` → setiap update
     *   profile (yang memanggil `setUser(updatedData)` di context) akan
     *   re-fire effect dan hit `/users/me/pictures` berulang. Untuk user yang
     *   edit nama 1 char, ini extra request yang tidak perlu.
     *
     *   Sekarang deps `user?.id` lebih stabil — picture history hanya
     *   re-fetch saat user benar-benar berbeda (login dengan akun lain).
     *   Untuk update history setelah upload/delete picture, handler explicit
     *   panggil `fetchPictureHistory()` (sudah ada di handleUploadPicture,
     *   handleSelectOldPicture, handleDeletePicture).
     */
    useEffect(() => {
        if (!user?.id) return;
        fetchPictureHistory();
    }, [user?.id, fetchPictureHistory]);

    /**
     * Handler untuk perubahan input form (onChange).
     */
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    /**
     * Validasi dasar di sisi client.
     */
    const validateForm = () => {
        const errors = {};
        const name = formData.name?.trim();
        const title = formData.title?.trim();
        const address = formData.address?.trim();
        const phone = formData.phoneNumber?.trim();

        if (!name) errors.name = "Nama Lengkap tidak boleh kosong.";
        else if (name.length > 100) errors.name = "Nama maksimal 100 karakter.";
        
        if (!title) errors.title = "Jabatan / Profesi tidak boleh kosong.";
        else if (title.length > 100) errors.title = "Jabatan maksimal 100 karakter.";
        
        if (!address) errors.address = "Alamat tidak boleh kosong.";
        else if (address.length > 500) errors.address = "Alamat maksimal 500 karakter.";

        if (!phone) errors.phoneNumber = "Nomor Telepon tidak boleh kosong.";
        else if (!/^[0-9+]{10,15}$/.test(phone)) {
            errors.phoneNumber = "Format nomor telepon tidak valid.";
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Mengunggah foto profil baru dengan penanganan duplikasi.
     */
    const handleUploadPicture = async (file) => {
        if (!file || isUploadingPicture) return;
        
        setIsUploadingPicture(true);
        setError(null);
        
        try {
            const response = await updateProfilePicture(file);
            if (response?.status === 'success') {
                const userData = response.data?.user || response.data;
                setUser(userData);
                await fetchPictureHistory(); // Update history
                return { success: true, message: 'Foto profil berhasil diperbarui.' };
            } else {
                throw new Error(response?.message || 'Gagal mengunggah foto.');
            }
        } catch (err) {
            console.error('[useUserProfile] Upload Picture Error:', err);
            
            // Mencocokkan kode error dari Backend-DigiSign (DUPLICATE_PROFILE_PICTURE)
            const isDuplicate = err.data?.code === 'DUPLICATE_PROFILE_PICTURE' || 
                                err.message?.toLowerCase().includes('pernah') ||
                                err.message?.toLowerCase().includes('duplicate');

            let userFriendlyMessage = err.message;
            if (isDuplicate) {
                userFriendlyMessage = 'Foto ini sudah pernah diunggah sebelumnya. Tidak perlu diunggah ulang.';
            }
            
            // Hapus setError di sini agar tidak memicu layar error "Koneksi Gagal" di ProfilePage
            // Pesan akan tetap dikirim via return object ke Modal
            return { success: false, message: userFriendlyMessage, isDuplicate };
        } finally {
            setIsUploadingPicture(false);
        }
    };

    /**
     * Menggunakan foto lama dari history.
     */
    const handleSelectOldPicture = async (profilePictureId) => {
        if (!profilePictureId || isUpdating) return;
        setIsUpdating(true);
        setError(null);
        try {
            // Kita kirim body { profilePictureId } ke endpoint PUT /users/me
            const response = await updateProfile({ profilePictureId });
            if (response?.status === 'success') {
                const userData = response.data?.user || response.data;
                setUser(userData);
                await fetchPictureHistory(); // Refresh history untuk update status active
                return { success: true, message: 'Foto profil berhasil diubah.' };
            } else {
                throw new Error(response?.message || 'Gagal mengubah foto.');
            }
        } catch (err) {
            // Hapus setError agar tidak memicu layar "Koneksi Gagal" di ProfilePage
            return { success: false, message: err.message };
        } finally {
            setIsUpdating(false);
        }
    };

    /**
     * Menghapus foto dari history.
     */
    const handleDeletePicture = async (pictureId) => {
        if (!pictureId || isUpdating) return;
        setIsUpdating(true);
        try {
            const response = await apiDeletePicture(pictureId);
            if (response?.status === 'success') {
                await fetchPictureHistory();
                return { success: true, message: 'Foto berhasil dihapus dari histori.' };
            } else {
                throw new Error(response?.message || 'Gagal menghapus foto.');
            }
        } catch (err) {
            return { success: false, message: err.message };
        } finally {
            setIsUpdating(false);
        }
    };

    /**
     * Menyimpan perubahan profil teks.
     */
    const handleUpdateProfile = async () => {
        if (isUpdating) return;
        
        // Jalankan validasi
        const isValid = validateForm();
        if (!isValid) return { success: false, message: "Mohon lengkapi formulir sesuai ketentuan." };

        setIsUpdating(true);
        setError(null);
        try {
            const response = await updateProfile(formData);
            if (response?.status === 'success') {
                const updatedData = response.data?.user || response.data;
                setUser(updatedData); // Sinkronisasi ke Global Context!
                return { success: true, message: 'Profil berhasil diperbarui.' };
            } else {
                throw new Error(response?.message || 'Gagal menyimpan perubahan.');
            }
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        user,
        pictureHistory,
        formData,
        fieldErrors,
        loading: globalLoading,
        isUpdating,
        isUploadingPicture,
        error,
        handleInputChange,
        handleUpdateProfile,
        handleUploadPicture,
        handleSelectOldPicture,
        handleDeletePicture,
        validateForm
    };
};


