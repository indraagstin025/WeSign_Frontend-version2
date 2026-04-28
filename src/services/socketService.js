/**
 * @file socketService.js
 * @description Singleton Socket.IO client untuk real-time collaboration.
 * Auth menggunakan JWT Bearer token dari localStorage (key: 'wesign_token').
 * Mendukung auto-reconnect, auto-rejoin rooms, dan tracking koneksi.
 */

import { io } from 'socket.io-client';
import { SOCKET_URL } from '@/config/env';

let socket = null;

// Track rooms yang aktif untuk auto-rejoin setelah reconnect
let currentDocumentRoom = null;
let currentGroupRooms = new Set();

// Subscribers untuk perubahan status koneksi
const connectionCallbacks = new Set();

// Map untuk deduplication group listeners
const groupListeners = new Map();

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
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    // ── Event: Connected ──────────────────────────────────────────────────────
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);

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

  // ── Listeners: Group Room (deduplicated) ──────────────────────────────────

  onGroupDocumentUpdate: (cb) => {
    if (!socket) return;
    const key = `doc_${cb}`;
    const existing = groupListeners.get(key);
    if (existing) socket.off('group_document_update', existing);
    const wrapper = (data) => cb(data);
    groupListeners.set(key, wrapper);
    socket.on('group_document_update', wrapper);
  },

  offGroupDocumentUpdate: (cb) => {
    if (!socket) return;
    const wrapper = groupListeners.get(`doc_${cb}`);
    if (wrapper) {
      socket.off('group_document_update', wrapper);
      groupListeners.delete(`doc_${cb}`);
    }
  },

  onGroupMemberUpdate: (cb) => {
    if (!socket) return;
    const key = `member_${cb}`;
    const existing = groupListeners.get(key);
    if (existing) socket.off('group_member_update', existing);
    const wrapper = (data) => cb(data);
    groupListeners.set(key, wrapper);
    socket.on('group_member_update', wrapper);
  },

  offGroupMemberUpdate: (cb) => {
    if (!socket) return;
    const wrapper = groupListeners.get(`member_${cb}`);
    if (wrapper) {
      socket.off('group_member_update', wrapper);
      groupListeners.delete(`member_${cb}`);
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
