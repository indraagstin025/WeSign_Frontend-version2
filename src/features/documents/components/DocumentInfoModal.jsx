import React from 'react';
import { 
  X, 
  Info, 
  User, 
  Clock, 
  CheckCircle2, 
  History,
  Download,
  ExternalLink
} from 'lucide-react';
import { useDocumentInfo } from '../hooks/useDocumentInfo';

const DocumentInfoModal = ({ isOpen, onClose, document, onViewFile, onDownload }) => {
  const { helpers } = useDocumentInfo(document);

  if (!isOpen || !document) return null;

  // Render Badge based on hook config
  const renderStatusBadge = (status) => {
    const config = helpers.getStatusConfig(status);
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 drop-shadow-2xl animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Info size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-heading tracking-tight">Informasi Dokumen</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px] sm:max-w-md">{document.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Overview Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <InfoRow label="Status Saat Ini" value={renderStatusBadge(document.status)} />
              <InfoRow label="ID Dokumen" value={document.id} technical />
              <InfoRow label="Kategori" value={document.type || 'Umum'} />
            </div>
            <div className="space-y-4">
              <InfoRow icon={<Clock size={14} />} label="Diunggah Pada" value={helpers.formatDate(document.createdAt)} />
              <InfoRow icon={<User size={14} />} label="Pemilik" value={document.user?.name || document.userId} />
              <InfoRow label="Total Versi" value={document.versions?.length || 1} />
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Section 2: Signers Table */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-primary" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Daftar Penanda Tangan</h4>
            </div>
            
            {document.signerRequests && document.signerRequests.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/20">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-4 py-3 font-bold text-zinc-500 dark:text-zinc-400">Nama / Email</th>
                      <th className="px-4 py-3 font-bold text-zinc-500 dark:text-zinc-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {document.signerRequests.map((req) => (
                      <tr key={req.id}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-white">{req.user?.name || 'Unknown User'}</span>
                            <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-500">{req.user?.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {req.status === 'SIGNED' ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px]">
                              <CheckCircle2 size={14} /> Sudah Ttd
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold uppercase text-[10px]">
                              <Clock size={14} /> Belum Ttd
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                <p className="text-xs text-zinc-500 dark:text-zinc-500 italic">Dokumen ini bersifat pribadi & belum dibagikan untuk penandatanganan.</p>
              </div>
            )}
          </div>

          {/* Section 3: Version History (Tiny) */}
          {document.versions && document.versions.length > 1 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <History size={18} className="text-primary" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Riwayat Versi</h4>
              </div>
              <div className="space-y-2">
                {document.versions.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800 group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-bold text-zinc-400 w-6">v{document.versions.length - idx}</div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">{helpers.formatDate(v.createdAt)}</div>
                    </div>
                    <button 
                      onClick={() => onDownload(document.id, v.id)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                      title="Unduh Versi Ini"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => onViewFile(document)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all border-none cursor-pointer"
          >
            <ExternalLink size={18} /> Pratinjau Dokumen
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all border-none bg-transparent cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, technical = false }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest whitespace-nowrap">
      {icon} {label}
    </div>
    <div className={`text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate ${technical ? 'font-mono text-[10px] text-zinc-400 break-all whitespace-normal' : ''}`}>
      {value}
    </div>
  </div>
);

export default DocumentInfoModal;
