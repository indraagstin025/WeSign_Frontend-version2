import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import GuestRoute from './components/Auth/GuestRoute';
import NetworkStatus from './components/ui/NetworkStatus';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { UserProvider } from './context/UserContext';
import './App.css'; 

// --- LAZY LOADED PAGES ---
// Kita pisahkan halaman-halaman berat agar tidak membebani bundle utama
const HomePage = lazy(() => import('./pages/public/HomePage'));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage'));
const OverviewPage = lazy(() => import('./features/dashboard/pages/OverviewPage'));
const DashboardLayout = lazy(() => import('./components/Layout/DashboardLayout'));
const DocumentsPage = lazy(() => import('./features/documents/pages/DocumentsPage'));
const PackagesPage = lazy(() => import('./features/packages/pages/PackagesPage'));
const DocumentPreviewPage = lazy(() => import('./features/documents/pages/DocumentPreviewPage'));
const DocumentSigningPage = lazy(() => import('./features/signature/pages/DocumentSigningPage'));
const SignPackagePage = lazy(() => import('./features/packages/pages/SignPackagePage'));
const PackagePreviewPage = lazy(() => import('./features/packages/pages/PackagePreviewPage'));
const ProfilePage = lazy(() => import('./features/user/pages/ProfilePage'));
const GroupSigningPage = lazy(() => import('./features/groups/pages/GroupSigningPage'));
const GroupDetailPage = lazy(() => import('./features/groups/pages/GroupDetailPage'));
const GroupsPage = lazy(() => import('./features/groups/pages/GroupsPage'));
const JoinGroupPage = lazy(() => import('./features/groups/pages/JoinGroupPage'));
const GroupDocumentPreviewPage = lazy(() => import('./features/groups/pages/GroupDocumentPreviewPage'));

// Komponen Loading sederhana untuk transisi Lazy Loading
const PageLoader = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 z-[9999]">
    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Menyiapkan Halaman...</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
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
              <Route path="profile" element={<ProfilePage />} />
              <Route path="documents/preview/:id" element={<DocumentPreviewPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="groups/:groupId" element={<GroupDetailPage />} />
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

            <Route path="/dashboard/groups/:groupId/documents/:documentId/sign" element={
              <ProtectedRoute>
                <GroupSigningPage />
              </ProtectedRoute>
            } />

            <Route path="/dashboard/groups/:groupId/documents/:documentId/preview" element={
              <ProtectedRoute>
                <GroupDocumentPreviewPage />
              </ProtectedRoute>
            } />

            {/* PUBLIC — Join group via invitation link */}
            <Route path="/groups/join" element={<JoinGroupPage />} />
          </Routes>
        </Suspense>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
