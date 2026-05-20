# Frontend — Pola Hit API Berulang

> **Tanggal awal:** 20 Mei 2026
> **Update:** 21 Mei 2026 — re-evaluasi setelah Backend Sprint selesai (28/28 item + Redis Phase 1-3)
> **Scope:** Pola di frontend yang menyebabkan endpoint backend di-hit berkali-kali padahal hasilnya bisa di-share antar hook, di-cache, atau di-paralelisasi
> **Status:** Analisis selesai + re-evaluasi post-backend — siap eksekusi
>
> **Catatan:** Sisi backend (operasi mahal di server) sudah dipindah ke
> [Backend-DigiSign/docs/backend-expensive-operations.md](../../Backend-DigiSign/docs/backend-expensive-operations.md).

---

## 📋 Update Post-Backend Sprint (21 Mei 2026)

Setelah backend sprint selesai (28/28 hot-spot + Redis Phase 1-3 lengkap), saya re-evaluasi 13 item awal frontend. Beberapa item:
- **Dampaknya berkurang** karena backend sudah cache (FE-9, FE-13)
- **Scope-nya berubah** karena ada endpoint baru dari backend (FE-5 via BE-4 split)
- **Tetap relevan** karena masih ada redundant request di sisi network (FE-1, FE-2, FE-3, FE-4, FE-6, FE-8, FE-10, FE-11)
- **Resolved tanpa kerja frontend** (FE-13 via BE-2)

Plus **3 task baru** muncul karena backend menyediakan endpoint ringan dari BE-4 split:
- **FE-14** Migrate `useGroupData` ke `/groups/:id/summary` untuk view ringan
- **FE-15** Pakai `/groups/:id/members?page=` untuk paginated member tab
- **FE-16** Verifikasi `getAllUserGroups` (sudah cached P3-1) tidak butuh tambahan kerja

### Tabel Task Pengerjaan Per Level

#### 🔴 Kritis (~3-4 jam total) — Prioritas Eksekusi

| ID | Task | Lokasi | Effort | Status |
|----|------|--------|--------|--------|
| FE-1 | Dedup `getPackageDetails` antar 3 hook (cache key shared / SWR) | `packages/hooks/{usePackageInfo, usePackagePreview, useSignPackage}.js` | 1.5-2 jam | ⏳ Belum |
| FE-2 | Optimistic update `usePackages.refresh` (5 cascade → 2 calls) | `packages/hooks/usePackages.js` | 30 menit | ⏳ Belum |
| FE-8 | Optimistic update `useDocuments.refresh` (6 cascade → 2 calls) | `documents/hooks/useDocuments.js` | 30 menit | ⏳ Belum |

#### 🟡 Medium (~5-6 jam total)

| ID | Task | Lokasi | Effort | Status | Catatan Backend |
|----|------|--------|--------|--------|-----------------|
| FE-3 | Module-level cache `useDocumentTypes` TTL 30 menit | `documents/hooks/useDocumentTypes.js` | 15 menit | ⏳ Belum | Backend whitelist static, bukan DB query |
| FE-4 | Parallelize `getDocumentDetail` + `getDocumentFile` (6 lokasi) | Multiple hooks (lihat detail FE-4) | 30 menit | ⏳ Belum | — |
| FE-5 | SWR cache untuk `getGroupDetail` + migrate ke endpoint ringan | `groups/hooks/{useGroupData, useGroupDetailPage, ...}.js` | 1.5 jam | ⏳ Belum | **Pair dengan FE-14/15** |
| FE-6 | Frontend cache signature assets di Context atau SWR | `signature/hooks/useSignatureAssets.js` | 30 menit | ⏳ Belum | Backend Redis P1-2 cache 24h sudah ada |
| FE-9 | Cache `useUserQuota` di UserContext atau SWR | `user/hooks/useUserQuota.js` | 30 menit | ⏳ Belum | Impact lebih kecil — backend P1-4 cache 60s |
| FE-10 | Pisah effect `useUserProfile` pakai `user.id` dep | `user/hooks/useUserProfile.js` | 10 menit | ⏳ Belum | — |
| FE-11 | Kombinasi 3 fetch initial `useGroupDetailPage` di `Promise.all` | `groups/hooks/useGroupDetailPage.js` | 15 menit | ⏳ Belum | Pair dengan FE-14/15 |
| **FE-14** ✨ | Migrate `useGroupData` ke `/groups/:id/summary` (~5KB vs 200KB) untuk view ringan | `groups/hooks/useGroupData.js` | 30 menit | ⏳ Belum | **Baru** — manfaatkan BE-4 split |
| **FE-15** ✨ | Paginated members via `/groups/:id/members?page=&search=` | `groups/components/{GroupMembersTab, GroupSettingsModal}.jsx` | 1 jam | ⏳ Belum | **Baru** — manfaatkan BE-4 split |

#### 🟢 Optional / Resolved

| ID | Task | Lokasi | Status | Catatan |
|----|------|--------|--------|---------|
| FE-7 | Pisah `socketService.connect()` ke mount-once di `useGroupsPage` | `groups/hooks/useGroupsPage.js` | ⏳ 10 menit (cosmetic) | — |
| FE-12 | (cover by FE-6) | — | ⏳ Cover by FE-6 | — |
| **FE-13** ✅ | `useDashboard` no cache | — | ✅ **RESOLVED** | BE-2 dashboard cache 60s sudah cover |
| **FE-16** ✨ | Verifikasi `useGroupsPage` benefit dari P3-1 group list cache | `groups/hooks/useGroupsPage.js` | ⏳ 10 menit (verifikasi) | **Baru** — sudah otomatis via P3-1 backend |

### Ringkasan Total Setelah Update

| Severity | Count | Total Effort |
|----------|-------|--------------|
| 🔴 Kritis | 3 (FE-1, 2, 8) | ~3-4 jam |
| 🟡 Medium | 9 (FE-3, 4, 5, 6, 9, 10, 11, 14, 15) | ~5-6 jam |
| 🟢 Optional | 3 (FE-7, 12, 16) | ~30 menit |
| ✅ Resolved | 1 (FE-13) | 0 (sudah cover by BE-2) |
| **Total Aktif** | **15** | **~9-11 jam** |

### Strategi Sprint Frontend

**Opsi A — Setup SWR / React Query dulu (~2 jam initial setup, then ~5-6 jam fix):**
- Auto-solve FE-1, FE-3, FE-5, FE-6, FE-9, FE-12 sekaligus dengan dedup pattern declarative
- Tinggal sisa FE-2, FE-4, FE-7, FE-8, FE-10, FE-11, FE-14, FE-15 yang butuh fix manual
- **Total ~7-8 jam, lebih ergonomic**

**Opsi B — Fix manual per item (~9-11 jam):**
- Tidak butuh dependency baru
- Lebih lama tapi tidak ada breaking change global
- Cocok kalau tim belum familiar dengan SWR/RQ

### Saran Urutan Eksekusi

1. **Sprint 1 BE-4 Migration (~2 jam)**: FE-14 + FE-15 — manfaatkan endpoint ringan yang sudah disediakan backend, langsung visible improvement di list grup + member tab.
2. **Sprint 2 Critical Cascade (~1.5 jam)**: FE-2 + FE-8 — optimistic update di refresh pattern (5-6 cascade → 2 calls).
3. **Sprint 3 SWR Setup atau Manual Cache (~2-3 jam)**: Decide SWR vs custom cache, lalu fix FE-1 + FE-3 + FE-5 + FE-9.
4. **Sprint 4 Remaining Quick Wins (~1.5 jam)**: FE-4 + FE-6 + FE-10 + FE-11.
5. **Sprint 5 Optional/Cosmetic (~30 menit)**: FE-7 + FE-16 verifikasi.

---

## TL;DR

Saya temukan **13 pattern duplicate fetch** di frontend yang bisa di-eliminasi:

| Severity | Item | Impact |
|----------|------|--------|
| 🔴 Kritis | 3 (FE-1, FE-2, FE-8) | -70% calls ke endpoint paling sering hit |
| 🟡 Medium | 7 (FE-3..FE-6, FE-9..FE-11) | -30-50% calls antar navigation |
| 🟢 Optional | 3 (FE-7, FE-12, FE-13) | Cosmetic atau cover by BE |

**Rekomendasi single-step:** Setup React Query / SWR (~2 jam) akan otomatis solve **FE-1, FE-3, FE-5, FE-6, FE-9, FE-12** sekaligus.

---

## Audit Coverage

**File yang sudah saya inspect:**

API services (8):
- `auth/api/authService.js` ✅ light, no issue
- `documents/api/docService.js` ✅ → mostly light, dipakai di FE-4
- `groups/api/groupService.js` ✅ → cover FE-5
- `groups/api/groupSignatureService.js` ✅ light, no issue
- `packages/api/packageService.js` ✅ → cover FE-1, FE-2
- `signature/api/signatureService.js` ✅ light, no issue
- `signature/api/signatureAssetService.js` ✅ → cover FE-6
- `user/api/userService.js` ✅ → cover FE-9

Hooks (~25 file):
- `auth/hooks/*` (4 file) ✅ light, action-only
- `dashboard/hooks/useDashboard.js` ✅ → FE-13 (cover by BE-2)
- `documents/hooks/*` (~7 file) ✅ → FE-3 (`useDocumentTypes`), FE-4 (`useDocumentPreview`), FE-8 (`useDocuments`)
- `groups/hooks/*` (~8 file) ✅ → FE-5 (`useGroupData`+others), FE-7 (`useGroupsPage`), FE-11 (`useGroupDetailPage`)
- `packages/hooks/*` (~7 file) ✅ → FE-1, FE-2 (`usePackages`+`usePackageInfo`+`usePackagePreview`+`useSignPackage`)
- `signature/hooks/*` (~5 file) ✅ → FE-4 (`useDocumentSigner`), FE-12 (`useSignatureAssets`)
- `user/hooks/*` (~3 file) ✅ → FE-9 (`useUserQuota`), FE-10 (`useUserProfile`)

Context:
- `context/UserContext.jsx` ✅ no issue (sudah pakai Promise.all)

**Coverage:** semua API call path di `src/features/` sudah di-audit.

---

## Detail Pattern

### 🔴 FE-1 · `getPackageDetails` di-fetch 2-3× per user flow

**Lokasi:** 3 hook independent meng-fetch endpoint sama tanpa share state:
- `useSignPackage.js:89` — saat halaman sign
- `usePackagePreview.js:36` — saat halaman preview
- `usePackageInfo.js:32` — saat modal info

**Skenario user-flow:**
```
User di /packages → click Info paket → fetchPackageDetails (1)
User close modal → click Sign → fetchPackage di useSignPackage (2)
User refresh page sign → fetch lagi (3)
```

3× hit endpoint `/packages/:id` yang return seluruh paket + dokumen + signatures untuk data yang **sama persis**.

**Skenario re-render:**
- `usePackageInfo` re-fire kalau `pkg` prop reference berubah (parent re-render dengan object baru) → bisa fetch ulang
- Tidak ada de-duplication antar hook

**Fix:**
- Pakai SWR / React Query cache key `package:${id}` shared antar hook (paling clean)
- Atau buat single hook `usePackage(id)` di-share via Context untuk paket aktif
- Atau debounce/dedup di network layer (ApiClient with in-flight tracker)

**Effort:** 1.5-2 jam
**Impact:** -70% calls ke `/packages/:id` di flow normal

---

### 🔴 FE-2 · `usePackages.actions.refresh` = 5 sequential fetch

> **Update post-backend (21 Mei):** Backend dashboard cache (BE-2) sudah cover summary counts di `/api/dashboard`. Tetapi `usePackages.fetchStatusCounts` di list page masih hit `/packages?status=draft|completed` 3× independent. Solusi optimistic update tetap relevan, atau migrate ke endpoint dashboard yang sudah cached.

**Lokasi:** `usePackages.js:246-250`

```js
refresh: () => {
  fetchPackages(currentPage);  // 1× /packages?page=X
  fetchTrashCount();           // 1× /packages/trash?limit=1
  fetchStatusCounts();         // 3× /packages?status=draft|completed (Promise.all)
}
```

5 round-trip backend untuk **1 user action** (mis. setelah delete paket). `fetchStatusCounts` adalah cascade pattern yang sudah documented sebagai M-1 di sprint Packages — perlu endpoint `/packages/stats` baru di backend.

**Fix sementara (frontend-only):**
- Setelah delete/restore, hanya invalidate page list saat ini dengan optimistic update
- Trash count + status count update lokal (decrement) tanpa fetch
- Kalau perlu konsistensi mutlak, fetch hanya pada user-pull-refresh

**Fix permanen (cross-team):**
- Backend buat endpoint `/packages/stats` returning `{ all, draft, completed, trash }` dalam 1 query (`groupBy status`)
- Frontend ganti 4× cascade jadi 1× call

**Effort:** 30 menit (frontend optimistic) + 1 jam (backend stats endpoint)
**Impact:** 5 call → 2 call per refresh, plus zero call kalau optimistic update sukses

---

### 🟡 FE-3 · `useDocumentTypes` fetch tiap mount, dipakai 3 lokasi

**Lokasi:** `useDocumentTypes.js`

Hook fetch `/documents/types` di setiap mount tanpa cache. Dipakai di:
- `DocumentsPage.jsx` (filter dropdown)
- `UploadDocModal.jsx` (form select)
- `EditDocModal.jsx` (form select)

**Skenario:**
- Mount DocumentsPage → fetch (1)
- Buka Upload modal → fetch lagi (2)
- Close modal, buka Edit → fetch lagi (3)
- Pindah halaman dan kembali → fetch lagi (4)

Data ini adalah **whitelist 5 kategori** yang nyaris tidak pernah berubah.

**Fix:**

```js
// useDocumentTypes.js — module-level cache
let cachedTypes = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit

export const useDocumentTypes = () => {
  const [types, setTypes] = useState(cachedTypes || FALLBACK_DOCUMENT_TYPES);

  useEffect(() => {
    if (cachedTypes && Date.now() - cachedAt < CACHE_TTL_MS) return; // Cache valid

    let active = true;
    getDocumentTypes()
      .then(res => {
        const next = Array.isArray(res?.data) && res.data.length > 0 ? res.data : FALLBACK_DOCUMENT_TYPES;
        cachedTypes = next;
        cachedAt = Date.now();
        if (active) setTypes(next);
      })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  return { types, options: types.map(toOption) };
};
```

**Effort:** 15 menit
**Impact:** 4× fetch → 1× fetch per session

---

### 🟡 FE-4 · `getDocumentDetail` + `getDocumentFile` sequential di tiap detail page

**Lokasi:** Multiple hooks (`useDocumentSigner`, `useDocumentPreview`, `useGroupData`, `useGroupDocumentPreviewPage`, `usePackagePreview`, `useSignPackage`)

Pattern berulang:
```js
// 1. Fetch metadata (heavy include)
const docResponse = await getDocumentDetail(documentId);
// 2. Fetch signed URL (terpisah)
const fileResponse = await getDocumentFile(documentId, 'view');
```

**Sequential 2 round-trip** untuk page yang butuh keduanya bersamaan. Plus backend `getDocumentById` punya **monolithic findById** dengan 4 level nested include.

**Fix Tier A — Frontend parallelize:**
```js
const [docResponse, fileResponse] = await Promise.all([
  getDocumentDetail(documentId),
  getDocumentFile(documentId, 'view'),
]);
```

**Fix Tier B — Backend merge ke 1 endpoint** (kalau frontend selalu butuh keduanya):
```
GET /documents/:id?includeFile=true
Response: { ...documentMetadata, fileUrl: 'signed-url' }
```

**Effort:** 30 menit (Tier A frontend parallelize 6 lokasi) + 1 jam (Tier B backend new endpoint)
**Impact:** Sequential → parallel = -50% perceived latency. Merge endpoint = -1 round-trip

---

### 🟡 FE-5 · `getGroupDetail` dipanggil dari 4 hook independent

> **Update post-backend (21 Mei):** Backend BE-4 sudah split jadi 3 endpoint:
> - `GET /groups/:id/summary` (~5KB) — metadata + counts (cached P3-1 TTL 3 menit)
> - `GET /groups/:id/members?page=&search=` (paginated, cached TTL 60s)
> - `GET /groups/:id` (lama, full detail untuk signing page)
>
> Strategi terbaik sekarang: caller pilih endpoint sesuai kebutuhan. Lihat juga FE-14 + FE-15 untuk migrate hook ke endpoint ringan.

**Lokasi:**
- `useGroupDetailPage.fetchGroup` — page detail grup
- `useGroupData.fetchGroupData` — signing page
- `useGroupDocumentPreviewPage` — preview dokumen grup
- `usePackagePreview` (juga refetch group context)

Sama dengan FE-1, beda flow → 4 independent fetch endpoint sama dengan response monolith (group + members + documents + signerRequests + signatures).

**Skenario:**
```
User browse list grup → fetchGroups
Click ke grup → fetchGroup (1)
Click dokumen di grup → mount signing page → fetchGroupData (2 — fetch group lagi)
Pindah ke preview → mount preview → fetchGroup (3)
```

**Fix:**
- Cache key shared `group:${id}` dengan TTL 60 detik (manageable staleness)
- Atau pakai React Query / SWR untuk de-dup network calls

**Effort:** 1.5 jam (setup SWR atau context shared)
**Impact:** -50% calls ke `/groups/:id` saat user navigate antar halaman dalam 1 grup

---

### 🟡 FE-6 · Signature assets fetch ulang setiap modal mount

**Lokasi:** `signatureAssetService.getAssets` (frontend hook)

Setiap modal `SignatureCanvas` di-mount → fetch list assets dari backend, yang kemudian backend regenerate signed URL (sudah ada `signedUrlCache` Map TTL 24 jam, **tapi cuma di-instance**).

**Skenario user-flow:**
```
Buka SignPackagePage → modal SignatureCanvas mount → fetch assets (1)
Cancel, buka modal lagi → fetch (2)
Pindah ke document signing → fetch (3)
```

Backend cost per call:
- 1× DB query (findByUser)
- N× signed URL HMAC compute (atau cache hit kalau sama instance)

**Fix:**
- Frontend: simpan assets di UserContext atau cache module-level dengan TTL 5 menit
- Backend: pindah `signedUrlCache` ke Redis (sudah ada di redis-caching-strategy Phase 1)

**Effort:** 30 menit (frontend cache) + sudah included di Phase 1 Redis migration
**Impact:** Buka modal kedua kalinya = instant (cache hit)

---

### 🟢 FE-7 · `useGroupsPage` socket subscription re-binds tiap groups list update

**Lokasi:** `useGroupsPage.js:81-105`

Setiap kali `groupIdsKey` berubah (ada grup baru atau user join/leave), socket listener di-rebind. Ini relatif murah tapi:
- `socketService.connect()` dipanggil tiap re-bind → no-op kalau sudah connected, tapi tetap call
- 3 listener dipasang/dilepas — tidak masalah, tapi bisa dipindah ke effect terpisah dengan deps minimal

**Fix:** Optional cosmetic. Pisah `socketService.connect()` ke mount-once effect.

**Effort:** 10 menit
**Impact:** Negligible — list ini sudah rare-update

---

### 🔴 FE-8 · `useDocuments.actions.refresh` = 6 sequential fetch (sama seperti packages)

> **Update post-backend (21 Mei):** Sama dengan FE-2. Backend Redis P2-1 sudah cache `docs:list:{userId}:p:l:f{hash}` TTL 60s di sisi server, jadi 6 cascade calls sebenarnya hit cache 5× setelah cache miss pertama. Tapi tetap 6 round-trip jaringan dari frontend. Optimistic update + endpoint stats baru tetap manfaat besar untuk perceived latency.

**Lokasi:** `useDocuments.js:118-148`

```js
const fetchDocuments = useCallback(async () => { ... }, [page, status, search]);
const fetchTrashCount = useCallback(async () => { ... }, []);
const fetchStatusCounts = useCallback(async () => {
  const [all, draft, pending, completed] = await Promise.all([
    getUserDocuments({ page: 1, limit: 1 }),
    getUserDocuments({ page: 1, limit: 1, status: 'draft' }),
    getUserDocuments({ page: 1, limit: 1, status: 'pending' }),
    getUserDocuments({ page: 1, limit: 1, status: 'completed' }),
  ]);
  // ...
});
```

Pattern **identik dengan FE-2** (`usePackages`). Setiap mount + delete/restore/update:
1. `/documents?page=X` (list)
2. `/documents/trash?limit=1` (trash count)
3. `/documents?status=` (count all)
4. `/documents?status=draft`
5. `/documents?status=pending`
6. `/documents?status=completed`

**Total: 6 round-trip** per refresh. Sama dengan packages, ini sudah di-track di doc backend M-1 sebagai cross-team work (perlu endpoint `/documents/stats`).

**Fix sementara (frontend-only):**
- Setelah delete/update, optimistic update (decrement count lokal)
- Hanya re-fetch saat user explicit click "Refresh"

**Fix permanen:** Sama dengan FE-2, butuh backend endpoint `/documents/stats` yang return `{ all, draft, pending, completed, trash }` dalam 1 query.

**Effort:** 30 menit (frontend optimistic) + 1 jam (backend stats endpoint)
**Impact:** 6 call → 2 call per refresh

---

### 🟡 FE-9 · `useUserQuota` fetch tiap mount, tidak share state antar komponen

> **Update post-backend (21 Mei):** Backend Redis P1-4 sudah cache `user:quota:{userId}` TTL 60 detik. Cost backend per call sekarang minimal (~5ms cache hit), tapi tetap 1 round-trip jaringan per mount. Frontend cache (Context atau SWR) masih bermanfaat untuk skip request entirely + UI lebih responsif.

**Lokasi:** `useUserQuota.js:32-41`

```js
const fetchQuota = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await getUserQuota(); // /users/me/quota
    if (response?.status === 'success') {
      setQuota(response.data);
    }
  } catch (err) { ... }
}, []);

useEffect(() => {
  fetchQuota();
}, [fetchQuota]);
```

**Masalah:**
- Hook ini di-call di **multiple components** (Profile sidebar, Upload modal limit check, Dashboard)
- Setiap mount → fetch lagi
- Tidak ada cache atau context shared
- Quota nyaris tidak berubah setiap detik (cuma berubah saat upload/delete dokumen)

**Skenario:**
- User di Dashboard → mount Profile widget di sidebar = fetch quota (1)
- Buka Upload modal → mount UploadDocModal yang baca quota = fetch (2)
- Buka info paket → mount sidebar widget lagi = fetch (3)

**Fix:**
- Pindah ke UserContext (extend existing context dengan `quota` field)
- Atau pakai SWR `useSWR('/users/me/quota')` — auto dedup antar consumer
- Invalidate saat upload/delete document/package

**Effort:** 30 menit
**Impact:** -60-70% calls ke `/users/me/quota`

---

### 🟡 FE-10 · `useUserProfile.fetchPictureHistory` triggered tiap user object change

**Lokasi:** `useUserProfile.js:54`

```js
useEffect(() => {
  if (user) {
    setFormData({ /* ... copy user fields */ });
    fetchPictureHistory();  // ← fetch /users/me/pictures every time user object changes
  }
}, [user, fetchPictureHistory]);
```

**Masalah:**
- Effect re-run setiap kali `user` reference berubah di context
- `setUser` di-call setelah update profile → user reference berubah → fetchPictureHistory lagi
- User update name 1 char → hit `/users/me/pictures` (yang return semua history foto)

**Fix:**
- Pisah effect: 1 untuk init formData saat user available, 1 untuk fetch history saat mount
- Atau pakai user.id sebagai dep (lebih stable):
```js
useEffect(() => {
  if (!user?.id) return;
  fetchPictureHistory();
}, [user?.id]);
```

**Effort:** 10 menit
**Impact:** -80% calls ke `/users/me/pictures` saat user edit profile

---

### 🟡 FE-11 · `useGroupDetailPage` triple-fetch on mount

**Lokasi:** `useGroupDetailPage.js`

```js
useEffect(() => { fetchGroup(); }, [fetchGroup]);
useEffect(() => { fetchDocuments(...); }, [groupId, docPage, docSearch, docSortBy]);
useEffect(() => { fetchTrashCount(); }, [fetchTrashCount]);
```

**Masalah:**
- 3 useEffect parallel saat mount = 3 fetch ke endpoint berbeda (`/groups/:id`, `/groups/:id/documents`, `/groups/:id/documents/trash?limit=1`)
- Tidak ada coordination — bisa fire bersamaan tapi tidak share fetch state

**Pattern lebih baik:**
- Kombinasi via `Promise.all` di top-level effect:
```js
useEffect(() => {
  Promise.all([
    fetchGroup(),
    fetchDocuments({ page: docPage, search: docSearch, sortBy: docSortBy }),
    fetchTrashCount(),
  ]);
}, [groupId]);
```

**Effort:** 15 menit
**Impact:** Loading state jadi lebih granular + sequential dependency check

---

### 🟢 FE-12 · `useSignatureAssets` fetch tiap mount tanpa share

**Lokasi:** `useSignatureAssets.js:55`

```js
useEffect(() => { fetchAssets(); }, [fetchAssets]);
```

Sama dengan FE-6 — hook ini di-mount di:
- `SignatureCanvas` (modal sign)
- `useDocumentSigner.js` (page sign personal)
- `useSignPackage.js` indirectly via useSignatureAssets

Setiap mount → fetch list assets dari backend (yang lagi-lagi regenerate signed URL).

**Fix:** Cover oleh FE-6 (pindah ke UserContext atau SWR).

**Effort:** Cover by FE-6

---

### ✅ FE-13 · `useDashboard` no cache, full refresh on mount — RESOLVED

> **Update post-backend (21 Mei):** ✅ **RESOLVED tanpa kerja frontend.** Backend BE-2 sudah cache `dashboard:summary:{userId}` TTL 60 detik. User yang sering pindah dashboard ↔ documents ↔ groups: kembali ke dashboard dalam 60 detik = cache hit (~5ms response), > 60 detik = 9 query DB tapi sekali saja lalu cached lagi. Frontend tidak perlu intervensi tambahan.

**Lokasi:** `useDashboard.js`

```js
useEffect(() => {
  fetchDashboard();
}, [fetchDashboard]);
```

**Masalah:**
- Tiap mount Dashboard → fetch `/dashboard` (yang kemudian trigger 9 query backend — ref BE-2)
- Tidak ada cache TTL — user yang sering pindah dashboard ↔ documents ↔ groups akan trigger 9-query setiap kembali ke dashboard

**Fix:**
- Cover oleh BE-2 (cache backend 60 detik)
- Frontend tidak perlu intervensi tambahan kalau backend cache sudah implement
- Alternatif: SWR dengan `dedupingInterval: 30000` di frontend

**Effort:** 0 (cover by BE-2)
**Impact:** Pair dengan BE-2 backend cache

---

### ✨ FE-14 · Migrate `useGroupData` ke `/groups/:id/summary` untuk view ringan (BARU post-backend)

**Lokasi:** `groups/hooks/useGroupData.js`

**Background:** Backend BE-4 sudah split `GET /groups/:id` (monolith ~50-200KB) jadi 3 endpoint:
- `GET /groups/:id/summary` (~5KB) — metadata + admin + counts
- `GET /groups/:id/members?page=&limit=&search=` — paginated members
- `GET /groups/:id` lama — tetap full detail untuk signing page

`useGroupData` saat ini panggil endpoint lama. Untuk view yang hanya butuh nama grup + member/doc count (header, breadcrumb, sidebar), migrate ke `/summary` akan turunkan response 40× lebih kecil dan latency lebih cepat.

**Fix:**

1. Tambah method `getGroupSummary(groupId)` di `groups/api/groupService.js`
2. Update `useGroupData` untuk default panggil `/summary` (kecuali caller pass option `{ full: true }` untuk signing page)
3. Audit caller `useGroupData`:
   - Header / breadcrumb → pakai `/summary`
   - GroupDetailPage initial → pakai `/summary` + lazy fetch documents
   - Signing page → tetap `/groups/:id` (butuh signerRequests + signatureGroup)

**Effort:** 30 menit
**Impact:** Response size 50-200KB → 5KB di hot path. Page header & sidebar load instant.

---

### ✨ FE-15 · Paginated members via `/groups/:id/members?page=` (BARU post-backend)

**Lokasi:**
- `groups/components/GroupMembersTab.jsx` (atau equivalent member list view)
- `groups/components/GroupSettingsModal.jsx` (kick member)
- `groups/components/InvitationModal.jsx` (kalau perlu list current member)

**Background:** Sebelum BE-4, frontend ambil members via `getGroupDetail` yang return ALL members + 100 documents + signerRequests + signatures dalam 1 monolith response. Sekarang ada `GET /groups/:id/members?page=&limit=&search=` yang paginated + filter, response size linier dengan `limit` (default 20).

**Fix:**

1. Tambah method `getGroupMembers(groupId, { page, limit, search })` di `groups/api/groupService.js`
2. Pisah hook `useGroupMembers(groupId)` baru atau extend `useGroupData` dengan opsi paginated
3. Components member list pakai pagination control + search box untuk filter member
4. Saat user navigate ke member tab, loading hanya 20 member pertama (instead of fetch full group payload)

**Effort:** 1 jam
**Impact:** Member list load instant (response ~5KB vs 50-200KB). Search member tidak perlu re-fetch full group. Cache hit di backend P3-1 TTL 60 detik.

---

### ✨ FE-16 · Verifikasi `useGroupsPage` benefit dari P3-1 (BARU post-backend)

**Lokasi:** `groups/hooks/useGroupsPage.js`

**Background:** Backend P3-1 sudah cache `groups:user:{userId}:list` TTL 60 detik. Frontend `useGroupsPage` panggil `getAllUserGroups` di mount + saat socket event `group_member_update`. Setelah P3-1, mount kedua dalam 60 detik = cache hit di server.

**Tindakan:** Cuma verifikasi via Network tab Chrome DevTools bahwa `/api/groups` cache header / latency turun setelah deploy. Tidak ada perubahan kode di frontend.

**Effort:** 10 menit (verifikasi only)
**Impact:** Sudah otomatis aktif via backend P3-1. Pair dengan FE-7 socket re-bind cleanup untuk full optimization.

---



1. **Multi-hook independent fetch** endpoint yang sama tanpa cache layer (React Query/SWR)
   - `getPackageDetails` di 3 hook (FE-1)
   - `getGroupDetail` di 4 hook (FE-5)
   - `useDocumentTypes` di 3 lokasi (FE-3)
   - `useUserQuota` di multiple components (FE-9)
   - `useSignatureAssets` di multiple modal (FE-6, FE-12)

2. **Sequential await yang seharusnya `Promise.all`**
   - `getDocumentDetail` + `getDocumentFile` (6 lokasi) (FE-4)
   - `useGroupDetailPage` 3 useEffect parallel (FE-11)

3. **Cascade calls dalam satu user action**
   - `usePackages.refresh` = 5 round-trip (FE-2)
   - `useDocuments.refresh` = 6 round-trip (FE-8)
   - Sudah documented sebagai backend M-1 (perlu endpoint stats baru)

4. **No client-side deduplication** untuk in-flight request
   - User klik tombol cepat 2× → 2 request identik fired
   - Tidak ada `_inFlightMap` di apiFetch

5. **Component-level fetch** padahal data nyaris static
   - `useDocumentTypes` whitelist 5 kategori (FE-3)
   - `useUserQuota` jarang berubah per detik (FE-9)

6. **Effect re-fire saat reference object berubah**
   - `useUserProfile` fetch picture history saat `user` reference berubah (FE-10)
   - Pakai `user.id` lebih stable

7. **Refresh pattern yang re-fetch semua walaupun cuma 1 perubahan**
   - Refresh pattern di documents/packages list (FE-2, FE-8)
   - Bisa optimistic update lokal tanpa fetch ulang

---

## Priority Matrix (legacy — lihat tabel di TL;DR atas untuk versi terkini)

> **Catatan:** Tabel di bawah adalah analisis awal 20 Mei. Tabel terkini (post-backend update 21 Mei) ada di bagian **"Tabel Task Pengerjaan Per Level"** di awal doc.

### 🔴 Kritis (Eksekusi Sekarang — total ~3-4 jam)

| ID | Fix | Effort | Impact |
|---|---|---|---|
| FE-1 | Dedup `getPackageDetails` antar hook (SWR atau Context) | 1.5-2 jam | -70% calls ke /packages/:id |
| FE-2 | Optimistic update di `usePackages.refresh` | 30 menit | 5 call → 2 call per refresh |
| FE-8 | Optimistic update di `useDocuments.refresh` | 30 menit | 6 call → 2 call per refresh (sama pattern dengan FE-2) |

### 🟡 Tinggi Manfaat, Bisa Tunda (Total ~5 jam)

| ID | Fix | Effort | Impact |
|---|---|---|---|
| FE-3 | Module-level cache `useDocumentTypes` | 15 menit | 4× → 1× per session |
| FE-4 | Parallelize `getDocumentDetail` + `getDocumentFile` | 30 menit | -50% perceived latency |
| FE-5 | SWR cache untuk `getGroupDetail` | 1.5 jam | -50% calls antar navigation |
| FE-6 | Frontend cache signature assets | 30 menit | Modal kedua = instant |
| FE-9 | Cache `useUserQuota` di context atau SWR | 30 menit | -60-70% calls ke /quota |
| FE-10 | Pisah effect init+fetch di useUserProfile pakai user.id dep | 10 menit | -80% calls /pictures saat edit |
| FE-11 | Kombinasi 3 fetch initial useGroupDetailPage di Promise.all | 15 menit | Loading state granular |

### 🟢 Optional / Cosmetic (Total ~10 menit)

| ID | Fix | Effort | Impact |
|---|---|---|---|
| FE-7 | Pisah `socketService.connect()` ke mount-once | 10 menit | Negligible |
| FE-12 | Cover oleh FE-6 | — | — |
| FE-13 | Cover oleh BE-2 backend cache | — | — |

---

## Rekomendasi Final

**Sebelum eksekusi semua quick wins di atas, pertimbangkan setup React Query / SWR di frontend** (~2 jam initial setup). Library ini akan otomatis solve FE-1, FE-3, FE-5, FE-6 sekaligus dengan pattern declarative:

```js
// Setelah setup SWR
const { data: pkg } = useSWR(`/packages/${id}`, fetcher, {
  dedupingInterval: 30000  // 30s dedup
});
// Antar hook yang pakai key sama otomatis dedup
```

**Alternatif tanpa library:** Bikin `apiCache` di-level network layer (`services/api.js`) dengan in-memory map + TTL. Effort lebih ringan tapi kurang ergonomic.

**Dampak total kalau semua dieksekusi (Frontend + Backend):**
- Network calls: -60% di steady state user-flow
- Response size endpoint berat: -90%
- DB load: -70%
- Page load p95 perceived: -40-50%

---

## Catatan untuk Eksekusi

**Sebelum mulai:**
- Decide: SWR vs React Query vs custom cache layer
- SWR lebih ringan (~5KB), React Query lebih powerful (mutation + invalidation built-in)
- Untuk codebase saat ini, **SWR** sudah cukup karena pattern fetch-only relatif sederhana

**Setelah implementasi:**
- Tambah devtools (SWR/React Query) untuk monitor cache hit ratio
- Verify dengan Chrome DevTools Network tab: setiap navigate, request tidak duplicate

---

[→ Backend operasi mahal: ../../Backend-DigiSign/docs/backend-expensive-operations.md](../../Backend-DigiSign/docs/backend-expensive-operations.md)

[← Lihat juga: code-review-feat-packages/03-medium.md (M-1 cascade backend)](./code-review-feat-packages/03-medium.md)
