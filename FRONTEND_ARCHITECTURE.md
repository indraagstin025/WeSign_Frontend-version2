# Arsitektur Frontend wesign-v2 (Feature-Sliced Design)

Dokumen ini memuat pakem rancangan struktur direktori untuk proyek antarmuka **wesign-v2** menggunakan React (Vite).
Tujuan utama arsitektur terpisah ini (FDD) adalah memastikan proyek mudah dirawat (Maintainable), terukur (Scalable), dan bebas pusing ketika terjadi pencarian Bug atau penambahan Modul di fase *Production*.

Teknologi pendukung: **React 18+, Vite, React Router DOM, Tailwind/Vanilla CSS (Mix), Axios, Socket.io-client**.

---

## 📂 Pohon Struktur Direktori Utama

```text
wesign-v2/
├── public/                 # Favicon, meta-tags gambar, dll.
├── src/
│   ├── assets/             # Aset Statis Global
│   │   ├── images/         # Logo aplikasi, ilustrasi pendaftaran
│   │   └── icons/          # Ikon SVG ringan
│   │
│   ├── components/         # Komponen UI Cerdas & Bebas API (Dumb Components)
│   │   ├── Elements/       # Button, InputText, Loader, Badge
│   │   ├── Feedback/       # Alert Messages, Toast, Modal/Dialog
│   │   └── Layout/         # Header, Footer, Navbar murni
│   │
│   ├── config/             # Rahasia & Konstanta Global
│   │   ├── constants.js    # Konfigurasi batas upload (5MB)
│   │   └── env.js          # API URL (VITE_API_BASE_URL)
│   │
│   ├── layouts/            # Kerangka Cetakan Halaman Web
│   │   ├── AuthLayout.jsx      # Desain panel belah dua (Kiri Gambar, Kanan Form)
│   │   ├── DashboardLayout.jsx # Desain Sidebar + Topbar + Main Content
│   │   └── PublicLayout.jsx    # Halaman Scanning QR (Tanpa Sidebar Menu)
│   │
│   ├── lib/                # Konfigurasi Adaptor Eksternal
│   │   ├── axios.js        # Pencegat (Interceptor) Token JWT (401 Redirect)
│   │   └── socket.js       # Penginisialisasi rute grup soket real-time
│   │
│   ├── features/           # ✨ JANTUNG APLIKASI (Modul Independen)
│   │   │
│   │   ├── auth/           # Fitur Autentikasi Publik
│   │   │   ├── api/        # Panggilan ke backend `login`, `register`
│   │   │   ├── components/ # FormLogin.jsx, FormRegister.jsx
│   │   │   └── hooks/      # useAuth.js
│   │   │
│   │   ├── documents/      # Logika Dokumen Personal
│   │   │   ├── api/
│   │   │   ├── components/ # DocumentUploader, ListPersonalDocument
│   │   │   └── hooks/      
│   │   │
│   │   ├── groups/         # Modul Tersulit: Tandatangan Bersama
│   │   │   ├── api/
│   │   │   ├── components/ # GroupInvitePanel, CanvasSignerNode
│   │   │   └── hooks/      # useGroupSocketTrigger.js
│   │   │
│   │   ├── packages/       # Paket Modul Borongan (Batch)
│   │   │   ├── api/
│   │   │   └── components/ # BatchList, PackageLimitCounter
│   │   │
│   │   ├── signature/      # Alat Tempur Desain & Tanda Tangan
│   │   │   ├── api/
│   │   │   └── components/ # DraggableSignature.jsx, QRCodeStamp.jsx
│   │   │
│   │   ├── payment/        # Langganan & Dompet Premium
│   │   │   └── components/ # MidtransSnapModal.jsx, PricingCards.jsx
│   │   │
│   │   └── verification/   # Alat Pengecek Dokumen Publik (QR Scan)
│   │       ├── api/
│   │       └── components/ # HashMatcher.jsx, PinUnlockDialog.jsx
│   │
│   ├── hooks/              # Kait Logika Global
│   │   ├── useTheme.js     # Mode Gelap / Terang
│   │   └── useDebounce.js  # Jeda bar pencarian dokumen
│   │
│   ├── pages/              # 🚦 Pengeksekusi Akhir (Perakit Fitur)
│   │   ├── auth/           # -> LoginPage.jsx, RegisterPage.jsx
│   │   ├── dashboard/      # -> OverviewDashboard.jsx, UserProfile.jsx
│   │   ├── workspace/      # -> PersonalEditor.jsx, GroupEditor.jsx
│   │   └── public/         # -> VerificationQRPage.jsx
│   │
│   ├── routes/             # Jaringan Lalu Lintas URL
│   │   ├── AppRouter.jsx       # Pendaftaran Seluruh Rute (<Routes>)
│   │   └── ProtectedRoute.jsx  # Pagar Gaib (Cek Auth API JWT vs Halaman)
│   │
│   ├── store/              # Otak Ingatan Sementara (State / Zustand)
│   │   └── useAppStore.js  
│   │
│   ├── styles/             # Penggerak Estetika & Kosmetik (CSS)
│   │   ├── index.css       # Inti file murni, Variabel HSL, Animasi keyframes
│   │   └── glassmorphism.css
│   │
│   ├── utils/              # Rak Perkakas Kecil Serbaguna
│   │   ├── formatters.js   # Angka -> Rupiah
│   │   └── timeHelpers.js  # Tanggal -> "3 Menit yang Lalu"
│   │
│   ├── App.jsx             # Pembungkus Tertinggi Pokok
│   └── main.jsx            # Titik Penyalaan React ke Browser (DOM)
├── .env                    # Variabel Sensitif (VITE_API_BASE_URL)
├── package.json
└── vite.config.js          # Konfigurasi Pembangunan Skrip
```

---

## 📋 Aturan Emas Pengerjaan (Golden Rules)
1. **Dumb vs Smart Components**: Folder `src/components` tidak diizinkan memanggil API `axios`. Ia hanya merender Props murni. Semua pemanggilan API diserahkan ke komponen di dalam `src/features/.../components`.
2. **Kapsulisasi Fitur**: Modul di `features/auth` dilarang keras mengkopi komponen internal dari `features/groups`. Jika mereka butuh kode yang sama, kodenya harus diangkat ke `src/components`.
3. **Pilar Glassmorphism**: Untuk mempertahankan nilai estetika "Premium W-ow", seluruh variabel desain gradien harus diatur murni di dalam `src/styles/` menggunakan token CSS.
