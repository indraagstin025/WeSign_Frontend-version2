# Bug: Signature Lompat ke Posisi Awal Saat saveDraft Response

**Status**: belum di-fix. Dokumen ini menjelaskan gejala, root cause, dan
file yang terlibat untuk dipertimbangkan saat optimasi berikutnya.

**Konteks**: muncul di group signing page setelah refactor ke pattern
`useGroupDraggableRef` (positionRef + uncontrolled `react-draggable`)
yang dilakukan di commit `ea823a3` untuk smoothness drag.

---

## Daftar Isi

1. [Gejala yang Dirasakan User](#gejala-yang-dirasakan-user)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Timeline Race Condition](#timeline-race-condition)
4. [Kenapa Fix Sebelumnya Belum Cukup](#kenapa-fix-sebelumnya-belum-cukup)
5. [File yang Terlibat](#file-yang-terlibat)
6. [Opsi Solusi](#opsi-solusi)
7. [Cara Reproduce](#cara-reproduce)

---

## Gejala yang Dirasakan User

1. User drop signature di posisi **A** (mis. tengah halaman PDF).
2. Sebelum response `saveDraft` sampai, user langsung drag signature ke
   posisi **B**.
3. Response `saveDraft` dari backend sampai (~150–300 ms).
4. **Visual: signature lompat balik dari B ke A.** User harus drag ulang.

Yang membingungkan: di pengamatan user lain (peer via socket), signature
sudah ada di posisi B (karena `emitAddSignature` final pakai
`localSnapshot`). Hanya tab sender sendiri yang lompat balik.

---

## Root Cause Analysis

Ada dua pattern yang berinteraksi dan saling tabrakan:

### Pattern A — positionRef (dipakai saat drag)

`useGroupDraggableRef.js` menyimpan posisi current di `useRef`, **bukan**
`useState`. Saat user drag, hanya `positionRef.current` yang update plus
manipulasi DOM langsung via `style.transform`. **Parent state
`signatures[i].positionX/Y` TIDAK ke-update saat drag move** — ini disengaja
untuk smoothness (bypass React reconciliation).

Parent state baru ke-update saat `onDragStop` fire (drag selesai).

### Pattern B — saveDraft response merge

`useGroupSignatureActions.js` `handleAddSignature` melakukan:

1. Optimistic add: `setSignatures([...prev, newSig])` dengan `id: tempId`.
2. Fire `saveDraft` (async).
3. Saat response sampai, merge: `setSignatures(prev => prev.map(s => s.id === tempId ? {...s, id: serverSig.id, positionX: s.positionX, ...} : s))`.

Bagian `positionX: s.positionX` itu **preserve dari state parent**. Tapi
selama drag, state parent tidak berubah — masih posisi A (drop awal).

### Trigger remount via key

Di `GroupSigningPage.jsx`:

```jsx
<DraggableSignatureGroup key={sig.id} sig={sig} ... />
```

Saat `sig.id` berubah dari `tempId` → `serverSig.id` di step (3) di atas,
**React unmount komponen lama dan mount komponen baru** dengan props baru.

Komponen baru `useGroupDraggableRef` re-init `positionRef` dari
`sig.positionX * containerWidth - VISUAL_PADDING` = **posisi A** (state
parent). DOM transform di-set ke A. Visual: signature lompat dari B ke A.

Sementara itu drag yang sedang berjalan di komponen lama (yang sudah
unmount) dropped — `onDragStop` callback yang seharusnya push posisi B
ke parent state tidak fire (atau fire ke handler closure lama yang
mencari `id === tempId` yang sudah tidak ada).

---

## Timeline Race Condition

```
T0  User drop signature di A
    ├─ optimistic add: signatures = [{id: tempId, positionX: A.x}]
    └─ component mount dengan key=tempId, positionRef = A

T0+1ms  saveDraft request fire (network)

T1  User drag dari A ke B
    ├─ react-draggable internal state pindah, DOM transform = B
    ├─ positionRef.current = B
    └─ parent state TIDAK ke-update (signatures[0].positionX MASIH = A.x)

T2  saveDraft response sampai (~200ms after T0+1ms)
    ├─ setSignatures merge serverSig
    │   - s.id: tempId → serverSig.id
    │   - s.positionX: PRESERVED dari state = A.x  ← BUG
    ├─ React diff: key tempId → serverSig.id = REMOUNT
    │   - Komponen lama UNMOUNT (drag in progress dropped)
    │   - Komponen baru MOUNT dengan positionX=A.x
    │   - positionRef baru = A
    │   - DOM transform = A
    └─ ❌ VISUAL: signature lompat dari B ke A

T3  User confused, drag ulang dari A ke posisi target.
```

---

## Kenapa Fix Sebelumnya Belum Cukup

Komentar di `useGroupSignatureActions.js` mention fix `localSnapshot`:

```js
// PENTING: preserve s.width/s.height/s.positionX/s.positionY dari state
// lokal — kalau user drag/resize sebelum saveDraft response sampai, ...
positionX: s.positionX,
```

**Fix ini bekerja untuk pattern OLD (state-based drag)** di mana drag
memang update parent state setiap move. State `s.positionX` = posisi B
saat drag.

**Setelah refactor ke positionRef pattern**, drag tidak update parent
state. `s.positionX` saat saveDraft response sampai = **posisi DROP AWAL
(A)**, bukan posisi terkini (B). Preserve dari `s.positionX` = preserve A,
bukan B.

Dengan kata lain, fix lama **mengasumsikan parent state selalu sync
dengan posisi visual**. Asumsi itu break setelah refactor ke positionRef.

---

## File yang Terlibat

### Frontend

| File | Peran | Lokasi Bug |
|------|-------|------------|
| `src/features/groups/pages/GroupSigningPage.jsx` | Render `<DraggableSignatureGroup key={sig.id}>` | `key={sig.id}` trigger remount saat id berubah |
| `src/features/groups/hooks/useGroupSignatureActions.js` | `handleAddSignature`: optimistic add → saveDraft → merge response | Merge spread `serverSig` + preserve `s.positionX` (state parent yang stale) |
| `src/features/groups/hooks/useGroupDraggableRef.js` | Hook positionRef untuk smooth drag | `onDrag` tidak update parent state — by design |
| `src/features/groups/hooks/useDraggableSignatureGroup.js` | Compose ownership + socket emit + useGroupDraggableRef | Pass `onUpdatePosition` callback yang baru fire di `onDragStop` |
| `src/features/groups/components/DraggableSignatureGroup.jsx` | Render `<Draggable defaultPosition={...}>` (uncontrolled) | `defaultPosition` baca dari `positionRef.current` saat mount — re-init saat key change |
| `src/services/signatures.js` (atau equivalent) | API call `saveDraft(documentId, payload)` | Tidak punya bug, tapi response time-nya yang trigger race |

### Backend (untuk konteks)

| File | Peran |
|------|-------|
| `Backend-DigiSign/src/controllers/groupSignatureController.js` | Handler endpoint `POST /api/group-signatures/:documentId/draft` |
| `Backend-DigiSign/src/services/groupSignatureService.js` | `saveDraft` generate server-side UUID, ignore client-sent `id` (post-FIX #11) |

Backend tidak perlu diubah untuk fix bug ini — root cause sepenuhnya di
frontend race condition antara positionRef + parent state + key remount.

---

## Opsi Solusi

Ranking dari paling minimal-impact ke paling robust:

### Opsi 1 — Stabilkan key (RECOMMENDED, paling simple)

Jangan ubah `sig.id` saat saveDraft response. Simpan server ID di
field terpisah `_serverId`:

```js
// useGroupSignatureActions.js
setSignatures((prev) =>
  prev.map((s) => {
    if (s.id !== tempId) return s;
    return {
      ...s,
      ...serverSig,
      id: tempId,           // PERTAHANKAN tempId — key tidak berubah
      _serverId: serverSig.id,  // ID backend di field terpisah
      _pending: false,
      // ...preserve positionX/Y/width/height dari s.* (sama seperti sekarang)
    };
  })
);
```

Lalu di semua mutation backend (PATCH/DELETE), pakai `s._serverId || s.id`:

```js
// useGroupSignatureActions.js — handleUpdateSignature
const persistId = sig._serverId || sig.id;
await updateDraftPosition(persistId, { ... });
```

**Pro**: 
- Komponen tidak unmount/remount → drag in progress tidak hilang
- Minim perubahan kode

**Kontra**: 
- `id` di-state lokal beda dengan `id` di backend → semua tempat yang
  pakai `sig.id` untuk backend call harus diganti ke `_serverId`
- Kalau lupa di satu tempat, akan 404

### Opsi 2 — Flush positionRef ke parent state sebelum merge

Saat saveDraft response sampai, panggil imperative method di child untuk
push positionRef ke parent state SEBELUM merge:

```js
// DraggableSignatureGroup.jsx — pakai forwardRef + useImperativeHandle
useImperativeHandle(ref, () => ({
  flushPositionToState: () => {
    const { x, y } = positionRef.current;
    onUpdatePosition(sig.id, ...);
  }
}));

// useGroupSignatureActions.js
const childRef = signatureRefs.current[tempId];
if (childRef) childRef.flushPositionToState();  // Sync ref → state
// Lalu lanjut setSignatures merge
```

**Pro**: Parent state selalu sync sebelum merge, fix lama tetap valid.

**Kontra**: 
- Tambah forwardRef + ref management di parent
- Imperative API ke child = anti-pattern React mild
- Edge case: drag masih in progress saat flush, positionRef bisa
  ter-update lagi setelah flush

### Opsi 3 — Skip merge kalau child sedang dragging

Track `isDragging` per signature di parent state, skip merge response
kalau true. Resume merge di `onDragStop`:

```js
// useGroupSignatureActions.js
if (signatures.find(s => s.id === tempId)?._isDragging) {
  // Tunda merge sampai onDragStop fire
  pendingMerges.current[tempId] = serverSig;
  return;
}
```

**Pro**: Tidak ada race possible.

**Kontra**: 
- Banyak state baru: `_isDragging`, `pendingMerges`, retry orchestration
- Kalau user lupa drop (mis. tab kena unfocus), pendingMerge bocor

### Opsi 4 — Pakai controlled position dengan state buffer

Revert ke pattern OLD (controlled `position` prop), tapi buffer state
update via `useState` di hook level dengan rAF batching. Drag tetap smooth
karena React batch + memo.

**Pro**: Fix lama (`localSnapshot`) langsung work.

**Kontra**: Smooth-nya tidak sebagus positionRef pattern. User sudah test
ini di commit `f6b0b9c` dan masih lag.

---

## Cara Reproduce

1. Login di 2 tab/browser dengan akun berbeda yang sama-sama join group
   yang sama dan punya akses ke document yang sama.
2. Tab 1: drop signature di tengah halaman PDF.
3. **Langsung** (dalam window <300 ms) drag signature ke pojok kanan bawah.
4. Tab 1: signature lompat balik ke tengah ~200 ms setelah drag mulai.
5. Tab 2 (peer): signature ada di pojok kanan bawah (benar).

Cara verifikasi pakai DevTools:

```js
// Buka console di tab 1, paste:
const _orig = console.log;
window.__dragLog = [];
window.addEventListener('mousemove', () => window.__dragLog.push({
  t: Date.now(),
  el: document.querySelector('.react-draggable')?.getBoundingClientRect()
}));
// Drop + drag, lalu cek window.__dragLog untuk lihat snap-back.
```

---

## Rekomendasi Implementasi

Mulai dari **Opsi 1** (stabil key) — paling minimal-impact dan tidak
introduce abstraction baru. Audit semua tempat yang pakai `sig.id` untuk
backend call:

```bash
# Cari semua usage yang perlu diubah ke _serverId
grep -rn "sig\.id" src/features/groups/ | grep -v key=
grep -rn "signatureId" src/features/groups/
```

Kalau Opsi 1 ternyata punya corner case (mis. server-side push event
yang bawa server ID, frontend tidak bisa cocokkan dengan tempId), pertimbangkan
**Opsi 2** sebagai fallback.

Tidak disarankan **Opsi 4** karena user sudah konfirmasi pattern controlled
position lag/30 fps.
