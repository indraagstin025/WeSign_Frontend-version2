/**
 * @file socketService.js
 * @description Singleton Socket.IO client untuk real-time collaboration.
 * Auth menggunakan JWT Bearer token dari localStorage (key: 'wesign_token').
 * Mendukung auto-reconnect, auto-rejoin rooms, dan tracking koneksi.
 */

import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/config/env';
import {
  SOCKET_RECONNECT_DELAY_MS,
  SOCKET_RECONNECT_DELAY_MAX_MS,
  SOCKET_CONNECT_TIMEOUT_MS,
  SOCKET_RECONNECT_JITTER,
} from '@/config/timeouts';

let socket = null;

// Track rooms yang aktif untuk auto-rejoin setelah reconnect
let currentDocumentRoom = null;
let currentGroupRooms = new Set();

// Subscribers untuk perubahan status koneksi
const connectionCallbacks = new Set();

// Map untuk dedup group listeners — pakai object reference (cb) sebagai key
// agar dedup deterministic. Sebelumnya pakai `${prefix}_${cb}` yang mengandalkan
// Function.toString() — tidak reliable untuk arrow function (body-dependent),
// bound function, atau native function (semua di-stringify "function () { [native code] }").
// Dipisah per event agar overhead lookup minimal.
const groupDocListeners = new Map();    // cb -> wrapper
const groupMemberListeners = new Map();

export const socketService = {
  /**
   * Inisialisasi koneksi socket. Idempotent — aman dipanggil berkali-kali.
   */
  connect: () => {
    if (socket && socket.connected) return socket;

    if (socket) socket.disconnect();

    const token = localStorage.getItem('wesign_token');

    socket = io(SOCKET_URL, {
      auth: { token },           // Backend socketHandler.js membaca dari handshake.auth.token
      // Pakai pattern polling-first + auto-upgrade ke websocket. Ini pattern
      // yang sama dengan implementasi lama yang work smooth. Polling-first
      // memberi:
      //   1. Session affinity yang lebih reliable di load balancer (Railway,
      //      reverse proxy, dll) — beberapa LB perlu sticky session via
      //      cookie yang kalau pakai WS-only kadang tidak ke-set duluan.
      //   2. Fallback otomatis kalau network user block WS (rare di network
      //      modern, tapi mungkin di network kampus dengan firewall ketat).
      //   3. Setelah handshake polling sukses, browser auto-upgrade ke WS
      //      yang persist untuk subsequent traffic — latency tetap rendah
      //      setelah upgrade selesai (~1-2 detik di awal).
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: SOCKET_RECONNECT_DELAY_MS,
      reconnectionDelayMax: SOCKET_RECONNECT_DELAY_MAX_MS,
      randomizationFactor: SOCKET_RECONNECT_JITTER,
      timeout: SOCKET_CONNECT_TIMEOUT_MS,
    });

    // ── Event: Connected ──────────────────────────────────────────────────────
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      console.log('[Socket] Transport:', socket.io.engine.transport.name);

      // Auto-rejoin document room
      if (currentDocumentRoom) {
        socket.emit('join_room', currentDocumentRoom);
      }

      // Auto-rejoin semua group rooms
      currentGroupRooms.forEach((groupId) => {
        socket.emit('join_group_room', groupId);
      });

      connectionCallbacks.forEach((cb) =>
        cb({ connected: true, transport: socket.io.engine.transport.name })
      );
    });

    socket.io.engine.on('upgrade', (transport) => {
      console.log('[Socket] Transport upgraded:', transport.name);
      connectionCallbacks.forEach((cb) =>
        cb({ connected: socket.connected, transport: transport.name })
      );
    });

    // ── Event: Connection Error ───────────────────────────────────────────────
    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);

      // Jika token expired, coba refresh melalui mekanisme yang ada di api.js
      if (
        err.message?.includes('Authentication') ||
        err.message?.includes('Invalid') ||
        err.message?.includes('token')
      ) {
        // Ambil token terbaru — mungkin sudah di-refresh oleh interceptor api.js
        const freshToken = localStorage.getItem('wesign_token');
        if (freshToken && socket.auth.token !== freshToken) {
          socket.auth.token = freshToken;
          socket.disconnect();
          socket.connect();
        }
      }

      connectionCallbacks.forEach((cb) => cb({ connected: false, error: err.message }));
    });

    // ── Event: Disconnected ───────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      connectionCallbacks.forEach((cb) => cb({ connected: false, reason }));

      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    // ── Network online/offline detection ──────────────────────────────────────
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (socket && !socket.connected) socket.connect();
      });
    }

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    currentDocumentRoom = null;
    currentGroupRooms.clear();
    // Clear listener wrapper Map agar GC bisa bersihkan reference dan
    // re-connect berikutnya tidak punya wrapper basi.
    groupDocListeners.clear();
    groupMemberListeners.clear();
  },

  // ── Document Room ─────────────────────────────────────────────────────────

  joinRoom: (documentId) => {
    currentDocumentRoom = documentId;
    if (socket?.connected) socket.emit('join_room', documentId);
  },

  leaveRoom: (documentId) => {
    if (currentDocumentRoom === documentId) currentDocumentRoom = null;
    socket?.emit('leave_room', documentId);
  },

  // ── Group Room ────────────────────────────────────────────────────────────

  joinGroupRoom: (groupId) => {
    currentGroupRooms.add(groupId);
    if (socket?.connected) socket.emit('join_group_room', groupId);
  },

  leaveGroupRoom: (groupId) => {
    currentGroupRooms.delete(groupId);
    socket?.emit('leave_group_room', groupId);
  },

  // ── Emitters ──────────────────────────────────────────────────────────────

  /**
   * Emit posisi/ukuran signature ke peer di room dokumen (drag + resize).
   *
   * [M-1] Naming yang akurat untuk semantik. Sebelumnya hanya ada `emitDrag`
   * yang dipakai untuk drag DAN resize event (di useDraggableSignatureGroup
   * ada emitDragThrottled untuk drag dan emitResizeThrottled yang di
   * dalamnya tetap memanggil socketService.emitDrag — misleading saat baca
   * code).
   *
   * Backend event-nya tetap `drag_signature` untuk backward compat — server
   * dan peer lama tidak perlu di-update. Yang berubah hanya alias di sisi
   * client agar code lebih jelas.
   *
   * @param {{
   *   documentId: string,
   *   signatureId: string,
   *   positionX: number,
   *   positionY: number,
   *   width?: number,
   *   height?: number,
   *   pageNumber?: number
   * }} data
   */
  emitSignatureUpdate: (data, options = {}) => {
    if (!socket?.connected) return;
    const emitter = options.volatile ? socket.volatile : socket;
    emitter.emit('drag_signature', data);
  },

  /**
   * @deprecated Pakai `emitSignatureUpdate` — naming lebih akurat untuk
   * drag + resize. Method ini tetap ada untuk backward compat caller lama.
   */
  emitDrag: (data) => {
    if (socket?.connected) socket.emit('drag_signature', data);
  },

  emitAddSignature: (documentId, signature) => {
    if (socket?.connected) socket.emit('add_signature_live', { documentId, signature });
  },

  emitRemoveSignature: (documentId, signatureId) => {
    if (socket?.connected) socket.emit('remove_signature_live', { documentId, signatureId });
  },

  emitSignatureSaved: (documentId, groupId) => {
    if (socket?.connected) socket.emit('signature_saved', { documentId, groupId });
  },

  emitDocumentFinalized: (groupId, documentId, title) => {
    if (socket?.connected) socket.emit('document_finalized', { groupId, documentId, title });
  },

  // Emit posisi cursor (opsional, untuk collaborative awareness)
  emitCursorMove: (documentId, x, y) => {
    if (socket?.connected) socket.emit('cursor_move', { documentId, x, y });
  },

  // Trigger reload ke user lain (untuk kasus edge seperti rollback)
  emitTriggerReload: (documentId) => {
    if (socket?.connected) socket.emit('trigger_reload', documentId);
  },

  // ── Listeners: Document Room ──────────────────────────────────────────────

  onPositionUpdate: (cb) => socket?.on('update_signature_position', cb),
  onAddSignatureLive: (cb) => socket?.on('add_signature_live', cb),
  onRemoveSignatureLive: (cb) => socket?.on('remove_signature_live', cb),
  onSignatureSaved: (cb) => socket?.on('signature_saved', cb),
  onUserJoined: (cb) => socket?.on('user_joined', cb),
  onUserLeft: (cb) => socket?.on('user_left', cb),
  onCurrentRoomUsers: (cb) => socket?.on('current_room_users', cb),
  // Cursor dari user lain
  onCursorMove: (cb) => socket?.on('cursor_move', cb),
  // Trigger refetch dari server (misal admin kick user)
  onRefetchData: (cb) => socket?.on('refetch_data', cb),

  // ── Listeners: Group Room (deduplicated by cb reference) ─────────────────

  onGroupDocumentUpdate: (cb) => {
    if (!socket) return;
    // Cleanup wrapper lama untuk cb yang sama supaya re-subscribe (mis. saat
    // useEffect re-run karena dep berubah) tidak tumpuk listener.
    const existing = groupDocListeners.get(cb);
    if (existing) socket.off('group_document_update', existing);
    const wrapper = (data) => cb(data);
    groupDocListeners.set(cb, wrapper);
    socket.on('group_document_update', wrapper);
  },

  offGroupDocumentUpdate: (cb) => {
    if (!socket) return;
    const wrapper = groupDocListeners.get(cb);
    if (wrapper) {
      socket.off('group_document_update', wrapper);
      groupDocListeners.delete(cb);
    }
  },

  onGroupMemberUpdate: (cb) => {
    if (!socket) return;
    const existing = groupMemberListeners.get(cb);
    if (existing) socket.off('group_member_update', existing);
    const wrapper = (data) => cb(data);
    groupMemberListeners.set(cb, wrapper);
    socket.on('group_member_update', wrapper);
  },

  offGroupMemberUpdate: (cb) => {
    if (!socket) return;
    const wrapper = groupMemberListeners.get(cb);
    if (wrapper) {
      socket.off('group_member_update', wrapper);
      groupMemberListeners.delete(cb);
    }
  },

  // ── Generic on/off ────────────────────────────────────────────────────────

  on: (event, cb) => socket?.on(event, cb),
  off: (event, cb) => socket?.off(event, cb),

  // ── Status Helpers ────────────────────────────────────────────────────────

  isConnected: () => !!(socket?.connected),

  onConnectionChange: (cb) => {
    connectionCallbacks.add(cb);
    if (socket) cb({ connected: socket.connected });
    return () => connectionCallbacks.delete(cb);
  },

  getSocket: () => socket,
};
