import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Layers, 
  Trash2, 
  PenTool, 
  CheckCircle2, 
  Loader2, 
  Save, 
  XOctagon,
  Eye
} from 'lucide-react';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { usePackageInfo } from '../hooks/usePackageInfo';

const PackageInfoModal = ({ isOpen, pkg, onClose, onRefresh, onDelete }) => {
  const navigate = useNavigate();
  
  const {
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
  } = usePackageInfo(isOpen, pkg, onRefresh, onClose);

  if (!isOpen || !pkg) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 drop-shadow-2xl animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={handleClose} />
        
        <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading tracking-tight text-left flex items-center gap-2">
                  Detail Paket
                  <button 
                    onClick={() => {
                      if (pkg?.id) navigate(`/dashboard/packages/preview/${pkg.id}`);
                    }}
                    className="p-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary border-none cursor-pointer transition-colors"
                    title="Buka Playlist Pratinjau"
                  >
                    <Eye size={14} />
                  </button>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-left">Informasi dan isi dokumen di dalam antrean paket</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto w-full p-6">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Memuat isi paket...</p>
                </div>
            ) : error ? (
                <div className="text-center py-10 text-rose-500 text-sm font-medium">{error}</div>
            ) : details && (
              <div className="space-y-6">
                {/* Info & Edit Card */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700/80">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        {isEditing ? (
                           <div className="space-y-3">
                              <input 
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-bold text-zinc-900 dark:text-white"
                                placeholder="Judul Paket"
                              />
                              <select 
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer"
                              >
                                <option value="General">Umum (General)</option>
                                <option value="Contract">Kontrak / Perjanjian</option>
                                <option value="Invoice">Invoice / Faktur</option>
                                <option value="Certificate">Sertifikat / Bukti</option>
                              </select>
                           </div>
                        ) : (
                          <>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{details.title || 'Tanpa Judul'}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase ${details.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                                    {details.status}
                                </span>
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded-md">{details.label || 'Umum'}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Edit Button */}
                      {!isEditing ? (
                          <button onClick={() => setIsEditing(true)} title="Ubah Nama Paket" className="p-2 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors shadow-sm text-zinc-500 dark:text-zinc-300">
                             <PenTool size={16} />
                          </button>
                      ) : (
                          <div className="flex gap-2">
                              {saving ? (
                                  <div className="p-2 border border-zinc-200 rounded-xl"><Loader2 size={16} className="animate-spin text-primary" /></div>
                              ) : (
                                  <>
                                    <button onClick={handleSaveEdit} className="p-2 bg-primary dark:bg-primary border border-primary rounded-xl hover:bg-primary-dark transition-colors shadow-sm text-white"><Save size={16} /></button>
                                    <button onClick={() => setIsEditing(false)} className="p-2 bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors shadow-sm text-zinc-500"><XOctagon size={16} /></button>
                                  </>
                              )}
                          </div>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                      <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Dibuat Pada</p>
                          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{new Date(details.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                      </div>
                      <div>
                          <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Total Dokumen</p>
                          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{details.documents?.length || 0} File PDF</p>
                      </div>
                  </div>
                </div>

                {/* Sub-Documents List */}
                <div>
                   <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-3">Isi Dokumen di dalam Paket</h4>
                   <div className="space-y-3">
                       {details.documents?.map((item, idx) => {
                           const doc = item.docVersion?.document;
                           return (
                               <div key={item.id} className="flex gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm items-center hover:border-primary/30 transition-colors">
                                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0 font-bold">
                                     {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{doc?.title || 'Dokumen Tidak Diketahui'}</p>
                                      <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-mono">ID: {item.docVersionId.split('-')[0]}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => navigate(`/dashboard/documents/preview/${doc?.id}`, { state: { from: '/dashboard/packages' } })}
                                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors border-none bg-transparent cursor-pointer"
                                      title="Pratinjau Dokumen Ini"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    {details.status === "completed" ? (
                                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                                         <CheckCircle2 size={16} />
                                      </div>
                                    ) : (
                                      <button 
                                        onClick={() => navigate(`/dashboard/packages/sign/${pkg.id}`)}
                                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500 transition-colors border-none bg-transparent cursor-pointer"
                                        title="Tanda Tangani Paket"
                                      >
                                        <PenTool size={14} />
                                      </button>
                                    )}
                                  </div>
                               </div>
                           );
                       })}
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-3xl">
              <button 
                 onClick={() => setShowDeleteConfirm(true)}
                 disabled={details?.status === 'completed' || loading}
                 className="px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-sm font-bold rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-none cursor-pointer"
              >
                 <Trash2 size={16} /> Hapus Paket
              </button>
              <button 
                 onClick={handleClose}
                 className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl shadow-md transition-colors border-none cursor-pointer"
              >
                 Tutup
              </button>
          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete();
            onClose();
        }}
        title="Hapus Paket Ini?"
        message="Anda yakin ingin menghapus seluruh paket beserta seluruh dokumen PDF di dalamnya? Aksi ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus Paket"
        cancelText="Batal"
        variant="danger"
      />
    </>
  );
};

export default PackageInfoModal;
