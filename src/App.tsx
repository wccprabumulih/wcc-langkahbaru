import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import CustomCursor from './components/CustomCursor'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Auth from './pages/Auth'

function AdminRedirect() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading) return
    if (user && role === 'admin' && location.pathname === '/') {
      navigate('/admin', { replace: true })
    }
  }, [role, user, loading, location.pathname, navigate])

  return null
}

// Always mounted — just disabled on admin routes to avoid flicker
function AppCursor() {
  const { pathname } = useLocation()
  return <CustomCursor disabled={pathname.startsWith('/admin')} />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminRedirect />
        <AppCursor />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
