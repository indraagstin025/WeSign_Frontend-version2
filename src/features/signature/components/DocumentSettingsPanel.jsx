import React from 'react';
import { X, Settings } from 'lucide-react';

/**
 * @component DocumentSettingsPanel
 * @description Panel kanan — Pengaturan Dokumen (Audit Trail + Keamanan).
 * Muncul saat user klik tombol "Pengaturan Dokumen".
 */
const DocumentSettingsPanel = ({ 
  isOpen, 
  onClose, 
  auditTrailMode, 
  onAuditTrailChange,
  encryptPdf = true,
  qrVerification = true,
  lockAfterSigning = false,
  onEncryptChange,
  onQrChange,
  onLockChange,
  showLockAfterSigning = false,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="hidden lg:flex w-72 bg-white dark:bg-zinc-900 border-l border-zinc-100 dark:border-zinc-800 flex-col shrink-0 h-full z-10 animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-zinc-400" />
          <h3 className="text-[12px] font-bold text-zinc-900 dark:text-white uppercase tracking-wide">Pengaturan Dokumen</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 border-none bg-transparent cursor-pointer transition-colors"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        
        {/* AUDIT TRAIL */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Audit Trail <span className="text-zinc-400 dark:text-zinc-500">ⓘ</span>
          </p>

          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="auditTrail" 
                checked={auditTrailMode === 'embedded'} 
                onChange={() => onAuditTrailChange('embedded')}
                className="mt-0.5 w-4 h-4 accent-emerald-500"
              />
              <div>
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Sertakan di dokumen</p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-relaxed">Audit trail akan menjadi bagian dari file PDF.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="auditTrail" 
                checked={auditTrailMode === 'separate'} 
                onChange={() => onAuditTrailChange('separate')}
                className="mt-0.5 w-4 h-4 accent-emerald-500"
              />
              <div>
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">File terpisah</p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-relaxed">Audit trail akan dibuat sebagai file PDF terpisah.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="radio" 
                name="auditTrail" 
                checked={auditTrailMode === 'none'} 
                onChange={() => onAuditTrailChange('none')}
                className="mt-0.5 w-4 h-4 accent-emerald-500"
              />
              <div>
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Tanpa audit trail</p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-relaxed">Dokumen tidak akan menyertakan informasi audit trail.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* PENGATURAN KEAMANAN */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Pengaturan Keamanan</p>

          <div className="space-y-2.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={encryptPdf} 
                onChange={(e) => onEncryptChange?.(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-500 rounded"
              />
              <div>
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Enkripsi PDF</p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Melindungi dokumen dengan enkripsi.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={qrVerification} 
                onChange={(e) => onQrChange?.(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-500 rounded"
              />
              <div>
                <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">QR Verification</p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Tambahkan QR untuk verifikasi dokumen.</p>
              </div>
            </label>

            {showLockAfterSigning && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={lockAfterSigning} 
                  onChange={(e) => onLockChange?.(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-emerald-500 rounded"
                />
                <div>
                  <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Lock after signing</p>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Kunci dokumen setelah semua pihak menandatangani.</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Link Pengaturan Lanjutan */}
        <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline bg-transparent border-none cursor-pointer p-0">
          ⚙ Pengaturan lanjutan
        </button>
      </div>
    </aside>
  );
};

export default DocumentSettingsPanel;
