import React from 'react';
import { Camera, ShieldCheck, Loader2 } from 'lucide-react';

/**
 * @component ProfileBanner
 * @description Header profil dengan latar belakang gradien premium dan avatar terintegrasi.
 */
const ProfileBanner = ({ user, onOpenModal, isUploading }) => {
  return (
    <div className="relative mb-20 animate-fade-in-up">
      {/* Banner Background */}
      <div className="h-48 w-full rounded-2xl bg-gradient-to-r from-primary to-primary-dark overflow-hidden relative shadow-lg shadow-primary/10">
        {/* Dekorasi Abstrak */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl" />
      </div>

      {/* Avatar Holder */}
      <div className="absolute -bottom-16 left-8 flex items-end gap-6">
        <div className="relative group">
          <div className={`w-32 h-32 rounded-3xl bg-white p-1.5 shadow-xl shadow-black/10 border border-white/50 overflow-hidden relative ${isUploading ? 'opacity-50' : ''}`}>
            <img 
              src={user?.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D9488&color=fff&size=128`} 
              alt={user?.name}
              className={`w-full h-full object-cover rounded-2xl transition-transform duration-500 ${!isUploading && 'group-hover:scale-110'}`}
            />
            
            {/* Loading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] rounded-2xl">
                <Loader2 className="text-primary animate-spin" size={24} />
              </div>
            )}
          </div>
          
          {/* Tombol Ganti Foto (Membuka Modal) */}
          <button 
            onClick={onOpenModal}
            disabled={isUploading}
            className={`absolute bottom-2 right-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 text-primary transition-all cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
            title="Ganti Foto Profil"
          >
            <Camera size={16} />
          </button>
        </div>

        {/* Basic Info (Floating Beside Avatar) */}
        <div className="pb-2 hidden sm:block">
          <h1 className="text-3xl font-heading font-extrabold text-slate-800 dark:text-white tracking-tight">
            {user?.name || "Memuat..."}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {user?.userStatus || "Akun Standar"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBanner;
