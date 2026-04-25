import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Star, Server, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { fadeInUp, staggerContainer, scaleUp } from '@/lib/animations';

const PricingSection = () => {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto overflow-hidden relative" id="harga">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="text-center max-w-3xl mx-auto mb-20"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 text-zinc-900 dark:text-white">Harga Transparan</h2>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">Tidak ada biaya tersembunyi. Skala sesuai kebutuhan Anda.</p>
      </motion.div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"
      >
        {/* Paket Gratis */}
        <motion.div variants={fadeInUp} className="h-full">
          <Card className="h-full rounded-3xl bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 flex flex-col">
            <CardHeader className="pb-8 border-b border-zinc-100 dark:border-zinc-700 mb-8 text-center sm:text-left">
              <CardTitle className="text-2xl font-heading mb-2 text-zinc-900 dark:text-white">Personal</CardTitle>
              <CardDescription className="h-10 text-zinc-500">Untuk kebutuhan sporadis & percobaan gratis.</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-heading font-bold text-zinc-900 dark:text-white">Gratis</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm font-medium">5 Dokumen per Bulan</span></li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm font-medium">Verifikasi QR Universal</span></li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm font-medium">1 Grup TTD</span></li>
                <li className="flex items-center gap-3 text-zinc-400 dark:text-zinc-600"><XCircle className="w-5 h-5 flex-shrink-0" /><span className="text-sm font-medium line-through">Notifikasi WhatsApp</span></li>
              </ul>
              <Button variant="outline" className="w-full py-6 rounded-xl border-2 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200">Mulai Gratis</Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Paket Profesional */}
        <motion.div variants={scaleUp} className="h-full transform md:-translate-y-4 relative z-10">
          <Card className="h-full rounded-3xl bg-zinc-900 dark:bg-zinc-950 border-zinc-800 shadow-2xl flex flex-col text-white relative">
            <Badge className="absolute top-0 right-8 transform -translate-y-1/2 rounded-full px-4 py-1 text-xs uppercase tracking-wide gap-1.5 border-none shadow-md">
              <Star className="w-3.5 h-3.5" /> Paling Laris
            </Badge>
            <CardHeader className="pb-8 border-b border-zinc-800 mb-8 text-center sm:text-left">
              <CardTitle className="text-2xl font-heading mb-2 text-white">Profesional</CardTitle>
              <CardDescription className="h-10 text-zinc-400">Birokrasi lengkap untuk startup & UMKM.</CardDescription>
              <div className="mt-4 flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-5xl font-heading font-bold text-white">Rp49k</span>
                <span className="text-zinc-400 font-medium text-sm">/ bulan</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 font-medium text-white"><CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm">Dokumen Tak Terbatas</span></li>
                <li className="flex items-center gap-3 font-medium text-white"><CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm">20 Grup Kolaborasi</span></li>
                <li className="flex items-center gap-3 font-medium text-white"><CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm">Tanda Tangan Massal</span></li>
                <li className="flex items-center gap-3 font-medium text-white"><CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm">Notifikasi WhatsApp Real-time</span></li>
              </ul>
              <Button className="w-full py-6 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">Langganan Sekarang</Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Paket Enterprise */}
        <motion.div variants={fadeInUp} className="h-full">
          <Card className="h-full rounded-3xl bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 flex flex-col">
            <CardHeader className="pb-8 border-b border-zinc-100 dark:border-zinc-700 mb-8 text-center sm:text-left">
              <CardTitle className="text-2xl font-heading mb-2 text-zinc-900 dark:text-white">Enterprise</CardTitle>
              <CardDescription className="h-10 text-zinc-500">Kepatuhan regulasi tingkat tinggi.</CardDescription>
              <div className="mt-4">
                <span className="text-5xl font-heading font-bold text-zinc-900 dark:text-white">Kustom</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm font-medium">Fitur Profesional</span></li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><Server className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm font-medium">Database On-Premise</span></li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><KeyRound className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm font-medium">Akses API Eksternal</span></li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"><CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" /><span className="text-sm font-medium">Custom Branding</span></li>
              </ul>
              <Button variant="outline" className="w-full py-6 rounded-xl border-2 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200">Hubungi Sales</Button>
            </CardContent>
          </Card>
        </motion.div>
        
      </motion.div>
    </section>
  );
};

export default PricingSection;
