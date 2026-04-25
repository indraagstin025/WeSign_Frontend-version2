import React from 'react';
import { X, Upload, FileImage, AlertCircle, Loader2 } from 'lucide-react';
import { useAvatarUpload } from '../hooks/useAvatarUpload';

/**
 * @component AvatarUploadModal
 * @description Modal interaktif untuk mengunggah foto profil dengan validasi dan pratinjau.
 */
const AvatarUploadModal = ({ isOpen, onClose, onUpload, isUploading }) => {
  const {
    states: {
      selectedFile,
      previewUrl,
      localError,
      fileInputRef,
    },
    handlers: {
      handleFileChange,
      handleDragOver,
      handleDrop,
      handleSubmit,
      clearSelection,
      resetAndClose,
    }
  } = useAvatarUpload(onUpload, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" 
        onClick={!isUploading ? resetAndClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-white uppercase tracking-tight">Ganti Foto Profil</h3>
          {!isUploading && (
            <button 
              onClick={resetAndClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area / Preview */}
          {!previewUrl ? (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-3xl p-10 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group"
            >
              <div className="p-4 bg-primary/5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="text-primary" size={32} />
              </div>
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Klik atau seret foto ke sini</p>
              <p className="text-xs text-zinc-400 mt-2">JPG, PNG, atau WEBP</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-primary/20 shadow-xl relative">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <Loader2 className="text-white animate-spin" size={24} />
                  </div>
                )}
              </div>
              {!isUploading && (
                <button 
                  onClick={clearSelection}
                  className="text-xs font-bold text-zinc-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                >
                  Ganti Pilihan
                </button>
              )}
            </div>
          )}

          {/* Requirements Info */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex gap-3">
            <div className="text-primary mt-0.5">
              <FileImage size={18} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Persyaratan Upload</p>
              <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>• Format: **JPG, PNG, WEBP**</li>
                <li>• Ukuran Maksimal: **5 MB**</li>
              </ul>
            </div>
          </div>

          {/* Error Message */}
          {localError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl animate-shake">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-[11px] font-medium text-red-600 dark:text-red-400">{localError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isUploading ? (
              <>
                <button 
                  onClick={resetAndClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!selectedFile}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  Unggah Foto
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-3 bg-primary/10 rounded-xl gap-3">
                <Loader2 className="text-primary animate-spin" size={18} />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">Sedang Mengirim...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarUploadModal;
