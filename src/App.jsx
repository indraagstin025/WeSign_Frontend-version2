import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import GuestRoute from './components/Auth/GuestRoute';
import NetworkStatus from './components/UI/NetworkStatus';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import './App.css'; 

// --- LAZY LOADED PAGES ---
// Kita pisahkan halaman-halaman berat agar tidak membebani bundle utama
const HomePage = lazy(() => import('./pages/public/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const DashboardLayout = lazy(() => import('./components/Layout/DashboardLayout'));
const DocumentsPage = lazy(() => import('./features/documents/pages/DocumentsPage'));
const PackagesPage = lazy(() => import('./features/packages/pages/PackagesPage'));
const DocumentPreviewPage = lazy(() => import('./features/documents/pages/DocumentPreviewPage'));
const DocumentSigningPage = lazy(() => import('./features/signature/pages/DocumentSigningPage'));
const SignPackagePage = lazy(() => import('./features/packages/pages/SignPackagePage'));
const PackagePreviewPage = lazy(() => import('./features/packages/pages/PackagePreviewPage'));

// Komponen Loading sederhana untuk transisi Lazy Loading
const PageLoader = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 z-[9999]">
    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menyiapkan Halaman...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <NetworkStatus />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={
            <GuestRoute>
              <HomePage />
            </GuestRoute>
          } />

          {/* Guest-only */}
          <Route path="/login" element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          } />
          <Route path="/register" element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          } />
          
          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<OverviewPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="documents/preview/:id" element={<DocumentPreviewPage />} />
          </Route>

          {/* STANDALONE FOCUSED ROUTES */}
          <Route path="/dashboard/documents/sign/:id" element={
            <ProtectedRoute>
              <DocumentSigningPage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/packages/sign/:id" element={
            <ProtectedRoute>
              <SignPackagePage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard/packages/preview/:id" element={
            <ProtectedRoute>
              <PackagePreviewPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
