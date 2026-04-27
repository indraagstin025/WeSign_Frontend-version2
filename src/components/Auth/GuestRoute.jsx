/**
 * @file GuestRoute.jsx
 * @description Rute untuk halaman publik (Login/Register).
 *              Jika user sudah terautentikasi:
 *              - Jika ada pending join token → redirect ke /groups/join?token=...
 *              - Selain itu → redirect ke /dashboard
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const PENDING_JOIN_KEY = 'wesign_pending_join_token';

const GuestRoute = ({ children }) => {
  const { user, loading } = useUser();

  // Saat masih memvalidasi session, tampilkan children agar tidak ada flash redirect
  if (loading) {
    return children;
  }

  if (user) {
    // Cek apakah ada pending join token dari undangan grup
    const pendingToken = sessionStorage.getItem(PENDING_JOIN_KEY);
    if (pendingToken) {
      // Jangan hapus token di sini — JoinGroupPage yang akan hapus setelah berhasil join
      return <Navigate to={`/groups/join?token=${pendingToken}`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
