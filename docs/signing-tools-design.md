# Desain Fitur: Signing Tools Tambahan

## Ringkasan

Menambahkan 4 tools baru ke halaman penandatanganan:
- **Date Field** — Kolom tanggal otomatis/manual
- **Paraf (Initials)** — Inisial singkat per halaman
- **Stamp** — Cap/stempel instansi atau personal
- **Text Annotation** — Teks bebas (catatan, keterangan)

---

## Kategorisasi Elemen

### Kategori 1: Elemen Penandatanganan (`category: 'signing'`)

Elemen yang memiliki **implikasi legal** — membuktikan identitas, waktu, dan persetujuan. **Dicatat di audit trail.**

| Tool | Method | Deskripsi | Audit Trail |
|------|--------|-----------|-------------|
| Tanda Tangan | `signature` | TTD via canvas/ketik/upload | ✅ Ya |
| Paraf | `initial` | Inisial singkat (2-3 huruf) | ✅ Ya |
| Date Field | `date` | Tanggal penandatanganan | ✅ Ya |

### Kategori 2: Elemen Anotasi (`category: 'annotation'`)

Elemen yang sifatnya **dekoratif/informatif** — tidak membuktikan persetujuan personal. **Tidak dicatat di audit trail.**

| Tool | Method | Deskripsi | Audit Trail |
|------|--------|-----------|-------------|
| Stamp | `stamp` | Cap instansi/organisasi | ❌ Tidak |
| Text Annotation | `text` | Teks bebas (keterangan) | ❌ Tidak |

### Alasan Pemisahan

1. **Audit trail yang terlalu ramai jadi tidak berguna.** Jika setiap anotasi kecil masuk audit trail, informasi penting (TTD, paraf) tenggelam.
2. **Stamp bukan bukti persetujuan individu.** Cap/stempel adalah identitas organisasi, bukan pengikat personal secara hukum.
3. **Date field penting untuk audit** karena membuktikan kapan user mengklaim dokumen ditandatangani (bisa berbeda dengan timestamp server).
4. **Paraf penting untuk audit** karena membuktikan user telah membaca/menyetujui halaman tertentu.

---

## Arsitektur

### Prinsip Utama

Semua tools baru mengikuti pola yang sama dengan tanda tangan saat ini:
1. **Frontend** merender elemen visual menjadi gambar (canvas → base64)
2. **Frontend** mengirim koordinat + base64 + metadata ke backend
3. **Backend** menempelkan gambar ke PDF di koordinat yang diberikan
4. **Backend** mencatat di audit trail (hanya jika `category === 'signing'`)

### Tidak Perlu Endpoint Baru

Endpoint existing `POST /signatures/personal` sudah cukup. Yang berubah hanya payload yang dikirim.

---

## Payload API

### Struktur Per Elemen (Frontend → Backend)

```json
{
  "documentVersionId": "uuid",
  "pageNumber": 3,
  "positionX": 0.45,
  "positionY": 0.72,
  "width": 0.25,
  "height": 0.08,
  "signatureImageUrl": "data:image/png;base64,...",
  "method": "signature | initial | date | stamp | text",
  "category": "signing | annotation",
  "metadata": {
    "dateValue": "2026-05-17",
    "textContent": "Disetujui oleh Bagian Keuangan",
    "stampName": "PT WeSign Indonesia",
    "fontFamily": "dancing"
  },
  "displayQrCode": true
}
```

### Field Baru

| Field | Tipe | Required | Deskripsi |
|-------|------|----------|-----------|
| `category` | enum(`signing`, `annotation`) | Ya | Menentukan apakah masuk audit trail |
| `metadata` | JSON (nullable) | Tidak | Data tambahan per tipe elemen |

### Metadata Per Method

| Method | Metadata Fields | Contoh |
|--------|----------------|--------|
| `signature` | `fontFamily` (jika typed) | `{ "fontFamily": "dancing" }` |
| `initial` | `initials` | `{ "initials": "IA" }` |
| `date` | `dateValue`, `format` | `{ "dateValue": "2026-05-17", "format": "DD MMMM YYYY" }` |
| `stamp` | `stampName`, `stampType` | `{ "stampName": "PT WeSign", "stampType": "organization" }` |
| `text` | `textContent`, `fontSize` | `{ "textContent": "Disetujui", "fontSize": 12 }` |

---

## Perubahan Backend

### 1. Validasi Input (Low Effort)

Perluas whitelist `method`:

```javascript
// Sebelum
const VALID_METHODS = ['canvas', 'typed', 'upload'];

// Sesudah
const VALID_METHODS = ['canvas', 'typed', 'upload', 'signature', 'initial', 'date', 'stamp', 'text'];
const VALID_CATEGORIES = ['signing', 'annotation'];
```

### 2. Database Migration (Low Effort)

```sql
ALTER TABLE "Signature" ADD COLUMN "category" TEXT DEFAULT 'signing';
ALTER TABLE "Signature" ADD COLUMN "metadata" JSONB;
```

Atau di Prisma schema:

```prisma
model Signature {
  // ... existing fields
  category  String  @default("signing") // "signing" | "annotation"
  metadata  Json?                        // metadata tambahan per tipe
}
```

### 3. Audit Trail Generator (Medium Effort)

Update template PDF audit trail untuk menampilkan label per method:

```javascript
const METHOD_LABELS = {
  signature: 'Tanda Tangan',
  canvas: 'Tanda Tangan (Gambar)',
  typed: 'Tanda Tangan (Ketik)',
  upload: 'Tanda Tangan (Unggah)',
  initial: 'Paraf',
  date: 'Kolom Tanggal',
  stamp: 'Stempel',
  text: 'Anotasi Teks',
};

// Saat generate audit trail, filter hanya category === 'signing'
const auditableSignatures = signatures.filter(s => s.category === 'signing');
```

### 4. Contoh Output Audit Trail PDF

```
┌──────────────────────────────────────────────────────────┐
│ RIWAYAT PENANDATANGANAN                                  │
│ Dokumen: Kontrak_Kerja_2026.pdf                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Penanda Tangan: Indra Agustin                            │
│ Email: indra@mail.com                                    │
│                                                          │
│ Elemen yang diterapkan:                                  │
│   ✍️  Tanda Tangan    — Halaman 3                        │
│   🔤  Paraf           — Halaman 1, 2                     │
│   📅  Tanggal         — 17 Mei 2026 (Halaman 3)         │
│                                                          │
│ Waktu Penandatanganan: 17 Mei 2026, 14:32:05 WIB        │
│ Alamat IP: 103.xxx.xxx.xx                                │
│ Metode Verifikasi: Email OTP                             │
│                                                          │
│ ─────────────────────────────────────────────────────    │
│ Integritas dokumen dijamin oleh tanda tangan digital     │
│ SHA-256. Dokumen ini sah tanpa materai.                  │
└──────────────────────────────────────────────────────────┘
```

---

## Perubahan Frontend

### 1. Komponen Baru

| File | Deskripsi |
|------|-----------|
| `DateFieldTool.jsx` | Modal/popover untuk pilih tanggal + format |
| `InitialTool.jsx` | Input 2-3 karakter + pilih font + render |
| `StampTool.jsx` | Upload/pilih stamp template + render |
| `TextAnnotationTool.jsx` | Input teks + font size + warna + render |

### 2. Update PdfToolbar

Tambahkan tombol tools baru di toolbar:

```
[ 🖐 Geser | 🖱 Tempel | --- | ✍️ TTD | 🔤 Paraf | 📅 Tanggal | 🏛️ Stamp | 📝 Teks | --- | ◀ 1/3 ▶ ]
```

### 3. Update useDocumentSigner Hook

- Tambah state `activeTool` (`'signature' | 'initial' | 'date' | 'stamp' | 'text'`)
- `handleCanvasClick` → cek `activeTool`, buka modal yang sesuai atau langsung tempel
- `handleFinalSign` → kirim `category` dan `metadata` per elemen

### 4. Render ke Base64

Semua tools merender output ke canvas → `toDataURL()`:

```javascript
// Date Field
const renderDateToImage = (dateValue, format) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = '14px Inter';
  ctx.fillText(formatDate(dateValue, format), 10, 20);
  return canvas.toDataURL('image/png');
};

// Text Annotation
const renderTextToImage = (text, fontSize, color) => {
  const canvas = document.createElement('canvas');
  // ... render teks
  return canvas.toDataURL('image/png');
};
```

---

## Prioritas Implementasi

| Fase | Tools | Effort | Alasan |
|------|-------|--------|--------|
| **Fase 1** | Paraf (Initial) | Rendah | Tab "Inisial" sudah ada di SignatureCanvas, tinggal pisahkan |
| **Fase 2** | Date Field | Rendah | Render tanggal ke canvas sederhana |
| **Fase 3** | Text Annotation | Sedang | Perlu input teks + font picker + render |
| **Fase 4** | Stamp | Sedang | Perlu upload/template management + render |

---

## Backward Compatibility

- Field `category` default `'signing'` → signature lama tetap masuk audit trail
- Field `metadata` nullable → tidak break existing data
- Method lama (`canvas`, `typed`, `upload`) tetap valid
- Endpoint tidak berubah → frontend lama tetap bisa kirim tanpa `category`/`metadata`

---

## Kesimpulan

| Aspek | Detail |
|-------|--------|
| Endpoint baru? | ❌ Tidak perlu |
| Migration DB? | ✅ Minimal (2 kolom: `category` + `metadata`) |
| Breaking change? | ❌ Tidak — fully backward compatible |
| Frontend effort | ~3-5 hari (4 komponen baru + update toolbar + hook) |
| Backend effort | ~1-2 hari (validasi + migration + update audit trail template) |
