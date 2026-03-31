/**
 * @file GuestRoute.jsx
 * @description Rute untuk halaman publik (Login/Register).
 *              Jika user sudah punya token → redirect ke /dashboard (tidak perlu login lagi).
 */
import React from 'react';
import { Navigate } from 'react-router-dom';

const GuestRoute = ({ children }) => {
  const token = localStorage.getItem('wesign_token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
