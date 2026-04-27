import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const WorkflowSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-zinc-950 border-y border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-zinc-900 dark:text-white">Cara Kerja Tiga Langkah</h2>
          <p className="text-zinc-600 dark:text-zinc-400">Desain alur yang bersih tanpa hambatan kompleks.</p>
        </motion.div>
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
        >
          <motion.div 
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="hidden md:block absolute top-8 left-[15%] right-[15%] h-px bg-zinc-200 dark:bg-zinc-700"
          ></motion.div>

          {/* Step 1 */}
          <motion.div variants={fadeInUp} className="relative flex flex-col items-center text-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-primary text-primary flex items-center justify-center text-2xl font-heading font-bold mb-6 shadow-sm">1</div>
            <h3 className="text-xl font-heading font-bold mb-3 text-zinc-900 dark:text-white">Unggah Berkas</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Masukkan file PDF Anda ke dalam kanvas kami yang aman.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div variants={fadeInUp} className="relative flex flex-col items-center text-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-primary text-primary flex items-center justify-center text-2xl font-heading font-bold mb-6 shadow-sm">2</div>
            <h3 className="text-xl font-heading font-bold mb-3 text-zinc-900 dark:text-white">Sesuaikan Titik</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Tarik elemen interaktif langsung ke area yang diinginkan.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div variants={fadeInUp} className="relative flex flex-col items-center text-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary text-white border-2 border-primary flex items-center justify-center text-2xl font-heading font-bold mb-6 shadow-md shadow-primary/20">3</div>
            <h3 className="text-xl font-heading font-bold mb-3 text-zinc-900 dark:text-white">Simpan & Sah</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Sistem membungkus dokumen dengan sertifikat integritas.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default WorkflowSection;
