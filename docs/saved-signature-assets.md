# Desain Fitur: Saved Signature Assets (Persistent)

## Ringkasan

Menyimpan tanda tangan, paraf, stamp, dan teks secara permanen agar user tidak perlu membuat ulang setiap kali menandatangani dokumen. Asset disimpan ke Backblaze B2 (folder khusus per user) dan metadata di database.

---

## Alur User

### Pertama Kali
1. User buka halaman signing → sidebar kosong (belum ada asset)
2. Klik "Tambah Tanda Tangan" → buat di modal → klik "Terapkan"
3. Frontend upload image ke backend → backend simpan ke Backblaze
4. Asset muncul di sidebar sebagai "Default"
5. Klik PDF → tempel

### Kunjungan Berikutnya
1. User buka halaman signing → sidebar langsung tampil asset terakhir (fetch dari API)
2. Langsung klik PDF → tempel (tanpa buat ulang)
3. Bisa buat asset baru atau hapus yang lama

### Multiple Assets
- User bisa punya beberapa TTD (misal: formal + informal)
- Satu asset per tipe bisa di-set sebagai "Default"
- Klik asset di sidebar → switch aktif

---

## Backend

### Database Schema (Prisma)

```prisma
model SignatureAsset {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        String   // 'signature' | 'initial' | 'stamp' | 'text'
  imageUrl    String   // URL publik dari Backblaze
  storageKey  String   // Key di Backblaze untuk delete
  label       String?  // Label custom: "TTD Formal", "APPROVED", dll
  isDefault   Boolean  @default(false)
  
  metadata    Json?    // Data tambahan per tipe
  // signature: { method: 'canvas'|'typed'|'upload', fontFamily?, color? }
  // initial:  { initials: 'IA', fontStyle: 'bold', color: '#334155' }
  // stamp:    { stampLabel: 'APPROVED', color: '#16a34a' }
  // text:     { textContent: 'Jakarta, 15 Mei 2026', fontSize: 14, fontFamily: 'Inter' }
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, type])
  @@index([userId, isDefault])
}
```

### Migration

```sql
CREATE TABLE "SignatureAsset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "label" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "SignatureAsset_userId_type_idx" ON "SignatureAsset"("userId", "type");
CREATE INDEX "SignatureAsset_userId_isDefault_idx" ON "SignatureAsset"("userId", "isDefault");
ALTER TABLE "SignatureAsset" ADD CONSTRAINT "SignatureAsset_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
```

### API Endpoints

#### 1. Upload Asset Baru

```
POST /api/signatures/assets
Content-Type: multipart/form-data

Body:
  - image: File (PNG/JPG) atau base64 string
  - type: 'signature' | 'initial' | 'stamp' | 'text'
  - label: string (optional)
  - isDefault: boolean (optional, default true jika pertama)
  - metadata: JSON string (optional)

Response 201:
{
  "status": "success",
  "data": {
    "id": "uuid",
    "type": "signature",
    "imageUrl": "https://f005.backblazeb2.com/file/wesign/signatures/userId/sig_abc.png",
    "label": "TTD Formal",
    "isDefault": true,
    "metadata": { "method": "canvas", "color": "#334155" },
    "createdAt": "2026-05-17T14:32:00Z"
  }
}
```

#### 2. List Assets User

```
GET /api/signatures/assets?type=signature
GET /api/signatures/assets (semua tipe)

Response 200:
{
  "status": "success",
  "data": [
    {
      "id": "uuid-1",
      "type": "signature",
      "imageUrl": "https://...",
      "label": "TTD Formal",
      "isDefault": true,
      "createdAt": "2026-05-17T14:32:00Z"
    },
    {
      "id": "uuid-2",
      "type": "initial",
      "imageUrl": "https://...",
      "label": "Paraf IA",
      "isDefault": true,
      "createdAt": "2026-05-17T14:33:00Z"
    }
  ]
}
```

#### 3. Hapus Asset

```
DELETE /api/signatures/assets/:id

Response 200:
{
  "status": "success",
  "message": "Asset berhasil dihapus"
}
```

Backend juga hapus file dari Backblaze.

#### 4. Set Default

```
PATCH /api/signatures/assets/:id/default

Response 200:
{
  "status": "success",
  "data": { "id": "uuid", "isDefault": true }
}
```

Backend otomatis un-set default lama (per tipe) sebelum set yang baru.

---

### Backblaze Storage

**Folder structure:**
```
wesign-bucket/
  signatures/
    {userId}/
      sig_{nanoid}.png
      initial_{nanoid}.png
      stamp_{nanoid}.png
      text_{nanoid}.png
```

**Upload logic (backend):**
1. Terima base64 dari frontend
2. Decode ke buffer
3. Upload ke Backblaze: `signatures/{userId}/{type}_{nanoid}.png`
4. Simpan URL + storageKey ke database
5. Return URL ke frontend

**Delete logic:**
1. Hapus dari database
2. Hapus file dari Backblaze menggunakan `storageKey`

---

## Frontend

### Service API

```javascript
// src/features/signature/api/signatureAssetService.js

import { apiFetch } from '../../../services/api';

export async function getMyAssets(type) {
  const query = type ? `?type=${type}` : '';
  return apiFetch(`/signatures/assets${query}`);
}

export async function uploadAsset({ image, type, label, isDefault, metadata }) {
  return apiFetch('/signatures/assets', {
    method: 'POST',
    body: { image, type, label, isDefault, metadata },
  });
}

export async function deleteAsset(id) {
  return apiFetch(`/signatures/assets/${id}`, { method: 'DELETE' });
}

export async function setAssetDefault(id) {
  return apiFetch(`/signatures/assets/${id}/default`, { method: 'PATCH' });
}
```

### Hook

```javascript
// src/features/signature/hooks/useSignatureAssets.js

import { useState, useEffect, useCallback } from 'react';
import { getMyAssets, uploadAsset, deleteAsset, setAssetDefault } from '../api/signatureAssetService';

export const useSignatureAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAssets();
      if (res.status === 'success') setAssets(res.data);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const upload = async (image, type, label, metadata) => {
    const res = await uploadAsset({ image, type, label, isDefault: true, metadata });
    if (res.status === 'success') {
      setAssets(prev => [...prev, res.data]);
      return res.data;
    }
    return null;
  };

  const remove = async (id) => {
    await deleteAsset(id);
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const makeDefault = async (id) => {
    const res = await setAssetDefault(id);
    if (res.status === 'success') {
      setAssets(prev => prev.map(a => ({
        ...a,
        isDefault: a.id === id ? true : (a.type === res.data.type ? false : a.isDefault)
      })));
    }
  };

  // Helper: ambil default asset per tipe
  const getDefault = (type) => assets.find(a => a.type === type && a.isDefault);
  const getByType = (type) => assets.filter(a => a.type === type);

  return { assets, loading, fetchAssets, upload, remove, makeDefault, getDefault, getByType };
};
```

### Integrasi ke Halaman Signing

```jsx
// Di DocumentSigningPage.jsx
const { assets, loading: assetsLoading, upload, getDefault } = useSignatureAssets();

// Saat halaman load, set default signature sebagai aktif
useEffect(() => {
  const defaultSig = getDefault('signature');
  if (defaultSig && !currentSignature) {
    setCurrentSignature(defaultSig.imageUrl);
    setActiveElement({ type: 'signature', imageUrl: defaultSig.imageUrl });
  }
}, [assets]);

// Saat user buat TTD baru di modal
const handleSaveCanvas = async (dataUrl) => {
  // Upload ke backend
  const saved = await upload(dataUrl, 'signature', 'Signature Anda', { method: 'canvas' });
  if (saved) {
    setCurrentSignature(saved.imageUrl);
    setActiveElement({ type: 'signature', imageUrl: saved.imageUrl });
  }
};
```

### Perubahan Sidebar

Sidebar menampilkan **list saved assets** per tipe (bukan hanya 1 "aktif"):

```jsx
// Di SigningSidebar — section "TANDA TANGAN AKTIF" berubah menjadi list
{assets.filter(a => a.type === 'signature').map(asset => (
  <div key={asset.id} onClick={() => switchTo(asset)} className={...}>
    <img src={asset.imageUrl} />
    <span>{asset.label}</span>
    {asset.isDefault && <Badge>Default</Badge>}
  </div>
))}
```

---

## Prioritas Implementasi

| Fase | Task | Effort |
|------|------|--------|
| **1** | Prisma schema + migration | 30 menit |
| **2** | Backend endpoint CRUD (upload ke Backblaze) | 2-3 jam |
| **3** | Frontend service + hook | 1 jam |
| **4** | Integrasi ke halaman signing (auto-load default) | 1-2 jam |
| **5** | UI list assets di sidebar + manage (hapus/set default) | 1-2 jam |

**Total estimasi: ~6-8 jam kerja**

---

## Keamanan

- Asset hanya bisa diakses oleh pemiliknya (filter `userId` di semua query)
- URL Backblaze bisa dibuat private (signed URL) jika diperlukan
- Validasi file: hanya PNG/JPG, max 2MB
- Rate limit: max 10 assets per tipe per user

---

## Backward Compatibility

- User lama yang belum punya saved assets → flow tetap sama (buat di modal, simpan sementara di session)
- Setelah fitur aktif, asset otomatis tersimpan saat pertama kali dibuat
- Tidak ada breaking change di endpoint signing yang sudah ada

---

## Edge Cases

| Case | Handling |
|------|----------|
| User hapus semua assets | Sidebar kosong, harus buat baru |
| User punya 10+ TTD | Scroll di sidebar, limit max 20 per tipe |
| Upload gagal (network) | Fallback ke session-only (seperti sekarang), retry later |
| Backblaze down | Serve dari cache/CDN, atau fallback base64 di DB |
