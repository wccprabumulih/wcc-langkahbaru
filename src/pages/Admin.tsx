import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AdminDashboard from '../admin/AdminDashboard'
import AdminPesanan from '../admin/AdminPesanan'
import AdminPengguna from '../admin/AdminPengguna'
import AdminPaket from '../admin/AdminPaket'
import AdminUlasan from '../admin/AdminUlasan'
import AdminPengaturan from '../admin/AdminPengaturan'

type Page = 'dashboard' | 'pesanan' | 'pengguna' | 'paket' | 'ulasan' | 'pengaturan'

const navItems: { key: Page; icon: string; label: string }[] = [
  { key: 'dashboard',   icon: '🏠', label: 'Dashboard' },
  { key: 'pesanan',     icon: '📋', label: 'Pesanan' },
  { key: 'pengguna',    icon: '👥', label: 'Pengguna' },
  { key: 'paket',       icon: '📦', label: 'Paket' },
  { key: 'ulasan',      icon: '⭐', label: 'Ulasan' },
  { key: 'pengaturan',  icon: '⚙', label: 'Pengaturan' },
]

const pageTitle: Record<Page, string> = {
  dashboard: 'Dashboard',
  pesanan: 'Pesanan',
  pengguna: 'Pengguna',
  paket: 'Paket',
  ulasan: 'Ulasan',
  pengaturan: 'Pengaturan',
}

export default function Admin() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const adminName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
  const adminInitial = adminName.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const goTo = (p: string) => {
    setPage(p as Page)
    setSidebarOpen(false)
  }

  return (
    <div className="adm-layout">

      {sidebarOpen && (
        <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="adm-sidebar-logo">
          <span className="logo-lk">LK</span>
          <div>
            <div className="adm-sidebar-brand">Langkah Baru</div>
            <div className="adm-sidebar-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="adm-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`adm-nav-item${page === item.key ? ' active' : ''}`}
              onClick={() => goTo(item.key)}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <Link to="/" className="adm-back-link">← Kembali ke Website</Link>
          <div className="adm-user-row">
            <div className="adm-avatar">{adminInitial}</div>
            <div className="adm-user-info">
              <div className="adm-user-name">{adminName}</div>
              <div className="adm-user-email">{user?.email}</div>
            </div>
          </div>
          <button className="adm-signout" onClick={handleSignOut}>Keluar</button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="adm-main">
        <div className="adm-topbar">
          <button className="adm-menu-btn" onClick={() => setSidebarOpen(o => !o)}>
            <span /><span /><span />
          </button>
          <span className="adm-topbar-title">{pageTitle[page]}</span>
        </div>

        <div className="adm-content">
          {page === 'dashboard'  && <AdminDashboard onNavigate={goTo} />}
          {page === 'pesanan'    && <AdminPesanan />}
          {page === 'pengguna'   && <AdminPengguna />}
          {page === 'paket'      && <AdminPaket />}
          {page === 'ulasan'     && <AdminUlasan />}
          {page === 'pengaturan' && <AdminPengaturan />}
        </div>
      </div>
    </div>
  )
}
