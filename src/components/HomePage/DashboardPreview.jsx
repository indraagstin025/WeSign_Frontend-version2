import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Layout } from 'lucide-react';
import { fadeInUp } from '@/lib/animations';

const previewImages = [
  {
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
    title: "Dashboard Overview",
    desc: "Pantau semua status dokumen secara real-time."
  },
  {
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    title: "Statistik Mendalam",
    desc: "Analisis performa tanda tangan dan efisiensi alur kerja."
  },
  {
    url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&q=80",
    title: "Kolaborasi Tim",
    desc: "Kelola anggota tim dan hak akses secara terpusat."
  },
  {
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80",
    title: "Antarmuka Penandatangan",
    desc: "Proses penandatanganan yang bersih dan bebas gangguan."
  },
  {
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80",
    title: "Manajemen Template",
    desc: "Buat dan gunakan kembali template dokumen Anda."
  },
  {
    url: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1600&q=80",
    title: "Audit Trail",
    desc: "Log aktivitas lengkap untuk keamanan dokumen."
  },
  {
    url: "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=1600&q=80",
    title: "Sistem Keamanan",
    desc: "Enkripsi tingkat tinggi untuk setiap dokumen."
  }
];

const DashboardPreview = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % previewImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length);
  };

  return (
    <section className="pt-24 pb-20 px-6 relative w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Title & Header */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="max-w-4xl mx-auto text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
          <Layout size={14} />
          Antarmuka Produk
        </div>
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-zinc-900 dark:text-white tracking-tighter">
          Lihat WeSign Beraksi
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          Eksplorasi dashboard kami yang intuitif dan didesain untuk produktivitas maksimal.
        </p>
      </motion.div>

      {/* Carousel Container */}
      <div className="max-w-6xl mx-auto relative px-4 md:px-12">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
          }}
          className="relative rounded-[40px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-3 md:p-5 z-10"
        >
          <div className="rounded-[30px] overflow-hidden relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <img 
                  src={previewImages[currentIndex].url} 
                  alt={previewImages[currentIndex].title} 
                  className="w-full h-full object-cover"
                />
                {/* Overlay Info */}
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                   <h3 className="text-2xl font-bold mb-2 tracking-tight">{previewImages[currentIndex].title}</h3>
                   <p className="text-zinc-200 text-sm max-w-md">{previewImages[currentIndex].desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-8 z-20">
            <button 
              onClick={prevSlide}
              className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform text-zinc-900 dark:text-white"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-8 z-20">
            <button 
              onClick={nextSlide}
              className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform text-zinc-900 dark:text-white"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </motion.div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-10">
          {previewImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 transition-all duration-300 rounded-full ${currentIndex === index ? 'w-8 bg-primary' : 'w-2 bg-zinc-300 dark:bg-zinc-700'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
