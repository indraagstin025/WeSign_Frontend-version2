import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { fadeInUp } from '@/lib/animations';

const faqs = [
  {
    question: "Apakah tanda tangan digital WeSign sah secara hukum?",
    answer: "Saat ini WeSign sedang dalam tahap pengembangan dan proses pemenuhan standar PSrE (Penyelenggara Sertifikasi Elektronik). Platform ini sudah dapat digunakan untuk keperluan dokumen internal, persetujuan proyek, dan administrasi non-formal lainnya sambil kami terus meningkatkan kepatuhan hukum formal."
  },
  {
    question: "Bagaimana cara WeSign menjamin keamanan dokumen saya?",
    answer: "Setiap dokumen dienkripsi menggunakan algoritma SHA-256 dan disimpan dalam infrastruktur cloud yang aman. Kami juga menyediakan fitur Audit Trail untuk melacak setiap aktivitas yang terjadi pada dokumen Anda."
  },
  {
    question: "Apakah saya perlu membayar untuk menandatangani dokumen?",
    answer: "Tidak, sebagai penerima dokumen, Anda dapat menandatangani dokumen secara gratis tanpa perlu berlangganan. Biaya hanya dikenakan kepada pengirim dokumen (Document Owner)."
  },
  {
    question: "Dapatkah saya menggunakan WeSign di perangkat seluler?",
    answer: "Tentu! WeSign dirancang dengan pendekatan Mobile-First. Anda dapat meninjau dan menandatangani dokumen langsung dari browser smartphone Anda tanpa perlu mengunduh aplikasi tambahan."
  },
  {
    question: "Apakah ada batasan jumlah dokumen yang bisa saya kirim?",
    answer: "Batasan pengiriman dokumen bergantung pada paket yang Anda pilih. Paket 'Starter' kami memberikan kuota yang cukup untuk kebutuhan UMKM, sementara paket 'Business' menawarkan kuota yang lebih besar dan fitur tim."
  }
];

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 overflow-hidden">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group transition-all"
      >
        <span className={`text-lg font-semibold transition-colors ${isOpen ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-primary'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-primary/10 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="pb-6 pr-12 text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="py-32 px-6 max-w-4xl mx-auto w-full relative">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-1">
          <HelpCircle size={14} />
          FAQ
        </div>
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-0 text-zinc-900 dark:text-white tracking-tighter">
          Pertanyaan Umum
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          Segala hal yang perlu Anda ketahui tentang WeSign.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="bg-white dark:bg-zinc-900/50 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 shadow-xl dark:shadow-black/20"
      >
        <div className="flex flex-col">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default FAQSection;
