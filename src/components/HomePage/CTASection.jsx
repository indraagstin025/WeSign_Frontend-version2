import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scaleUp } from '@/lib/animations';

const CTASection = () => {
  return (
    <section className="py-24 px-6 max-w-5xl mx-auto w-full overflow-hidden relative">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={scaleUp}
        className="rounded-3xl bg-zinc-900 text-white p-16 text-center shadow-2xl relative overflow-hidden border border-zinc-800"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">Siap Mempercepat Proses Legal Anda?</h2>
        <p className="text-zinc-300 mb-10 max-w-2xl mx-auto text-lg">
          Tidak ada lagi dokumen yang tercecer atau tertunda. Mulai perjalanan bebas kertas Anda sekarang juga.
        </p>
        <Button size="lg" className="px-10 py-6 rounded-xl font-bold text-lg inline-flex items-center gap-2 hover:scale-105 transition-transform">
          Buat Akun Gratis <ArrowRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </section>
  );
};

export default CTASection;
