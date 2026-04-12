/**
 * @file GuestRoute.jsx
 * @description Rute untuk halaman publik (Login/Register).
 *              Jika user sudah terautentikasi (session valid) → redirect ke /dashboard.
 *              Menggunakan UserContext untuk validasi, bukan hanya cek token existence.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const GuestRoute = ({ children }) => {
  const { user, loading } = useUser();

  // Saat masih memvalidasi session, tampilkan children (halaman login/register)
  // agar tidak ada flash redirect
  if (loading) {
    return children;
  }

  // Hanya redirect jika user benar-benar terautentikasi (bukan hanya token ada di localStorage)
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
