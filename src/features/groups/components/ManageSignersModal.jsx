import React, { useState, useEffect } from 'react';
import { X, Users, CheckSquare, Square, Loader2, Save } from 'lucide-react';
import { updateDocumentSigners } from '../api/groupService';

/**
 * @component ManageSignersModal
 * @description Modal untuk menambah/mengubah daftar penandatangan dokumen.
 * Hanya admin yang dapat membuka modal ini.
 * Saat submit:
 *   - Jika ada signer dipilih  → status dokumen = PENDING
 *   - Jika semua dikosongkan   → status dokumen = DRAFT
 */
const ManageSignersModal = ({ isOpen, onClose, groupId, doc, members = [], onSuccess }) => {
  const [selectedSigners, setSelectedSigners] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill signer yang sudah dipilih sebelumnya
  useEffect(() => {
    if (!isOpen || !doc) return;
    const existing = doc.signerRequests?.map((sr) => sr.userId) || [];
    setSelectedSigners(existing);
    setError(null);
  }, [isOpen, doc]);

  if (!isOpen || !doc) return null;

  const toggleSigner = (userId) => {
    setSelectedSigners((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleAll = () => {
    const allIds = members.map((m) => m.userId || m.id);
    setSelectedSigners((prev) => prev.length === allIds.length ? [] : allIds);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await updateDocumentSigners(groupId, doc.id, selectedSigners);
      if (res.status === 'success') {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Gagal mengubah penandatangan.');
    } finally {
      setIsSaving(false);
    }
  };

  const willBeDraft = selectedSigners.length === 0;

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white">Kelola Penandatangan</h3>
            <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs">{doc.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Status badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border
            ${willBeDraft
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${willBeDraft ? 'bg-amber-400' : 'bg-emerald-500'}`} />
            {willBeDraft
              ? 'Status akan menjadi DRAFT (tidak ada penandatangan)'
              : `${selectedSigners.length} penandatangan dipilih → status PENDING`
            }
          </div>

          {/* Daftar Member */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users size={11} /> Pilih Penandatangan
              </label>
              {members.length > 0 && (
                <button onClick={toggleAll} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-transparent border-none cursor-pointer hover:underline">
                  {selectedSigners.length === members.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </button>
              )}
            </div>

            {members.length === 0 ? (
              <p className="text-xs text-zinc-400 italic text-center py-6">Belum ada anggota di grup ini.</p>
            ) : (
              <div className="space-y-1.5">
                {members.map((member) => {
                  const userId = member.userId || member.id;
                  const name = member.user?.name || member.name || 'User';
                  const email = member.user?.email || member.email || '';
                  const avatarUrl = member.user?.profilePictureUrl;
                  const initials = name.trim().split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                  const isSelected = selectedSigners.includes(userId);
                  // Cek apakah signer ini sudah SIGNED (tidak bisa diubah)
                  const signerRecord = doc.signerRequests?.find((sr) => sr.userId === userId);
                  const isSigned = signerRecord?.status === 'SIGNED';

                  return (
                    <div
                      key={userId}
                      onClick={() => !isSigned && toggleSigner(userId)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
                        ${isSigned ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                        ${isSelected
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                    >
                      {isSelected
                        ? <CheckSquare size={16} className="text-emerald-600 flex-shrink-0" />
                        : <Square size={16} className="text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
                      }
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                        {avatarUrl
                          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-zinc-300 dark:bg-zinc-600 flex items-center justify-center text-[9px] font-black text-white">{initials}</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 truncate">{name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{email}</p>
                      </div>
                      {isSigned && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
                          Sudah TTD
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-none bg-transparent cursor-pointer transition-all">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border-none transition-all
              ${isSaving ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20'}`}
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageSignersModal;
