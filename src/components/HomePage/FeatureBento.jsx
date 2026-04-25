import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CounterNumber } from '@/components/ui/counter-number';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const FeatureBento = () => {
  return (
    <section className="pt-12 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center overflow-hidden relative">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-zinc-900 dark:text-white">Ekosistem Sempurna</h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl text-lg mx-auto">
          Segala alat yang Anda butuhkan untuk mengatur alur dokumen perusahaan, dibangun dalam satu platform terintegrasi.
        </p>
      </motion.div>

      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 w-full"
      >
        {/* Large Card 1 */}
        <motion.div variants={fadeInUp} className="col-span-1 md:col-span-2 row-span-1">
          <Card className="h-full bg-white dark:bg-zinc-800 rounded-3xl border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all duration-500 dark:hover:shadow-[0_0_50px_hsl(160,60%,40%,0.3)] dark:hover:border-primary/50">
            <CardHeader>
              <CardTitle className="text-2xl font-heading text-zinc-900 dark:text-white">Anti Pemalsuan Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Teknologi enkripsi SHA-256 dan hash QR code mutakhir menjamin setiap dokumen kebal terhadap modifikasi setelah ditandatangani.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Small Card 1 */}
        <motion.div variants={fadeInUp} className="col-span-1 md:col-span-2 row-span-1">
           <Card className="h-full bg-primary text-white rounded-3xl shadow-lg shadow-primary/20 border-none relative overflow-hidden flex flex-col justify-end">
             <CardHeader className="mt-auto">
               <CardTitle className="text-2xl font-heading text-white">Kolaborasi Tim Real-Time</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-primary-light leading-relaxed">
                 Tandatangani dokumen massal dan operasikan alur kerja dalam tim tanpa penundaan sinkronisasi.
               </p>
             </CardContent>
           </Card>
        </motion.div>

        {/* Small Card 2 */}
        <motion.div variants={fadeInUp} className="col-span-1 md:col-span-2 row-span-1">
          <Card className="h-full bg-white dark:bg-zinc-800 rounded-3xl border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all duration-500 dark:hover:shadow-[0_0_50px_hsl(160,60%,40%,0.3)] dark:hover:border-primary/50">
            <CardHeader>
              <CardTitle className="text-2xl font-heading text-zinc-900 dark:text-white">Editor Kanvas Fleksibel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Antarmuka drag & drop yang intuitif. Tempatkan tanda tangan, stempel, dan teks persis di tempat yang Anda mau.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Card */}
        <motion.div variants={fadeInUp} className="col-span-1 md:col-span-2 row-span-1">
          <Card className="h-full bg-zinc-900 dark:bg-zinc-950 text-white rounded-3xl border border-transparent flex flex-col justify-center items-center text-center p-8 transition-all duration-500 dark:hover:shadow-[0_0_50px_hsl(160,60%,40%,0.3)] dark:hover:border-primary/50">
            <div className="text-5xl font-heading font-extrabold mb-2">
               <CounterNumber target={99} suffix=".9%" duration={2000} />
            </div>
            <p className="text-zinc-400 font-medium tracking-wide uppercase text-sm">Uptime Infrastruktur</p>
          </Card>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default FeatureBento;
