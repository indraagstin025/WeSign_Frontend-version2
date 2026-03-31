import React from 'react';
import Navbar from '../../components/Layout/Navbar';
import { PenTool, ShieldAlert, Users, ArrowRight, CheckCircle2, Check, X, Star } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen overflow-hidden relative">
      <Navbar />

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 relative text-center">
        {/* Latar Belakang Glow yang Sangat Ringan untuk Performa (Tanpa CSS Blur) */}
        <div
          className="absolute top-0 left-0 w-full h-[600px] -z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 20% 30%, rgba(41, 181, 122, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(246, 194, 62, 0.08) 0%, transparent 50%)'
          }}
        ></div>

        <div className="max-w-4xl flex flex-col items-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 glass-panel border border-slate-200/50 text-[var(--color-text-main)]">
            <CheckCircle2 size={16} className="text-primary" />
            <span>Tanda Tangan Elektronik Tersertifikasi</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-bold tracking-tight mb-6 text-[var(--color-text-main)] leading-tight">
            Tandatangani Masa Depan <br className="hidden md:block" />
            <span className="text-primary">Tanpa Kertas.</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--color-text-muted)] mb-10 max-w-2xl leading-relaxed mx-auto px-4">
            Platform validasi dokumen tercanggih untuk kebutuhan legal personal maupun kolaborasi grup Anda. Keamanan berlapis tingkat perbankan.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 font-heading font-semibold text-lg w-full sm:w-auto border-none cursor-pointer">
              Mulai Dokumen Baru <ArrowRight size={20} />
            </button>
            <button className="flex items-center justify-center gap-2 bg-transparent text-primary border-2 border-primary hover:bg-primary-light/20 px-8 py-4 rounded-xl transition-all font-heading transform hover:-translate-y-1 font-semibold text-lg w-full sm:w-auto cursor-pointer">
              Verifikasi QR Code
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto flex flex-col items-center" id="fitur">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 tracking-tight text-center">Kenapa Memilih WeSign?</h2>
        <p className="text-center text-[var(--color-text-muted)] mb-12 max-w-2xl text-lg">
          Dibangun khusus untuk integritas tingkat tinggi dengan keamanan berlapis. Cocok untuk individu maupun tim perusahaan.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {/* Card 1 */}
          <div className="glass-panel p-8 flex flex-col items-start transition-all transform hover:-translate-y-1 hover:shadow-2xl opacity-0 animate-[fadeInUp_0.8s_ease-out_100ms_forwards]">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <ShieldAlert size={28} className="text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-heading text-[var(--color-text-main)]">Anti Pemalsuan Data</h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed">
              Setiap tanda tangan dilindungi sistem enkripsi mutakhir dan diinjeksi hash QR code langsung ke dokumen PDF.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-8 flex flex-col items-start transition-all transform hover:-translate-y-1 hover:shadow-2xl opacity-0 animate-[fadeInUp_0.8s_ease-out_200ms_forwards]">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Users size={28} className="text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-heading text-[var(--color-text-main)]">Tanda Tangan Grup</h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed">
              Bekerja sama di satu ruangan dokumen yang tersinkronisasi tanpa delay dengan status yang dapat dijaga.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-8 flex flex-col items-start transition-all transform hover:-translate-y-1 hover:shadow-2xl opacity-0 animate-[fadeInUp_0.8s_ease-out_300ms_forwards]">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <PenTool size={28} className="text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-heading text-[var(--color-text-main)]">Editor Drag & Drop</h3>
            <p className="text-[var(--color-text-muted)] leading-relaxed">
              Atur posisi elemen persis sesuai keinginan dengan pengalaman manipulasi kanvas paling luwes di kelasnya.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-6 sm:px-12 max-w-5xl mx-auto mb-24 text-center glass-panel">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-12 tracking-tight">Cara Kerja Super Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-6 shadow-md">1</div>
            <h3 className="text-xl font-bold mb-3 font-heading text-[var(--color-text-main)]">Unggah PDF</h3>
            <p className="text-[var(--color-text-muted)]">Masukkan dokumen kontrak atau file legal Anda ke dalam sistem yang 100% terenkripsi.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-6 shadow-md">2</div>
            <h3 className="text-xl font-bold mb-3 font-heading text-[var(--color-text-main)]">Tentukan Titik TTD</h3>
            <p className="text-[var(--color-text-muted)]">Posisikan tempat tanda tangan menggunakan editor visual kami. Undang relasi jika perlu.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold mb-6 shadow-md">3</div>
            <h3 className="text-xl font-bold mb-3 font-heading text-[var(--color-text-main)]">Klik & Sah!</h3>
            <p className="text-[var(--color-text-muted)]">Dokumen akan terbungkus aman dengan algoritma kriptografi SHA-256 dan QR Code verifikasi.</p>
          </div>
        </div>
      </section>

      {/* Extended Validation & Stats Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 w-full space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-[var(--color-text-main)] leading-tight">
              Kendalikan Aliran <br/> Dokumen Bisnis Anda.
            </h2>
            <p className="text-lg text-[var(--color-text-muted)] leading-relaxed">
              Mulai dari pekerja lepas *(freelancer)* hingga perusahaan multinasional berskala besar, WeSign didesain menopang arsitektur validasi Anda secara tangguh.
            </p>
            <ul className="space-y-5">
              <li className="flex items-center gap-4">
                <div className="bg-primary/20 dark:bg-primary/10 p-2.5 rounded-full"><CheckCircle2 size={24} className="text-primary"/></div>
                <span className="text-[var(--color-text-main)] font-semibold text-lg">Validasi Tingkat Kriptografi SHA-256</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="bg-primary/20 dark:bg-primary/10 p-2.5 rounded-full"><CheckCircle2 size={24} className="text-primary"/></div>
                <span className="text-[var(--color-text-main)] font-semibold text-lg">Masking Data Sensitif pada Dokumen Publik</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="bg-primary/20 dark:bg-primary/10 p-2.5 rounded-full"><CheckCircle2 size={24} className="text-primary"/></div>
                <span className="text-[var(--color-text-main)] font-semibold text-lg">Kolaborasi TTD Sinkronisasi Real-Time</span>
              </li>
            </ul>
          </div>

          <div className="flex-1 w-full relative">
            <div className="glass-panel p-10 relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 shadow-2xl">
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary rounded-full blur-[80px] opacity-20 -z-10"></div>
               <h3 className="text-2xl font-bold font-heading mb-8 text-[var(--color-text-main)] border-b border-primary/20 pb-4">Metrik Keamanan Infrastruktur</h3>
               <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                 <div>
                   <div className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-primary mb-2">99.9%</div>
                   <div className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider text-xs">Uptime Peladen</div>
                 </div>
                 <div>
                   <div className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-primary mb-2">RSA</div>
                   <div className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider text-xs">Kunci Enkripsi 2048-bit</div>
                 </div>
                 <div>
                   <div className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-primary mb-2">&lt; 1s</div>
                   <div className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider text-xs">Latensi Modul Grup</div>
                 </div>
                 <div>
                   <div className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-primary mb-2">Bcrypt</div>
                   <div className="text-[var(--color-text-muted)] font-medium uppercase tracking-wider text-xs">Hashing PIN Penandatangan</div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full" id="harga">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 tracking-tight text-[var(--color-text-main)]">Investasi Cerdas. Akses Tak Terbatas.</h2>
          <p className="text-xl text-[var(--color-text-muted)]">Pilih paket yang paling sesuai dengan intensitas volume dokumen Anda. Bebas *upgrade* kapan saja.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Paket Gratis */}
          <div className="glass-panel p-8 md:p-10 flex flex-col border border-slate-200/50 dark:border-slate-800 hover:border-primary/50 transition-colors">
            <h3 className="text-2xl font-bold font-heading mb-3 text-[var(--color-text-main)]">Personal</h3>
            <p className="text-[var(--color-text-muted)] mb-8 h-12">Cocok digunakan bagi kebutuhan korespondensi mendadak.</p>
            <div className="mb-10 font-heading border-b border-slate-200 dark:border-slate-800 pb-8">
              <span className="text-5xl font-bold text-[var(--color-text-main)]">Gratis</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-start gap-4 text-[var(--color-text-muted)]"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Limit 5 Dokumen per Bulan</span></li>
              <li className="flex items-start gap-4 text-[var(--color-text-muted)]"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Fitur Verifikasi QR Universal</span></li>
              <li className="flex items-start gap-4 text-[var(--color-text-muted)]"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Maksimal Gabung 1 Grup TTD</span></li>
              <li className="flex items-start gap-4 text-slate-400 dark:text-slate-600 opacity-50"><X size={24} className="flex-shrink-0"/> <span className="line-through leading-snug">Notifikasi Integrasi WhatsApp</span></li>
            </ul>
            <button className="w-full py-4 rounded-xl border-2 border-primary text-primary font-bold text-lg hover:bg-primary/10 transition-colors cursor-pointer mt-auto">Mulai Tanpa Kartu</button>
          </div>

          {/* Paket Profesional (Highlight) */}
          <div className="glass-panel p-8 md:p-10 flex flex-col border-2 border-primary shadow-[0_20px_50px_rgba(41,181,122,0.15)] relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 uppercase tracking-wide">
              <Star size={16} fill="currentColor" /> Pemuatan Terfavorit
            </div>
            <h3 className="text-2xl font-bold font-heading mb-3 text-[var(--color-text-main)]">Profesional</h3>
            <p className="text-[var(--color-text-muted)] mb-8 h-12">Alat tempur kelengkapan birokrasi bagi pimpinan startup & UMKM.</p>
            <div className="mb-10 font-heading border-b border-primary/20 pb-8 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-[var(--color-text-main)]">Rp49k</span>
              <span className="text-[var(--color-text-muted)] font-medium text-lg">/ bulan</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-start gap-4 text-[var(--color-text-main)] font-semibold"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Kapasitas Dokumen Tak Terbatas</span></li>
              <li className="flex items-start gap-4 text-[var(--color-text-main)] font-semibold"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Pembuatan 20 Grup Kolaborasi</span></li>
              <li className="flex items-start gap-4 text-[var(--color-text-main)] font-semibold"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Fitur Penandatanganan Massal (*Batch*)</span></li>
              <li className="flex items-start gap-4 text-[var(--color-text-main)] font-semibold"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Robot Notifikasi WhatsApp Real-time</span></li>
              <li className="flex items-start gap-4 text-[var(--color-text-main)] font-semibold"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Dukungan *Customer Support* Prioritas</span></li>
            </ul>
            <button className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-colors shadow-lg cursor-pointer mt-auto">Langganan Sekarang</button>
          </div>

          {/* Paket Enterprise */}
          <div className="glass-panel p-8 md:p-10 flex flex-col border border-slate-200/50 dark:border-slate-800 hover:border-primary/50 transition-colors">
            <h3 className="text-2xl font-bold font-heading mb-3 text-[var(--color-text-main)]">Perusahaan Besar</h3>
            <p className="text-[var(--color-text-muted)] mb-8 h-12">Korporasi yang memiliki standar kepatuhan regulasi sangat ketat.</p>
            <div className="mb-10 font-heading border-b border-slate-200 dark:border-slate-800 pb-8">
              <span className="text-5xl font-bold text-[var(--color-text-main)]">Kustom</span>
            </div>
            <ul className="space-y-5 mb-10 flex-1">
              <li className="flex items-start gap-4 text-[var(--color-text-muted)]"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Membuka kunci seluruh lini Profesional</span></li>
              <li className="flex items-start gap-4 text-[var(--color-text-muted)]"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Infrastruktur Database (*On-Premise*)</span></li>
              <li className="flex items-start gap-4 text-[var(--color-text-muted)]"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Akses Jembatan (*API*) TTD untuk Sistem Anda</span></li>
              <li className="flex items-start gap-4 text-[var(--color-text-muted)]"><Check size={24} className="text-primary flex-shrink-0"/> <span className="leading-snug">Branding Kustom Logo Perusahaan di dalam PDF</span></li>
            </ul>
            <button className="w-full py-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-[var(--color-text-main)] font-bold text-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer mt-auto">Konsultasi Teknisi</button>
          </div>
          
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto w-full">
        <div className="glass-panel p-12 md:p-20 flex flex-col items-center text-center relative overflow-hidden border border-primary/20 shadow-2xl bg-gradient-to-br from-primary/5 to-transparent">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-[var(--color-text-main)] mb-6 tracking-tight">Siap Beranjak ke Era Digital?</h2>
          <p className="text-lg sm:text-xl text-[var(--color-text-muted)] mb-10 max-w-2xl leading-relaxed">
            Bergabung bersama 10.000+ profesional yang telah menghemat waktu dan kertas setiap harinya.
          </p>
          <button className="bg-primary hover:bg-primary-dark text-white border-none px-10 py-5 rounded-xl cursor-pointer text-lg font-bold transition-all transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(41,181,122,0.3)]">
            Buat Akun Gratis Sekarang
          </button>
        </div>
      </section>

      {/* Footer Minimalis */}
      <footer className="py-12 px-6 flex flex-col items-center border-t border-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)] text-center">
        <p className="m-0">© 2026 WeSign Technologies. All rights reserved.</p>
        <div className="flex gap-6 mt-4">
          <a href="#" className="hover:text-primary transition-colors hover:underline">Privasi</a>
          <a href="#" className="hover:text-primary transition-colors hover:underline">Syarat & Ketentuan</a>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
