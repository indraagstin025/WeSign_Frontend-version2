import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPackages, deletePackage } from '../api/packageService';

export const usePackages = () => {
    const navigate = useNavigate();

    // --- STATE DATA ---
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    // --- STATE MODAL ---
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [infoPkg, setInfoPkg] = useState(null);
    const [deletePkg, setDeletePkg] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- FETCH DATA ---
    const fetchPackages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getAllPackages();
            if (response?.status === 'success') {
                setPackages(response.data);
            }
        } catch (err) {
            setError(err.message || 'Gagal mengambil daftar paket. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    // --- FILTERED DATA (Client Side) ---
    const filteredPackages = packages.filter(pkg => {
        const matchesStatus = !status || pkg.status?.toLowerCase() === status.toLowerCase();
        const matchesSearch = !search || pkg.title?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // --- HANDLERS ---
    const handleAction = async (type, pkg) => {
        switch (type) {
            case 'sign':
                if (pkg.status?.toLowerCase() === 'completed') {
                    alert('Paket ini sudah selesai dan tidak dapat ditandatangani ulang.');
                    return;
                }
                navigate(`/dashboard/packages/sign/${pkg.id}`);
                break;
            case 'info':
                setInfoPkg(pkg);
                break;
            case 'preview':
                navigate(`/dashboard/packages/preview/${pkg.id}`);
                break;
            case 'download':
                alert('Fitur download zip paket akan segera hadir.');
                break;
            case 'delete':
                setDeletePkg(pkg);
                break;
            default:
                break;
        }
    };

    const handleConfirmDelete = async (pkgToDelete = null) => {
        const target = pkgToDelete || deletePkg;
        if (!target) return;
        setIsDeleting(true);
        try {
            await deletePackage(target.id);
            if (deletePkg && target.id === deletePkg.id) setDeletePkg(null);
            fetchPackages();
        } catch (err) {
            alert(err.message || 'Gagal menghapus paket.');
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        packages: filteredPackages,
        loading,
        error,
        filters: {
            status,
            setStatus,
            search,
            setSearch
        },
        actions: {
            refresh: fetchPackages,
            handleAction,
            handleConfirmDelete
        },
        modals: {
            upload: {
                isOpen: isUploadModalOpen,
                setOpen: setIsUploadModalOpen,
            },
            info: {
                data: infoPkg,
                setOpen: (val) => !val && setInfoPkg(null),
            },
            delete: {
                data: deletePkg,
                setOpen: (val) => !val && setDeletePkg(null),
                isDeleting
            }
        }
    };
};
