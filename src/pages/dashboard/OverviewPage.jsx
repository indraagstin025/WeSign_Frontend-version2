import React from 'react';
import { 
  FileCheck, 
  Hourglass, 
  XOctagon, 
  Plus, 
  Search, 
  MoreVertical 
} from 'lucide-react';

const OverviewPage = () => {
  // Contoh data (Dummy)
  const stats = [
    { label: 'Selesai', value: '142', icon: <FileCheck className="text-emerald-600 dark:text-emerald-400" size={20} />, status: 'bg-emerald-100 dark:bg-emerald-900/30 ring-emerald-200' },
    { label: 'Menunggu Saya', value: '12', icon: <Hourglass className="text-amber-600 dark:text-amber-400" size={20} />, status: 'bg-amber-100 dark:bg-amber-900/30 ring-amber-200' },
    { label: 'Kadaluarsa & Batal', value: '3', icon: <XOctagon className="text-rose-600 dark:text-rose-400" size={20} />, status: 'bg-rose-100 dark:bg-rose-900/30 ring-rose-200' }
  ];

  const recentDocs = [
    { title: 'Kontrak_Pegawai_Tetap_Q1.pdf', date: 'Hari ini, 14:30', status: 'Selesai', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
    { title: 'NDA_Vendor_PT_Amanosa.pdf', date: 'Kemarin, 09:15', status: 'Menunggu Anda', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
    { title: 'Surat_Kuasa_Distribusi_Barat.pdf', date: '27 Mar 2026', status: 'Ditolak', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
  ];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-8 scroll-smooth">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* 1. Header & Call to Action Utama */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
              Selamat Pagi, Arman!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Berikut adalah status ruang kerja elektronik Anda hari ini.
            </p>
          </div>
          
          {/* CTA Unggah */}
          <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-primary/20 cursor-pointer border-none shrink-0 w-full sm:w-auto">
            <Plus size={18} strokeWidth={2.5} /> Unggah Dokumen
          </button>
        </div>

        {/* 2. Kartu Statistik Utama (Grid Responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between transition-all hover:shadow-md cursor-pointer group`}>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ring-1 dark:ring-0 ${stat.status} shadow-sm group-hover:scale-105 transition-transform`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Panel Tabel Aktivitas Terkini */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Tabel */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Aktivitas Terkini
            </h3>
            <a href="/dashboard/documents" className="text-xs sm:text-sm font-medium text-primary hover:text-primary-dark transition-colors no-underline">
              Lihat Semua
            </a>
          </div>

          {/* Konten Tabel List Mobile-first (Compact) */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc, idx) => (
                <div key={idx} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center gap-4 truncate">
                    <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                      <FileCheck size={16} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mb-0.5">{doc.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{doc.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${doc.color}`}>
                      {doc.status}
                    </span>
                    <button className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 lg:opacity-100">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                   <Hourglass className="text-slate-400" size={24} />
                 </div>
                 <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Belum ada aktivitas dokumen.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OverviewPage;
