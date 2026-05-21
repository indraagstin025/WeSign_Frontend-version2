import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, Mail, MessageSquare, Calendar, Feather, ClockCheck, ShieldCheckIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const HeroSection = () => {
  return (
    <section className="min-h-screen flex flex-col justify-center pt-32 pb-20 px-6 relative overflow-hidden bg-white dark:bg-zinc-950">
      {/* Dot Grid Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* Floating Widget 1: Sticky Note (Top Left) */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [6, 4, 6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="hidden lg:flex absolute top-32 left-4 w-52 bg-yellow-100 dark:bg-yellow-900 p-6 shadow-xl border border-yellow-200 dark:border-yellow-700 rounded-sm flex-col z-20 transition-all duration-500 dark:hover:shadow-[0_0_50px_hsl(160,60%,40%,0.4)] dark:hover:border-primary/60 rotate-6"
      >
        <div className="w-4 h-4 rounded-full bg-red-400 absolute -top-2 left-1/2 transform -translate-x-1/2 shadow-sm"></div>
        <p className="font-dancing text-xl text-zinc-800 dark:text-yellow-100 leading-snug">
          Tanda tangani kontrak penting tanpa ribet, sah di mata hukum.
        </p>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-6 -right-6 bg-blue-500 text-white p-3 rounded-2xl shadow-lg border-4 border-white dark:border-zinc-900"
        >
          <CheckSquare size={28} />
        </motion.div>
      </motion.div>

      {/* Floating Widget 2: Reminders (Top Right) - Modernized Version */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [-6, -4, -6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="hidden lg:flex absolute top-32 right-4 w-72 bg-white/90 dark:bg-zinc-800/95 backdrop-blur-xl rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.1)] dark:shadow-black/60 border border-white/20 dark:border-zinc-700 p-6 flex-col gap-4 z-20 transition-all duration-500 hover:scale-105 hover:border-primary/50 group -rotate-6"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h4 className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight">Status Dokumen</h4>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Live</span>
        </div>

        <div className="space-y-3">
          <div className="bg-white dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 flex items-center gap-4 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30 ring-4 ring-orange-500/10">
              <ClockCheck className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate tracking-tight">Kontrak Vendor</span>
              <span className="text-[10px] font-medium text-zinc-500">Menunggu TTD (2/3)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 flex items-center gap-4 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-primary/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/10">
              <ShieldCheckIcon className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate tracking-tight">MOU Kerjasama</span>
              <span className="text-[10px] font-bold text-emerald-600">Selesai • 2m lalu</span>
            </div>
          </div>
        </div>

        <div className="mt-1 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-center">
          <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
            Lihat Semua Aktivitas
          </button>
        </div>
      </motion.div>

      {/* Floating Widget 3: Tasks (Bottom Left) */}
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [3, 1, 3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="hidden lg:flex absolute bottom-8 left-4 w-80 bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl dark:shadow-black/40 border border-zinc-200 dark:border-zinc-600 p-6 flex-col gap-6 z-20 transition-all duration-500 dark:hover:shadow-[0_0_50px_hsl(160,60%,40%,0.4)] dark:hover:border-primary/60 rotate-3"
      >
        <h4 className="font-bold text-zinc-900 dark:text-white text-lg">Aktivitas Hari Ini</h4>
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">NDA Karyawan Baru</span>
              <span className="text-zinc-500 font-medium">60%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
              <div className="bg-orange-500 w-[60%] h-full rounded-full"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">MOU Partner</span>
              <span className="text-zinc-500 font-medium">100%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden">
              <div className="bg-green-500 w-full h-full rounded-full"></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Widget 4: Integrations (Bottom Right) */}
      <motion.div
        animate={{ y: [0, 12, 0], rotate: [-2, 0, -2] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="hidden lg:flex absolute bottom-8 right-4 w-72 bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl dark:shadow-black/40 border border-zinc-200 dark:border-zinc-600 p-6 flex-col gap-5 z-20 transition-all duration-500 dark:hover:shadow-[0_0_50px_hsl(160,60%,40%,0.4)] dark:hover:border-primary/60 -rotate-2"
      >
        <h4 className="font-bold text-zinc-900 dark:text-white text-lg">100+ Integrasi</h4>
        <div className="flex justify-center gap-4 mt-2">
          <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-700 flex items-center justify-center transform hover:-translate-y-1 transition-transform">
            <Mail className="text-red-500 w-8 h-8" />
          </div>
          <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-700 flex items-center justify-center -translate-y-6 transform hover:-translate-y-7 transition-transform">
            <MessageSquare className="text-purple-500 w-8 h-8" />
          </div>
          <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-700 flex items-center justify-center transform hover:-translate-y-1 transition-transform">
            <Calendar className="text-blue-500 w-8 h-8" />
          </div>
        </div>
      </motion.div>

      {/* Central Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl mx-auto flex flex-col items-center text-center z-10"
      >
        {/* Logo icon on top */}
        <motion.div variants={fadeInUp} className="mb-10">
          <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center p-4 transform rotate-3 hover:rotate-0 transition-transform text-primary">
            <Feather size={48} strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl md:text-7xl font-heading font-bold tracking-tighter mb-6 text-zinc-900 dark:text-white leading-[1.05]">
          Validasi Dokumen <br />
          <span className="text-primary font-medium">lebih cepat, pintar.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={fadeInUp} className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-lg leading-relaxed font-light">
          Kelola dokumen Anda secara efisien dan tingkatkan produktivitas kerja dalam satu platform terpusat.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={fadeInUp}>
          <Button size="lg" className="group bg-primary hover:bg-primary-dark text-white rounded-full px-10 py-8 text-xl font-bold shadow-xl shadow-primary/30 hover:scale-105 transition-all duration-300 border-none flex items-center gap-3">
            Mulai Demo Gratis
            <ArrowRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
