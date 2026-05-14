import React, { useState, useEffect } from 'react';
import { X, Pencil, Loader2 } from 'lucide-react';
import { updatePackage } from '../api/packageService';

const LABEL_OPTIONS = ['General', 'Legal', 'HR', 'Finance', 'Contract', 'Invoice'];

/**
 * @component EditPackageModal
 * @description Modal untuk edit nama dan kategori paket.
 */
const EditPackageModal = ({ isOpen, pkg, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [label, setLabel] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync state saat pkg berubah
  useEffect(() => {
    if (pkg) {
      setTitle(pkg.title || '');
      setLabel(pkg.label || 'General');
      setError(null);
    }
  }, [pkg]);

  if (!isOpen || !pkg) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama paket tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updatePackage(pkg.id, { title: title.trim(), label });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Pencil size={15} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Edit Paket</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none bg-transparent cursor-pointer transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nama Paket */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Nama Paket
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Masukkan nama paket..."
              disabled={loading}
              className="w-full px-4 py-2.5 text-[13px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 dark:text-white transition-all disabled:opacity-60"
            />
            <p className="text-[10px] text-zinc-400 mt-1 text-right">{title.length}/100</p>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Kategori
            </label>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2.5 text-[13px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 dark:text-white transition-all cursor-pointer disabled:opacity-60"
            >
              {LABEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-[12px] text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 text-[12px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border-none cursor-pointer transition-all disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2.5 text-[12px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl border-none cursor-pointer transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={13} className="animate-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPackageModal;
