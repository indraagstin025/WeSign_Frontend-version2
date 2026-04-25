import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Users, 
  History, 
  Bell, 
  ShieldCheck, 
  LayoutDashboard, 
  Stamp,
  Zap 
} from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const features = [
  {
    title: "Tanda Tangan Instan",
    description: "Bubuhkan tanda tangan Anda pada dokumen PDF hanya dalam hitungan detik dengan interface drag-and-drop.",
    icon: <Zap className="text-yellow-500" />,
    color: "bg-yellow-500/10"
  },
  {
    title: "Manajemen Dokumen",
    description: "Atur, simpan, dan cari semua dokumen Anda dengan mudah dalam dashboard yang terorganisir.",
    icon: <FileText className="text-blue-500" />,
    color: "bg-blue-500/10"
  },
  {
    title: "Kolaborasi Grup",
    description: "Buat grup kerja dan undang anggota untuk menandatangani dokumen yang sama secara bersamaan.",
    icon: <Users className="text-green-500" />,
    color: "bg-green-500/10"
  },
  {
    title: "Riwayat Audit",
    description: "Lacak setiap langkah proses penandatanganan mulai dari dokumen diunggah hingga selesai.",
    icon: <History className="text-purple-500" />,
    color: "bg-purple-500/10"
  },
  {
    title: "Stempel Digital",
    description: "Unggah dan gunakan stempel perusahaan Anda untuk memberikan validasi tambahan pada dokumen.",
    icon: <Stamp className="text-red-500" />,
    color: "bg-red-500/10"
  },
  {
    title: "Pengingat Otomatis",
    description: "Kirim notifikasi otomatis kepada pihak yang belum menandatangani agar proses lebih cepat.",
    icon: <Bell className="text-orange-500" />,
    color: "bg-orange-500/10"
  },
  {
    title: "Keamanan Terenkripsi",
    description: "Setiap dokumen dilindungi dengan enkripsi tingkat tinggi untuk mencegah perubahan tanpa izin.",
    icon: <ShieldCheck className="text-cyan-500" />,
    color: "bg-cyan-500/10"
  },
  {
    title: "Dashboard Intuitif",
    description: "Pantau status semua dokumen Anda melalui visualisasi data yang bersih dan mudah dipahami.",
    icon: <LayoutDashboard className="text-indigo-500" />,
    color: "bg-indigo-500/10"
  }
];

const DetailedFeatures = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto w-full relative">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="text-center mb-8"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-0 text-zinc-900 dark:text-white tracking-tighter">
          Fitur Unggulan WeSign
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
          Segala yang Anda butuhkan untuk mendigitalisasi proses administrasi dokumen Anda secara profesional.
        </p>
      </motion.div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={fadeInUp}
            className="group flex flex-col bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
          >
            {/* Top Illustration Area */}
            <div className="h-44 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden flex items-center justify-center p-8">
               <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
               <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="text-zinc-400 dark:text-zinc-700 mb-2">
                    {React.cloneElement(feature.icon, { size: 64, strokeWidth: 1 })}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Feature Module</span>
               </div>
               <button className="absolute top-4 right-4 p-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-zinc-400">
                 <div className="flex flex-col gap-0.5">
                   <div className="w-1 h-1 bg-zinc-400 rounded-full"></div>
                   <div className="w-1 h-1 bg-zinc-400 rounded-full"></div>
                   <div className="w-1 h-1 bg-zinc-400 rounded-full"></div>
                 </div>
               </button>
            </div>

            {/* Content Area */}
            <div className="p-8 pt-10 relative flex flex-col flex-grow">
               {/* Floating Icon */}
               <div className="absolute -top-7 left-8 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transform group-hover:-translate-y-1 transition-transform">
                  {React.cloneElement(feature.icon, { size: 24, className: "text-white" })}
               </div>

               <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    Core
                  </span>
               </div>

               <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8 flex-grow">
                 {feature.description}
               </p>

               <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between mt-auto">
                  <button className="px-6 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    Lihat Detail
                  </button>
                  <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                    <Zap size={14} />
                    <span>Terintegrasi</span>
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default DetailedFeatures;
