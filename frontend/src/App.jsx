import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PhotoZoomProvider } from './context/PhotoZoomContext'
import Navbar from './components/Navbar'
import { PageLoader } from './components/LoadingSpinner'

// ── Lazy-loaded routes (code splitting for fast initial load) ──────────────
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Search = lazy(() => import('./pages/Search'))
const ProviderProfile = lazy(() => import('./pages/ProviderProfile'))
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'))
const UserDashboard = lazy(() => import('./pages/UserDashboard'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ProtectedRoute({ children, role }) {
  const { user, isAuth, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!isAuth) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/provider/:id" element={<ProviderProfile />} />

          <Route path="/dashboard/provider" element={
            <ProtectedRoute role="provider"><ProviderDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/user" element={
            <ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <PhotoZoomProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#e2e8f0',
                border: '1px solid #2d2d4a',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </PhotoZoomProvider>
    </BrowserRouter>
  )
}
