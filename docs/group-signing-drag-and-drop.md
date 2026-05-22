# Group Signing — Drag & Drop Architecture

**Cakupan**: dokumentasi lengkap file dan alur kerja drag-and-drop tanda
tangan di Group Signing Page. Termasuk realtime sync antar user via socket,
optimistic update, dan persistensi ke backend.

**Audience**: developer yang bekerja di fitur group signing atau realtime
collaboration di project ini.

---

## Daftar Isi

1. [Arsitektur Tinggi](#arsitektur-tinggi)
2. [Daftar File Frontend](#daftar-file-frontend)
3. [Daftar File Backend](#daftar-file-backend)
4. [Konvensi Koordinat](#konvensi-koordinat)
5. [Alur 1: Drop Signature Pertama Kali](#alur-1-drop-signature-pertama-kali)
6. [Alur 2: Drag Signature (Move)](#alur-2-drag-signature-move)
7. [Alur 3: Resize Signature](#alur-3-resize-signature)
8. [Alur 4: Delete Signature](#alur-4-delete-signature)
9. [Alur 5: Realtime View untuk User Lain](#alur-5-realtime-view-untuk-user-lain)
10. [Pattern Optimistic + Reconciliation](#pattern-optimistic--reconciliation)
11. [Pattern positionRef vs useState](#pattern-positionref-vs-usestate)
12. [Throttle dan Debounce Strategy](#throttle-dan-debounce-strategy)
13. [Edge Cases dan Race Conditions](#edge-cases-dan-race-conditions)
14. [Tips Debug](#tips-debug)

---

## Arsitektur Tinggi

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER A (Browser)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ GroupSigningPage.jsx                                    │    │
│  │   ├─ DraggableSignatureGroup (per signature)            │    │
│  │   │    ├─ useDraggableSignatureGroup (orchestrator)     │    │
│  │   │    │    └─ useGroupDraggableRef (drag/resize logic) │    │
│  │   │    └─ react-draggable (uncontrolled)                │    │
│  │   └─ useGroupSigningPage (state aggregator)             │    │
│  │        ├─ useGroupSignatureActions (CRUD handlers)      │    │
│  │        ├─ useGroupSocket (socket listener)              │    │
│  │        └─ useGroupSigning (orchestrator)                │    │
│  └────────────────────┬────────────────────┬───────────────┘    │
│                       │ HTTP               │ WebSocket          │
└───────────────────────┼────────────────────┼────────────────────┘
                        │                    │
                        ▼                    ▼
                ┌──────────────┐    ┌──────────────────┐
                │  REST API    │    │  Socket.IO       │
                │              │    │                  │
                │  POST/PATCH/ │    │  drag_signature  │
                │  DELETE      │    │  add_signature   │
                │              │    │  remove_signature│
                └──────┬───────┘    └────────┬─────────┘
                       │                     │
┌──────────────────────┼─────────────────────┼────────────────────┐
│                      ▼                     ▼                    │
│            ┌──────────────────────────────────────┐             │
│            │  Express Routes + Socket Handler     │             │
│            │  ├─ groupSignatureRoutes.js          │             │
│            │  └─ socketHandler.js                 │             │
│            └────────────────┬─────────────────────┘             │
│                             │                                   │
│            ┌────────────────▼─────────────────┐                 │
│            │  Controller + Service            │                 │
│            │  ├─ groupSignatureController.js  │                 │
│            │  └─ groupSignatureService.js     │                 │
│            └────────────────┬─────────────────┘                 │
│                             │                                   │
│            ┌────────────────▼─────────────────┐                 │
│            │  Repository (Prisma)             │                 │
│            │  └─ PrismaGroupSignatureRepo     │                 │
│            └────────────────┬─────────────────┘                 │
│                             │                                   │
│                       ┌─────▼─────┐                             │
│                       │ Postgres  │                             │
│                       └───────────┘                             │
│                                          BACKEND                │
└─────────────────────────────────────────────────────────────────┘
                        │ WebSocket broadcast
                        ▼
                ┌─────────────────┐
                │  USER B/C/...   │  (peer di group room)
                │                 │
                │  setPositionFrom│
                │  Remote (DOM)   │
                └─────────────────┘
```

---

## Daftar File Frontend

### Layer Komponen UI

| File | Tanggung Jawab |
|---|---|
| `src/features/groups/pages/GroupSigningPage.jsx` | Page utama; render PDF, sidebar, action bar; iterate signatures dan render DraggableSignatureGroup |
| `src/features/groups/components/DraggableSignatureGroup.jsx` | Pure presentational; render react-draggable wrapper, resize handles, delete button, image. Pakai `React.memo` untuk skip re-render kalau props sig tidak berubah |

### Layer Hook (logic)

| File | Tanggung Jawab |
|---|---|
| `src/features/groups/hooks/useDraggableSignatureGroup.js` | Orchestrator drag per-signature; ownership check, throttle emit drag, listener `update_signature_position`, wrap callbacks dengan guard |
| `src/features/groups/hooks/useGroupDraggableRef.js` | **Lower-level drag math**; pegang `positionRef` (mutable ref), direct DOM manipulasi, resize logic dengan aspect ratio lock, click outside |
| `src/features/groups/hooks/useGroupSignatureActions.js` | CRUD handler: `handleAddSignature` (drop), `handleUpdateSignature` (drag end), `handleUpdateSize` (resize end), `handleDeleteSignature`, `handleSaveMySignature` (final) |
| `src/features/groups/hooks/useGroupSigningPage.js` | Aggregator: gabung useGroupData + useGroupSocket + useGroupSignatureActions + useGroupSigning. Expose state ke page |
| `src/features/groups/hooks/useGroupSocket.js` | Socket listener: `add_signature_live`, `update_signature_position`, `remove_signature_live`, `signature_saved`, `group_document_update` |
| `src/features/groups/hooks/useGroupSigning.js` | Thin orchestrator yang menggabungkan 3 hook spesifik di atas |
| `src/features/groups/hooks/useGroupData.js` | Fetch initial signatures + group data |

### Layer Service & Network

| File | Tanggung Jawab |
|---|---|
| `src/features/groups/api/groupSignatureService.js` | HTTP API client: `saveDraft`, `updateDraftPosition`, `deleteDraft`, `signDocument` |
| `src/services/socketService.js` | Socket.IO singleton client; emit/on/off, room management, auto-reconnect |
| `src/services/withRetryCoalesce.js` | Wrapper untuk PATCH position: retry exponential + coalesce per signatureId + outbox |
| `src/services/api.js` | Wrapper fetch dengan timeout, CSRF, refresh token interceptor |

### Layer Constant

| File | Tanggung Jawab |
|---|---|
| `src/features/groups/constants/groupSignatureLayout.js` | `SIGNATURE_VISUAL_PADDING = 18`, `SIGNATURE_SOCKET_THROTTLE_MS = 30` |
| `src/features/signature/constants/signatureLayout.js` | `VISUAL_PADDING`, `TOTAL_PADDING`, `MIN_INNER_WIDTH` |

---

## Daftar File Backend

### Layer Routing & Controller

| File | Tanggung Jawab |
|---|---|
| `src/routes/groupSignatureRoutes.js` | HTTP endpoints di `/api/group-signatures/*` |
| `src/controllers/groupSignatureController.js` | Validate request body, coerce types, panggil service, return JSON |

### Layer Business Logic

| File | Tanggung Jawab |
|---|---|
| `src/services/groupSignatureService.js` | Logic utama: validate signer eligible, save draft, update position dengan auth check, delete, emit socket broadcast |

### Layer Repository (Prisma)

| File | Tanggung Jawab |
|---|---|
| `src/repository/prisma/PrismaGroupSignatureRepository.js` | CRUD signature_group table; `findOwnershipById` (light), `findBySignerAndVersion`, `updateConditional` (atomic dengan WHERE guard) |
| `src/repository/prisma/PrismaGroupDocumentSignerRepository.js` | `findPendingByUserAndDoc` (verify user is pending signer), `updateSignatureId` (link signer request ke signature row) |
| `src/repository/prisma/PrismaDocumentRepository.js` | `findByIdSimple` (light variant untuk get document + currentVersionId) |

### Layer Realtime

| File | Tanggung Jawab |
|---|---|
| `src/socket/socketHandler.js` | Socket.IO server setup; auth via JWT di handshake; event handlers untuk `drag_signature` (forward `update_signature_position`), `add_signature_live`, `remove_signature_live`, `signature_saved`; track active users per room |

### Layer Auth & Validation

| File | Tanggung Jawab |
|---|---|
| `src/middleware/authMiddleware.js` | Verify JWT untuk REST endpoints (drag persist, save draft, delete) |
| `src/domain/SignatureValidator.js` | Validate signatureImageUrl format (data URI vs https) |

### Layer Schema

| File | Tanggung Jawab |
|---|---|
| `prisma/schema.prisma` | Model `SignatureGroup` dengan field id/signerId/documentVersionId/status/positionX/Y/width/height/pageNumber/signatureImageUrl/method/category/metadata/signedAt/accessCode/timestamps |

---

## Konvensi Koordinat

Sumber kebingungan paling sering. Ada **3 sistem koordinat** yang harus
di-konversi:

```
┌──────────── PDF Page Container (ContentRect) ────────────┐
│                                                          │
│   ┌── OUTER (display) ──────────────────────────┐        │
│   │  border 1px                                 │        │
│   │  ┌── padding 16px (CSS p-4) ───────────┐   │        │
│   │  │  border 1px                         │   │        │
│   │  │  ┌── INNER (image) ───────────┐    │   │        │
│   │  │  │                             │    │   │        │
│   │  │  │     [Signature Image]       │    │   │        │
│   │  │  │                             │    │   │        │
│   │  │  └─────────────────────────────┘    │   │        │
│   │  └────────────────────────────────────┘   │        │
│   └─────────────────────────────────────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘

VISUAL_PADDING = 18px (border 1px + p-4 16px + border 1px)
TOTAL_PADDING = 36px (2 sisi)
```

### Sistem Koordinat

| Sistem | Format | Range | Disimpan di |
|---|---|---|---|
| **Inner Fraction** | `0-1` | Relatif ke ContentRect | DB (`positionX`, `positionY`, `width`, `height`) + socket payload |
| **Outer Pixel** | `pixel` | Relatif ke ContentRect | `positionRef.current.x/y/w/h` di hook + DOM `style.transform` |
| **Inner Pixel** | `pixel` | Relatif ke ContentRect, image only | Internal calculation saja |

### Konversi

**Inner Fraction → Outer Pixel** (saat baca dari sig prop atau socket):
```js
const outerX = sig.positionX * containerWidth - VISUAL_PADDING;
const outerY = sig.positionY * containerHeight - VISUAL_PADDING;
const outerW = sig.width * containerWidth + TOTAL_PADDING;
const outerH = sig.height * containerHeight + TOTAL_PADDING;
```

**Outer Pixel → Inner Fraction** (saat persist ke DB / emit socket):
```js
const innerX = (outerX + VISUAL_PADDING) / containerWidth;
const innerY = (outerY + VISUAL_PADDING) / containerHeight;
const innerW = Math.max(0, outerW - TOTAL_PADDING) / containerWidth;
const innerH = Math.max(0, outerH - TOTAL_PADDING) / containerHeight;
```

**Pentingnya konversi**: backend store fraction supaya signature scale otomatis
saat user buka di device dengan PDF size berbeda. Frontend convert ke pixel
untuk DOM rendering (yang butuh absolute pixel value).

---

## Alur 1: Drop Signature Pertama Kali

User klik canvas tab di PDF untuk drop signature di posisi tersebut.

### Sequence Diagram

```
User A           Frontend                    Backend                User B
  │                │                            │                    │
  │  klik canvas   │                            │                    │
  ├───────────────▶│                            │                    │
  │                │                            │                    │
  │                │ handleAddSignature(dropData)│                    │
  │                │   ├─ tempId = uuid()        │                    │
  │                │   ├─ setSignatures([+sig])  │                    │
  │                │   │     (optimistic)         │                    │
  │                │   ├─ emit add_signature_live│                    │
  │                │   │     (optimistic)         │                    │
  │                │   │                          │ broadcast          │
  │                │   │                          ├──────────────────▶│
  │                │   │                          │                    │ setSignatures([+sig])
  │                │   │                          │                    │ (state user B)
  │                │   ├─ saveDraft POST          │                    │
  │                │   │     /draft/:docId        │                    │
  │                │   │                          ▼                    │
  │                │   │                  groupSignatureService        │
  │                │   │                    .saveDraft                 │
  │                │   │                    ├─ Promise.all:            │
  │                │   │                    │   findDocument           │
  │                │   │                    │   findSignerEligible     │
  │                │   │                    ├─ findExistingDraft       │
  │                │   │                    ├─ create signature row    │
  │                │   │                    └─ updateSignerSignatureId │
  │                │   │                          │                    │
  │                │   │                          │ response (serverId)│
  │                │   │◀─────────────────────────┤                    │
  │                │   ├─ setSignatures (replace  │                    │
  │                │   │   tempId → serverId,     │                    │
  │                │   │   preserve local pos/size)│                   │
  │                │   ├─ re-emit add_signature_live│                  │
  │                │   │   {oldId: tempId,        │                    │
  │                │   │    id: serverId, pos, size}│                  │
  │                │   │                          │ broadcast          │
  │                │   │                          ├──────────────────▶│
  │                │   │                          │                    │ replace state
  │                │   │                          │                    │ (find oldId, update)
  │                │   ├─ kalau localState beda   │                    │
  │                │   │   dropData (drag/resize  │                    │
  │                │   │   sebelum response):     │                    │
  │                │   │   PATCH /position dengan │                    │
  │                │   │   posisi terkini         │                    │
  │                ▼   ▼                          │                    │
  │              done                              │                    │
```

### File yang Terlibat

**Frontend (sender):**
1. `pages/GroupSigningPage.jsx` — handle click event di PDF canvas
2. `hooks/useGroupSigningPage.js` → `actions.handleCanvasClick(e)` → fire `handleAddSignature(dropData)`
3. `hooks/useGroupSignatureActions.js` → `handleAddSignature`:
   - Generate tempId UUID v4
   - Optimistic update state lokal dengan flag `_pending: true`
   - Emit socket optimistic dengan tempId (visible ke user lain instant)
   - Call `saveDraft(documentId, payload)` async
   - Saat response sampai: replace tempId dengan serverSig.id, preserve posisi lokal terkini, re-emit dengan `oldId: tempId`
   - Kalau state lokal berbeda dari dropData (user drag/resize sebelum response), PATCH `/position` untuk sync ke backend
4. `api/groupSignatureService.js` → `saveDraft` — POST ke endpoint
5. `services/api.js` → `apiFetch` — handle CSRF, retry, refresh token
6. `services/socketService.js` → `emitAddSignature(documentId, signature)` — emit ke socket

**Backend:**
1. `routes/groupSignatureRoutes.js` — `POST /draft/:documentId` route
2. `middleware/authMiddleware.js` — verify JWT
3. `controllers/groupSignatureController.js` → `saveDraft`
4. `services/groupSignatureService.js` → `saveDraft`:
   - Validate signature image URL
   - **Promise.all parallel**: findDocument + findPendingSigner
   - Sequential: findExistingDraft + create/update signature
   - updateSignerSignatureId (link signer request ke signature)
   - Emit `group_document_update` ke group room
5. `repository/prisma/PrismaGroupSignatureRepository.js` → create/update
6. `repository/prisma/PrismaGroupDocumentSignerRepository.js` → updateSignatureId
7. `socket/socketHandler.js` — terima `add_signature_live` dari sender, broadcast ke peer

### State Transitions

```
Local state (sender):
┌─────────────────────────────────────────────────────────────────┐
│ T0  drop                                                         │
│     [{id: tempId-X, _pending: true, posX: 0.1, posY: 0.1}]      │
│                                                                  │
│ T1  drag (sebelum saveDraft response)                            │
│     [{id: tempId-X, _pending: true, posX: 0.5, posY: 0.5}]      │
│     emit drag dengan signatureId: tempId-X                       │
│                                                                  │
│ T2  saveDraft response (server return id=Y, posX=0.1)            │
│     setSignatures replace dengan PRESERVE local pos:             │
│     [{id: Y, _pending: false, posX: 0.5, posY: 0.5}]            │
│     ── Note: bukan ...serverSig (yang punya posX=0.1) ──        │
│                                                                  │
│ T3  re-emit add_signature_live                                   │
│     {oldId: tempId-X, id: Y, posX: 0.5, posY: 0.5}              │
│                                                                  │
│ T4  kalau localState !== dropData:                               │
│     PATCH /position dengan posX=0.5 ke server                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alur 2: Drag Signature (Move)

User pegang signature dan drag ke posisi baru.

### Sequence

```
User A         react-draggable    useGroupDraggableRef    Socket    User B
  │                  │                    │                  │         │
  │ mousedown        │                    │                  │         │
  ├─────────────────▶│                    │                  │         │
  │                  │ onStart            │                  │         │
  │                  ├───────────────────▶│                  │         │
  │                  │                    │ setIsDragging(true)        │
  │                  │                    │ setIsActive(true)          │
  │ mousemove        │                    │                  │         │
  ├─────────────────▶│                    │                  │         │
  │                  │ onDrag (event)     │                  │         │
  │                  ├───────────────────▶│                  │         │
  │                  │                    │ positionRef.current = {x,y}│
  │                  │                    │ (NO setState!)             │
  │                  │ react-draggable    │                  │         │
  │                  │ internal updates   │                  │         │
  │                  │ DOM transform      │                  │         │
  │                  │                    │ emitDragThrottled │         │
  │                  │                    │ (every 30ms max) │         │
  │                  │                    ├─────────────────▶│         │
  │                  │                    │                  │ broadcast│
  │                  │                    │                  ├────────▶│
  │                  │                    │                  │         │ setPositionFromRemote
  │                  │                    │                  │         │ (direct DOM,
  │                  │                    │                  │         │  no setState)
  │ mouseup          │                    │                  │         │
  ├─────────────────▶│                    │                  │         │
  │                  │ onStop (event)     │                  │         │
  │                  ├───────────────────▶│                  │         │
  │                  │                    │ setIsDragging(false)       │
  │                  │                    │ positionRef = {x,y final}  │
  │                  │                    │ onUpdatePosition callback  │
  │                  │                    ├──────────────────▶ PATCH   │
  │                  │                    │                   /position │
```

### File yang Terlibat

**Frontend (owner):**
1. `components/DraggableSignatureGroup.jsx` — render `<Draggable>` dengan
   `defaultPosition={initialPosition}`, `onDrag={handleDrag}`, `onStop={onDragStop}`
2. `hooks/useGroupDraggableRef.js` — `onDrag` callback update `positionRef`
   tanpa setState
3. `hooks/useDraggableSignatureGroup.js` — `handleDrag` panggil
   `actions.onDrag(e, data)` lalu `emitDragThrottled` (30ms throttle)
4. `services/socketService.js` → `emitSignatureUpdate({documentId, signatureId, ...pos})`

**Backend:**
1. `socket/socketHandler.js` — terima `drag_signature`, forward ke document
   room sebagai `update_signature_position` (no DB write)

**Note**: drag move TIDAK persist ke DB. Cuma drop event yang persist via PATCH.

### File yang Terlibat (drop persist)

1. `useGroupSignatureActions.js` → `handleUpdateSignature(id, x, y)`:
   - Optimistic update state (sebenarnya state sudah up-to-date karena positionRef)
   - Skip kalau `_pending: true`
   - Call `updateDraftPosition(id, payload)` dengan `withRetryCoalesce`
2. `api/groupSignatureService.js` → `updateDraftPosition`
3. `services/withRetryCoalesce.js` — abort PATCH lama saat ada PATCH baru
4. **Backend**: `PATCH /:signatureId/position` → `groupSignatureController` →
   `groupSignatureService.updateDraftPosition` → `updateConditional` (atomic
   1 query dengan WHERE signerId+status='draft')

---

## Alur 3: Resize Signature

User pegang corner handle (NW/NE/SW/SE) dan tarik untuk resize.

Pattern sama dengan drag (positionRef-based, direct DOM), kecuali:
- Aspect ratio LOCK ke image natural ratio (`aspectRatioRef`)
- Update width DAN height bersamaan
- Kalau pegang edge kiri/atas, posisi ikut bergeser supaya pivot di kanan/bawah
- Boundary clamp manual ke containerWidth/Height

### File Khusus Resize

`hooks/useGroupDraggableRef.js`:
- `useEffect` untuk attach `mousedown`/`touchstart` listener ke handle refs (NW, NE, SW, SE)
- `onStart` → cache start state (startW, startH, startX, startY, startPointer, ratio)
- `onMove` → calculate newW, newH, newX, newY dengan ratio lock + integer pixel rounding + manual clamp
- `onEnd` → emit resize final + persist via `onUpdatePosition` + `onUpdateSize`

---

## Alur 4: Delete Signature

User klik tombol X di pojok signature untuk hapus.

### Sequence

```
User A          Frontend                    Backend             User B
  │                │                            │                  │
  │ klik delete    │                            │                  │
  ├───────────────▶│                            │                  │
  │                │ handleDeleteSignature(id)  │                  │
  │                │   ├─ guard: hanya draft +   │                 │
  │                │   │  ownership check       │                  │
  │                │   ├─ setSignatures (filter)│                  │
  │                │   │   (optimistic)          │                 │
  │                │   ├─ emit remove_signature_live              │
  │                │   │                          │ broadcast      │
  │                │   │                          ├───────────────▶│
  │                │   │                          │                │ setSignatures
  │                │   │                          │                │  (filter)
  │                │   ├─ kalau _pending: true,   │                │
  │                │   │  SKIP DELETE API        │                 │
  │                │   │  (backend belum tahu)   │                 │
  │                │   ├─ DELETE /:id            │                 │
  │                │   │   (hanya kalau persisted)│                │
  │                │   │                          ▼                │
  │                │   │                  groupSignatureService    │
  │                │   │                    .deleteDraft           │
  │                │   │                    ├─ findOwnershipById   │
  │                │   │                    ├─ ownership check     │
  │                │   │                    ├─ status check (draft)│
  │                │   │                    └─ delete row          │
```

### File yang Terlibat

**Frontend:**
- `useGroupSignatureActions.js` → `handleDeleteSignature(sigId)`
- `api/groupSignatureService.js` → `deleteDraft(signatureId)`

**Backend:**
- `routes/groupSignatureRoutes.js` — `DELETE /:signatureId`
- `controllers/groupSignatureController.js` → `deleteDraft`
- `services/groupSignatureService.js` → `deleteDraft`
- `repository/prisma/PrismaGroupSignatureRepository.js` → `findOwnershipById` + `delete`

---

## Alur 5: Realtime View untuk User Lain

User B observer melihat user A drag/resize.

### Sequence

```
User A → backend → User B

User A drag mousemove
   ↓
handleDrag → emitDragThrottled (30ms)
   ↓
socketService.emitSignatureUpdate({documentId, signatureId, posX, posY, w, h})
   ↓ WebSocket
[Backend] socketHandler.on('drag_signature')
   ↓
socket.to(documentId).emit('update_signature_position', data)
   ↓ WebSocket
[User B] socketService receive 'update_signature_position'
   ↓
useGroupSocket.handleRemoteMove forward ke
   ↓
useDraggableSignatureGroup.handleRemoteMove (per signature)
   ↓
guards: signatureId match + isOwner=false
   ↓
convert inner fraction → outer pixel
   ↓
setPositionFromRemote(outerX, outerY, outerW, outerH)
   ↓ (di useGroupDraggableRef)
positionRef.current = { x, y, w, h }
nodeRef.current.style.transform = `translate(${x}px, ${y}px)`
nodeRef.current.style.width = `${w}px`
nodeRef.current.style.height = `${h}px`
   ↓
[BROWSER] Native compositor render ke GPU (60fps smooth)
```

### Kunci Smoothness

1. **Direct DOM update** (bypass React reconciliation) — native browser compositor handle 60fps di GPU thread
2. **`positionRef` (mutable ref)** — TIDAK trigger React render
3. **react-draggable uncontrolled** — internal pegang state sendiri
4. **No CSS transition** — setiap event override DOM langsung, transition justru bikin animation race

---

## Pattern Optimistic + Reconciliation

Drop signature pertama kali pakai pattern **optimistic emit** untuk
responsiveness:

```
T0  Drop
    ├─ Optimistic state: setSignatures([+sig{id: tempId, _pending: true}])
    ├─ Optimistic socket emit: peer langsung lihat (latency: ~50ms)
    └─ saveDraft async start

T1  Drag/resize boleh jalan (optimistic state already)
    └─ Tapi PATCH skipped via guard `_pending: true`

T2  saveDraft response (~150-300ms after T0)
    ├─ Replace tempId dengan serverId (preserve local pos/size)
    ├─ Re-emit dengan oldId tag → peer replace tempId dengan serverId
    └─ Hapus _pending flag → PATCH future drag boleh jalan

T3  Kalau localState !== dropData (user sempat drag/resize antara T0-T2):
    └─ PATCH /position untuk sync backend
```

### Edge Cases yang di-handle

| Skenario | Mitigasi |
|---|---|
| User drag sebelum saveDraft response | `_pending: true` skip PATCH, posisi disync via T3 PATCH |
| User delete sebelum saveDraft response | Skip DELETE API; saveDraft tetap create orphan record (cleanup via fetch ulang) |
| saveDraft fail | Rollback state lokal (`setSignatures.filter`), peer akan lihat ghost signature sampai socket re-emit |
| Image load setelah saveDraft | `handleImageLoad` update size via `onUpdateSize` (separate PATCH) |

---

## Pattern positionRef vs useState

**Inilah perbedaan utama** antara hook personal (`useDraggableSignature`) dan
hook group (`useGroupDraggableRef`).

### useDraggableSignature (personal, useState-based)

```js
const [dragPos, setDragPos] = useState({ x, y });
const [localSize, setLocalSize] = useState({ width, height });

// react-draggable controlled mode:
<Draggable position={dragPos}>...</Draggable>

// Drag move handler:
onDrag: (_e, data) => setDragPos({ x: data.x, y: data.y })  // ← React render!
```

**Konsekuensi**: setiap drag event = setState = component re-render =
reconciliation overhead. Untuk single user (personal), ini masih OK tapi
ada visible micro-stutter saat drag cepat.

### useGroupDraggableRef (group, ref-based)

```js
const positionRef = useRef({ x, y, w, h });

// react-draggable UNCONTROLLED mode:
<Draggable defaultPosition={initialPosition}>...</Draggable>

// Drag move handler:
onDrag: (_e, data) => {
  positionRef.current = { ...positionRef.current, x: data.x, y: data.y };
  // NO setState — visual handled by react-draggable internal.
}

// Remote update handler:
setPositionFromRemote = (x, y, w, h) => {
  positionRef.current = { x, y, w, h };
  nodeRef.current.style.transform = `translate(${x}px, ${y}px)`;
  // Direct DOM — no React reconciliation.
}
```

**Konsekuensi**: drag/resize/remote-update **TIDAK** trigger React render.
Native compositor handle smooth 60fps di GPU. Same pattern dengan project
lama yang user konfirmasi smooth.

### Kapan Pakai Mana

| Use case | Hook |
|---|---|
| Personal signing (1 user, no realtime) | `useDraggableSignature` |
| Group signing (multi-user, realtime peer view) | `useGroupDraggableRef` |
| Package signing (1 user, no realtime) | `useDraggableSignature` |

---

## Throttle dan Debounce Strategy

| Action | Strategy | Value | File |
|---|---|---|---|
| Emit drag ke socket | Throttle leading-only | 30ms | `useDraggableSignatureGroup.js` |
| Emit resize ke socket | Throttle leading-only | 30ms | `useDraggableSignatureGroup.js` |
| PATCH `/position` saat drop | Coalesce + retry | abort lama saat ada baru | `withRetryCoalesce.js` |
| Remote position apply | Tidak ada (immediate direct DOM) | - | `useDraggableSignatureGroup.js` |

**Throttle leading-only**: emit pertama langsung jalan, sisanya dalam window
30ms di-DROP. Trailing call tidak di-buffer karena drop event akan emit final
posisi tanpa throttle (lewat `onDragStop` callback).

```js
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

**Coalesce di withRetryCoalesce**: per `signatureId`, kalau ada PATCH baru
masuk sebelum yang lama selesai, abort yang lama. Mencegah out-of-order
writes ke server (drag → drag → drag yang kedua boleh sampai duluan dari
ketiga).

---

## Edge Cases dan Race Conditions

### 1. Cloning Signature di User B

**Reproduce**: User A drop + drag sebelum saveDraft response.

```
T0 emit add(id=tempId-X)
T1 emit drag(sigId=tempId-X)  → User B update tempId-X position
T2 saveDraft response
T3 re-emit add(id=serverId-Y) → User B punya 2 sig: [tempId-X, serverId-Y] ❌
```

**Fix**: tag final emit dengan `oldId: tempId-X`. Receiver pakai untuk
REPLACE row dengan ID lama, bukan ADD baru.

```js
// useGroupSocket.handleAddSig
if (signature.oldId) {
  const idx = prev.findIndex((s) => s.id === signature.oldId);
  if (idx !== -1) {
    next[idx] = { ...existing, ...signature };  // REPLACE
    return next;
  }
}
return [...prev, signature];  // ADD biasa kalau tidak match
```

### 2. Signature Lompat ke Posisi Awal

**Reproduce**: User A drop + drag, lalu saveDraft response sampai dengan
posisi DROP awal (yang ke-payload). Setiap user (A dan B) lihat lompat.

**Fix**: Saat replace state dengan serverSig, **PRESERVE** position dari state
lokal. Saat re-emit, pakai `localSnapshot.positionX/Y`. PATCH `/position`
untuk sync backend kalau berubah.

```js
return {
  ...rest,
  ...serverSig,
  // PRESERVE local state, BUKAN dari serverSig
  positionX: s.positionX,
  positionY: s.positionY,
  width: s.width,
  height: s.height,
  _pending: false,
};
```

### 3. PATCH 404 di Optimistic Window

**Reproduce**: User A drag dengan `tempId` yang backend belum tahu.

**Fix**: guard `_pending: true` di `handleUpdateSignature` dan
`handleUpdateSize` — skip PATCH selama optimistic. Posisi akan disync via
post-saveDraft PATCH.

```js
if (sig._pending) return;  // skip PATCH, akan disync via T3
updateDraftPosition(id, payload);
```

### 4. Token Expired di Tengah Drag

Frontend interceptor di `services/api.js` auto-refresh access token saat
401. Drag continues normal setelah refresh sukses. Kalau refresh fail,
user di-kick ke login.

### 5. Connection Drop Saat Drag

PATCH coalesced via `withRetryCoalesce` retry exponential 3x. Kalau retry
habis, payload masuk outbox di localStorage. Drain otomatis saat user
online kembali.

---

## Tips Debug

### Frontend Console

Buka DevTools, monitor patterns:

```
[apiFetch] 401 detected on POST /group-signatures/draft/...    ← token expired (auto-refresh)
[apiFetch] Token refreshed successfully                         ← refresh sukses
[apiFetch] Retrying request after token refresh                 ← retry sukses

🟢 Socket connected: <socketId>                                  ← socket OK
🔄 Auto-rejoining document room: <documentId>                    ← reconnect

🔔 [SOCKET] signature_saved received                             ← peer finalize
```

### Network Tab

Filter:
- `group-signatures/draft` — saveDraft
- `group-signatures/.+/position` — PATCH drag/resize persist
- `group-signatures/.+` (DELETE) — delete

Status yang aman:
- `200 OK` — sukses
- `(canceled)` — coalesce abort yang lebih lama, BUKAN bug

Status yang masalah:
- `401 SESSION_EXPIRED` — wait, lihat kalau apiFetch retry sukses
- `403 FORBIDDEN` — ownership/status check fail (signature final, atau bukan owner)
- `404 NOT_FOUND` — signature tidak ada (mungkin di-delete peer atau optimistic id)

### Socket Tab (di DevTools)

Expand WebSocket connection, lihat frames:

```
↑ drag_signature         ← outgoing emit
↓ update_signature_position  ← incoming dari peer
↓ user_joined            ← peer join room
↓ group_document_update  ← lifecycle event
```

### Backend Logs (Railway / dev)

```
🚀 Mendeteksi REDIS_URL...
✅ Redis Adapter Terhubung
[redisClient] ready

http: POST /api/group-signatures/draft/<id> 200 178 - 32.5 ms
http: PATCH /api/group-signatures/<id>/position 200 89 - 12.1 ms
```

Backend log error:
```
JWT Verification: TokenExpiredError (expected, frontend will auto-refresh)
```

Ini bukan bug — wajar terjadi tiap ~15 menit saat access token expire.
Frontend handle dengan refresh + retry.

---

## Referensi Cepat

### Total File Terlibat (Drag & Drop)

**Frontend (12 file utama):**

```
src/
├── features/groups/
│   ├── pages/GroupSigningPage.jsx
│   ├── components/DraggableSignatureGroup.jsx
│   ├── hooks/
│   │   ├── useDraggableSignatureGroup.js          ← orchestrator
│   │   ├── useGroupDraggableRef.js                ← drag math (positionRef)
│   │   ├── useGroupSignatureActions.js            ← CRUD handlers
│   │   ├── useGroupSigningPage.js                 ← state aggregator
│   │   ├── useGroupSocket.js                      ← socket listener
│   │   ├── useGroupSigning.js                     ← orchestrator level atas
│   │   └── useGroupData.js                        ← initial fetch
│   ├── api/groupSignatureService.js
│   └── constants/groupSignatureLayout.js
├── features/signature/
│   └── constants/signatureLayout.js
└── services/
    ├── socketService.js
    ├── api.js
    └── withRetryCoalesce.js
```

**Backend (10 file utama):**

```
src/
├── routes/groupSignatureRoutes.js
├── controllers/groupSignatureController.js
├── services/groupSignatureService.js
├── repository/prisma/
│   ├── PrismaGroupSignatureRepository.js
│   ├── PrismaGroupDocumentSignerRepository.js
│   └── PrismaDocumentRepository.js
├── socket/socketHandler.js
├── middleware/authMiddleware.js
├── domain/SignatureValidator.js
└── prisma/schema.prisma                           ← model SignatureGroup
```

---

## Changelog

| Date | Change | File |
|---|---|---|
| 2026-05 | Refactor `useDraggableSignature` → `useGroupDraggableRef` (positionRef pattern) | `useGroupDraggableRef.js` (new), `useDraggableSignatureGroup.js`, `DraggableSignatureGroup.jsx` |
| 2026-05 | Add `oldId` tag untuk prevent cloning di optimistic flow | `useGroupSignatureActions.js`, `useGroupSocket.js` |
| 2026-05 | Preserve local pos/size saat saveDraft response (cegah lompat ke posisi awal) | `useGroupSignatureActions.js` |
| 2026-05 | Optimistic socket emit sebelum saveDraft response | `useGroupSignatureActions.js` |
| 2026-05 | Parallel query di backend `saveDraft` (Promise.all document + signerRequest) | `groupSignatureService.js` |
| 2026-05 | Atomic `updateConditional` untuk PATCH /position | `PrismaGroupSignatureRepository.js`, `groupSignatureService.js` |
