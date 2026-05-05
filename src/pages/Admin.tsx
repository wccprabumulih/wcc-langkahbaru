import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AdminDashboard from '../admin/AdminDashboard'
import AdminPesanan from '../admin/AdminPesanan'
import AdminPengguna from '../admin/AdminPengguna'
import AdminPaket from '../admin/AdminPaket'
import AdminUlasan from '../admin/AdminUlasan'
import AdminGaleri from '../admin/AdminGaleri'
import AdminTentangKami from '../admin/AdminTentangKami'
import AdminPartner from '../admin/AdminPartner'
import AdminChatbot from '../admin/AdminChatbot'
import AdminPengaturan from '../admin/AdminPengaturan'

type Page = 'dashboard' | 'pesanan' | 'pengguna' | 'paket' | 'ulasan' | 'galeri' | 'tentang' | 'partner' | 'chatbot' | 'pengaturan'

const pageTitle: Record<Page, string> = {
  dashboard: 'Dashboard',
  pesanan: 'Pesanan',
  pengguna: 'Pengguna',
  paket: 'Paket',
  ulasan: 'Ulasan',
  galeri: 'Galeri',
  tentang: 'Tentang Kami',
  partner: 'Partner & Mitra',
  chatbot: 'Chatbot',
  pengaturan: 'Pengaturan',
}

function IconDashboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}
function IconPesanan() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="4" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="4" y1="7.5" x2="11" y2="7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="4" y1="10" x2="8" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function IconPengguna() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2 13c0-3.314 2.462-5 5.5-5s5.5 1.686 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function IconPaket() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1L13 4v7L7.5 14 2 11V4L7.5 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M7.5 1v13M2 4l5.5 3 5.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function IconUlasan() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1.5l1.545 3.13 3.455.5-2.5 2.435.59 3.435L7.5 9.385l-3.09 1.615.59-3.435L2.5 5.13l3.455-.5L7.5 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}
function IconGaleri() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="1" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="5" cy="5" r="1.2" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M1 10l3.5-3.5 2.5 2.5 2-2 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconTentang() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7.5 7v4M7.5 4.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function IconPartner() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M5.5 7.5c0-1.105.895-2 2-2s2 .895 2 2-.895 2-2 2-2-.895-2-2Z" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1 4.5c0-.828.672-1.5 1.5-1.5S4 3.672 4 4.5 3.328 6 2.5 6 1 5.328 1 4.5ZM11 4.5c0-.828.672-1.5 1.5-1.5S14 3.672 14 4.5 13.328 6 12.5 6 11 5.328 11 4.5Z" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M4 11c0-1.933 1.567-3 3.5-3S11 9.067 11 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M1 13c0-1.343.933-2 2.5-2M14 13c0-1.343-.933-2-2.5-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function IconPengaturan() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.636 2.636l1.06 1.06M11.304 11.304l1.06 1.06M2.636 12.364l1.06-1.06M11.304 3.696l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconChatbot() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="1" y="2" width="13" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 14l2.5-3L10 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="5" cy="6.5" r="1" fill="currentColor"/>
      <circle cx="7.5" cy="6.5" r="1" fill="currentColor"/>
      <circle cx="10" cy="6.5" r="1" fill="currentColor"/>
    </svg>
  )
}

const navGroups: { label: string; items: { key: Page; Icon: () => JSX.Element; label: string }[] }[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', Icon: IconDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Kelola',
    items: [
      { key: 'pesanan',  Icon: IconPesanan, label: 'Pesanan' },
      { key: 'paket',    Icon: IconPaket,   label: 'Paket' },
      { key: 'galeri',   Icon: IconGaleri,  label: 'Galeri' },
    ],
  },
  {
    label: 'Komunitas',
    items: [
      { key: 'pengguna', Icon: IconPengguna, label: 'Pengguna' },
      { key: 'ulasan',   Icon: IconUlasan,   label: 'Ulasan' },
    ],
  },
  {
    label: 'Konten',
    items: [
      { key: 'tentang',  Icon: IconTentang,  label: 'Tentang Kami' },
      { key: 'partner',  Icon: IconPartner,  label: 'Partner & Mitra' },
      { key: 'chatbot',  Icon: IconChatbot,  label: 'Chatbot' },
    ],
  },
  {
    label: 'Akun',
    items: [
      { key: 'pengaturan', Icon: IconPengaturan, label: 'Pengaturan' },
    ],
  },
]

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

      <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="adm-sidebar-logo">
          <span className="logo-lk">LK</span>
          <div>
            <div className="adm-sidebar-brand">Langkah Baru</div>
            <div className="adm-sidebar-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="adm-nav">
          {navGroups.map(group => (
            <div key={group.label} className="adm-nav-group">
              <div className="adm-nav-group-label">{group.label}</div>
              {group.items.map(({ key, Icon, label }) => (
                <button
                  key={key}
                  className={`adm-nav-item${page === key ? ' active' : ''}`}
                  onClick={() => goTo(key)}
                >
                  <span className="adm-nav-icon"><Icon /></span>
                  {label}
                </button>
              ))}
            </div>
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
          {page === 'galeri'     && <AdminGaleri />}
          {page === 'tentang'    && <AdminTentangKami />}
          {page === 'partner'    && <AdminPartner />}
          {page === 'chatbot'    && <AdminChatbot />}
          {page === 'pengaturan' && <AdminPengaturan />}
        </div>
      </div>
    </div>
  )
}
