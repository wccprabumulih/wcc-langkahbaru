import { Navigate } from 'react-router-dom'
import { useAuth, UserRole } from '../contexts/AuthContext'

interface Props {
  children: React.ReactNode
  requiredRole: UserRole
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: 'center', color: 'var(--white-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14 }}>Memverifikasi akses...</div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  if (requiredRole && role !== requiredRole) {
    // Admin tries to go to user-only page → home
    // User tries to go to admin page → home with message
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
