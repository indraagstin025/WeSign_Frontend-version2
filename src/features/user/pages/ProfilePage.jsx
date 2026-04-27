import React from 'react';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Briefcase, 
  MapPin, 
  Save, 
  ChevronRight, 
  Database, 
  Users, 
  Lock,
  Trash2,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { useProfilePage } from '../hooks/useProfilePage';
import ProfileBanner from '../components/ProfileBanner';
import AvatarUploadModal from '../components/AvatarUploadModal';
import UsageIndicator from '../components/UsageIndicator';
import ConfirmModal from '../../../components/UI/ConfirmModal';

const ProfilePage = () => {
    const {
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
        ui: {
            activeTab,
            setActiveTab,
            isUploadModalOpen,
            setIsUploadModalOpen,
            modal,
            closeModal,
        },
        actions: {
            handleInputChange,
            handleSave,
            onAvatarUpload,
            onSelectOldAvatar,
            onDeleteAvatarHistory,
            refreshQuota,
        }
    } = useProfilePage();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-gray-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Menyiapkan Profil Premium...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-10 p-8 glass-panel border-red-500/20 bg-red-500/5 text-center shadow-red-500/10">
                <div className="p-4 bg-red-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <ShieldCheck size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-heading font-bold text-red-600 mb-2 font-bold uppercase tracking-tight">Koneksi Gagal</h3>
                <p className="text-zinc-400 text-sm mb-6 max-w-sm mx-auto">{error}</p>
                <button 
                  onClick={refreshQuota}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg hover:scale-105 cursor-pointer font-bold uppercase tracking-widest text-[10px]"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth px-4 py-8">
            <div className="max-w-6xl mx-auto">
            <ProfileBanner 
                user={{ ...user, name: formData.name }} 
                onOpenModal={() => setIsUploadModalOpen(true)}
                isUploading={isUploadingPicture} 
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- SISI KIRI: IDENTITY CARD --- */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-6 shadow-xl shadow-black/5 animate-fade-in-up">
                        <div className="flex items-center justify-between mb-6">
                           <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Tentang Saya</h2>
                           <span className="p-1 rounded-md bg-primary/10 text-primary">
                             <User size={16} />
                           </span>
                        </div>
                        
                        <div className="space-y-5">
                            <InfoItem icon={<Mail size={16} />} label="Email" value={formData.email} />
                            <InfoItem icon={<Phone size={16} />} label="Telepon" value={formData.phoneNumber} />
                            <InfoItem icon={<Briefcase size={16} />} label="Posisi" value={formData.title} />
                            <InfoItem icon={<MapPin size={16} />} label="Lokasi" value={formData.address} />
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Keanggotaan</p>
                           <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/20 border border-primary/20 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                                    <ShieldCheck size={18} className="text-primary" />
                                 </div>
                                 <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{quota?.userStatus}</span>
                              </div>
                              <ChevronRight size={14} className="text-zinc-400" />
                           </div>
                        </div>
                    </div>
                </div>

                {/* --- SISI KANAN: SETTINGS & TABS --- */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Tab Navigation */}
                    <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit self-center sm:self-start border border-zinc-200 dark:border-zinc-800 animate-fade-in-up gap-1">
                        <TabButton 
                            active={activeTab === 'pribadi'} 
                            onClick={() => setActiveTab('pribadi')} 
                            label="Info Pribadi" 
                            icon={<User size={16} />}
                        />
                        <TabButton 
                            active={activeTab === 'koleksi'} 
                            onClick={() => setActiveTab('koleksi')} 
                            label="Koleksi Foto" 
                            icon={<Camera size={16} />}
                        />
                        <TabButton 
                            active={activeTab === 'kuota'} 
                            onClick={() => setActiveTab('kuota')} 
                            label="Batas Akun" 
                            icon={<Database size={16} />}
                        />
                        <TabButton 
                            active={activeTab === 'keamanan'} 
                            onClick={() => setActiveTab('keamanan')} 
                            label="Keamanan" 
                            icon={<Lock size={16} />}
                        />
                    </div>

                    <div className="flex-1 transition-all duration-300">
                        {/* TAB: INFO PRIBADI */}
                        {activeTab === 'pribadi' && (
                            <div className="glass-panel p-8 space-y-8 animate-fade-in-up">
                                <header className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-6 mb-6">
                                   <button 
                                      onClick={handleSave}
                                      disabled={isUpdating}
                                      className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg transition-transform hover:scale-105 font-bold uppercase tracking-widest text-[10px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                   >
                                      {isUpdating ? (
                                         <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                      ) : (
                                         <Save size={14} />
                                      )}
                                      {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                                   </button>
                                </header>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormInput 
                                        label="Nama Lengkap" 
                                        value={formData.name} 
                                        placeholder="Masukkan nama..." 
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        error={fieldErrors.name}
                                    />
                                    <FormInput 
                                        label="Email Utama" 
                                        value={formData.email} 
                                        disabled 
                                    />
                                    <FormInput 
                                        label="Nomor Telepon" 
                                        value={formData.phoneNumber} 
                                        placeholder="+62..." 
                                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                        error={fieldErrors.phoneNumber}
                                    />
                                    <FormInput 
                                        label="Jabatan / Profesi" 
                                        value={formData.title} 
                                        placeholder="Contoh: Manager" 
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        error={fieldErrors.title}
                                    />
                                    <div className="md:col-span-2">
                                        <FormInput 
                                            label="Alamat / Kantor" 
                                            value={formData.address} 
                                            placeholder="Alamat lengkap..." 
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            error={fieldErrors.address}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: KOLEKSI FOTO */}
                        {activeTab === 'koleksi' && (
                            <div className="glass-panel p-8 animate-fade-in-up">
                                <header className="border-b border-zinc-100 dark:border-zinc-800 pb-6 mb-8">
                                    <h3 className="text-lg font-bold text-zinc-800 dark:text-white uppercase tracking-tight">Koleksi Foto Profil</h3>
                                    <p className="text-xs text-zinc-400 mt-1">Ganti profil dengan koleksi lama Anda atau hapus riwayat yang tidak perlu.</p>
                                </header>

                                {pictureHistory.length === 0 ? (
                                    <div className="text-center py-16 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                        <div className="p-4 bg-white dark:bg-zinc-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <Camera size={24} className="text-zinc-300" />
                                        </div>
                                        <p className="text-zinc-500 text-sm font-medium">Belum ada riwayat foto profil.</p>
                                        <p className="text-zinc-400 text-xs mt-1">Unggah foto baru untuk memulai koleksi Anda.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                        {pictureHistory.map((pic) => (
                                            <div key={pic.id} className={`group relative aspect-square rounded-3xl overflow-hidden border-2 transition-all duration-300 ${pic.isActive ? 'border-primary shadow-lg shadow-primary/10' : 'border-transparent bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm hover:shadow-md'}`}>
                                                <img 
                                                    src={pic.url} 
                                                    alt="History" 
                                                    loading="lazy"
                                                    decoding="async"
                                                    className={`w-full h-full object-cover transition-all duration-500 ${pic.isActive ? 'scale-100 opacity-100' : 'scale-105 opacity-80 group-hover:scale-110 group-hover:opacity-100'}`}
                                                />
                                                
                                                {/* Active Status Overlay */}
                                                {pic.isActive && (
                                                    <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-[8px] font-bold text-white rounded-lg shadow-lg flex items-center gap-1 uppercase tracking-tighter">
                                                        <CheckCircle2 size={10} />
                                                        Aktif
                                                    </div>
                                                )}

                                                {/* Action Hover Overlay */}
                                                {!pic.isActive && (
                                                    <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3">
                                                        <button 
                                                            onClick={() => onSelectOldAvatar(pic.id)}
                                                            className="w-24 py-2 bg-white text-zinc-900 text-[10px] font-bold rounded-xl hover:bg-primary hover:text-white transition-all uppercase tracking-widest shadow-xl"
                                                        >
                                                            Gunakan
                                                        </button>
                                                        <button 
                                                            onClick={() => onDeleteAvatarHistory(pic.id)}
                                                            className="flex items-center gap-1 text-white hover:text-red-400 text-[10px] font-bold transition-all uppercase tracking-widest"
                                                        >
                                                            <Trash2 size={12} />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: KUOTA */}
                        {activeTab === 'kuota' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <UsageIndicator 
                                        label="Kapasitas Grup" 
                                        current={quota?.usage?.ownedGroups} 
                                        max={quota?.limits?.maxOwnedGroups} 
                                        icon={Users} 
                                        color="primary"
                                    />
                                    <UsageIndicator 
                                        label="Dokumen Vault" 
                                        current={quota?.usage?.totalPersonalDocuments} 
                                        max={quota?.limits?.maxPersonalDocs} 
                                        icon={Database} 
                                        color="emerald"
                                    />
                                </div>
                                
                                <div className="glass-panel p-6 border-primary/10 bg-primary/5 animate-fade-in-up delay-75">
                                   <div className="flex gap-4 items-start">
                                      <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-zinc-100 dark:border-zinc-700">
                                         <ShieldCheck className="text-primary" size={24} />
                                      </div>
                                      <div>
                                         <h4 className="font-heading font-extrabold text-zinc-800 dark:text-white tracking-tight">Akun Sigify Unlimited</h4>
                                         <p className="text-sm text-zinc-500 mt-1">Saat ini semua pembatasan kuota dinonaktifkan dalam mode pengembangan. Nikmati akses penuh tanpa batas!</p>
                                      </div>
                                   </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: KEAMANAN (Placeholder) */}
                        {activeTab === 'keamanan' && (
                             <div className="glass-panel p-8 text-center animate-fade-in-up">
                                 <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-200 dark:border-zinc-800">
                                     <Lock size={32} className="text-zinc-300 dark:text-zinc-600" />
                                 </div>
                                 <h3 className="text-lg font-heading font-bold text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Fitur Keamanan Segera Hadir</h3>
                                 <p className="text-sm text-zinc-400 mt-2 max-w-xs mx-auto">Kami sedang mempersiapkan sistem autentikasi dua faktor dan manajemen PIN yang lebih aman.</p>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- GLOBAL APP MODAL FOR USER FEEDBACK --- */}
        <ConfirmModal 
            isOpen={modal.isOpen}
            onClose={closeModal}
            onConfirm={modal.onConfirm}
            title={modal.title}
            message={modal.message}
            variant={modal.variant}
            confirmText={modal.confirmText}
            cancelText={modal.cancelText}
            loading={isUpdating}
            icon={modal.icon}
        />

        {/* Modal Unggah Foto Khusus */}
        <AvatarUploadModal 
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={onAvatarUpload}
            isUploading={isUploadingPicture}
        />
    </div>
  );
};

/* --- HELPER COMPONENTS --- */

const TabButton = ({ active, onClick, label, icon }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border-none cursor-pointer ${
            active 
            ? "bg-white dark:bg-zinc-800 text-primary shadow-lg shadow-black/5" 
            : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        }`}
    >
        {icon}
        {label}
    </button>
);

const InfoItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-4 group">
        <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-primary transition-colors">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300 leading-none">{value || "-"}</p>
        </div>
    </div>
);

const FormInput = ({ label, value, placeholder, disabled, onChange, error }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{label}</label>
            {error && (
                <span className="text-[9px] font-bold text-red-500 animate-pulse uppercase tracking-tight">
                    {error}
                </span>
            )}
        </div>
        <div className="relative group">
            <input 
                type="text" 
                value={value} 
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 border rounded-xl text-sm font-medium transition-all focus:ring-2 outline-none ${
                    error 
                    ? "border-red-500/50 focus:ring-red-500/10 focus:border-red-500 bg-red-50/10" 
                    : "border-zinc-200 dark:border-zinc-800 focus:ring-primary/20 focus:border-primary group-hover:border-zinc-300 dark:group-hover:border-zinc-700"
                } ${
                    disabled ? "opacity-60 cursor-not-allowed" : "cursor-text"
                }`}
            />
            {disabled && (
               <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-700">
                  <Lock size={14} />
               </div>
            )}
        </div>
    </div>
)

export default ProfilePage;
