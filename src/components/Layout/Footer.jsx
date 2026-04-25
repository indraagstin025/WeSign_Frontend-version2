import { Feather, Globe, Mail, MessageSquare } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-zinc-50 dark:bg-black pt-20 pb-10 px-6 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 font-heading font-bold text-2xl text-zinc-900 dark:text-white tracking-tighter">
              <div className="p-1.5 bg-primary rounded-lg text-white">
                <Feather size={20} />
              </div>
              WeSign
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Solusi tanda tangan digital terpercaya untuk mempercepat alur kerja bisnis Anda dengan keamanan tingkat tinggi dan kepatuhan hukum.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:text-primary transition-colors border border-zinc-200 dark:border-zinc-800">
                <Mail size={18} />
              </a>
              <a href="#" className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:text-primary transition-colors border border-zinc-200 dark:border-zinc-800">
                <Globe size={18} />
              </a>
              <a href="#" className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm hover:text-primary transition-colors border border-zinc-200 dark:border-zinc-800">
                <MessageSquare size={18} />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Produk</h4>
            <ul className="flex flex-col gap-4 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Fitur Utama</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Harga & Paket</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Integrasi API</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Keamanan</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Perusahaan</h4>
            <ul className="flex flex-col gap-4 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Karir</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog & Berita</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Kontak</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-bold text-zinc-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Legalitas</h4>
            <ul className="flex flex-col gap-4 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Kepatuhan Hukum</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
          <p>&copy; 2026 WeSign Technologies Inc. Seluruh hak cipta dilindungi.</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Sistem Berjalan Normal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
