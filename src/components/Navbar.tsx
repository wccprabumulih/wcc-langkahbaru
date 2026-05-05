import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const WA_NUMBER = '6281532477237'

const NAV_LINKS = [
  ['#about', 'Tentang'],
  ['#services', 'Paket'],
  ['#process', 'Proses'],
  ['#gallery', 'Galeri'],
  ['#testimonials', 'Ulasan'],
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      const sections = NAV_LINKS.map(([href]) => document.querySelector(href))
      let current = ''
      sections.forEach(el => {
        if (el && el.getBoundingClientRect().top <= 120) current = '#' + el.id
      })
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    setTimeout(() => {
      const el = document.querySelector(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, menuOpen ? 350 : 0)
  }

  const handleSignOut = async () => {
    setProfileOpen(false)
    await signOut()
    navigate('/')
  }

  const getInitial = () => {
    const name = user?.user_metadata?.full_name || user?.email || ''
    return name.charAt(0).toUpperCase()
  }

  const getDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Profil'
  }

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        {/* Logo */}
        <a href="/" className="nav-logo" onClick={e => { e.preventDefault(); scrollTo('#hero') }}>
          <span className="logo-lk">LK</span>
          <span className="logo-sub">Langkah Baru</span>
        </a>

        {/* Center links */}
        <div className="nav-center">
          {NAV_LINKS.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className={`nav-link${active === href ? ' active' : ''}`}
              onClick={e => { e.preventDefault(); scrollTo(href) }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right side */}
        <div className="nav-right">
          <span className="nav-dot-sep" />

          {loading ? (
            <div className="nav-skeleton" />
          ) : user ? (
            /* LOGGED IN — Profile button */
            <div className="nav-profile-wrap" ref={profileRef}>
              <button
                className={`nav-profile-btn${profileOpen ? ' open' : ''}`}
                onClick={() => setProfileOpen(o => !o)}
              >
                <div className="nav-avatar">{getInitial()}</div>
                <span className="nav-profile-name">{getDisplayName()}</span>
                <span className="nav-chevron">{profileOpen ? '▲' : '▼'}</span>
              </button>

              {profileOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header">
                    <div className="nav-dropdown-avatar">{getInitial()}</div>
                    <div>
                      <div className="nav-dropdown-name">{getDisplayName()}</div>
                      <div className="nav-dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="nav-dropdown-divider" />
                  <button className="nav-dropdown-item" onClick={() => { setProfileOpen(false); scrollTo('#booking') }}>
                    Buat Pesanan
                  </button>
                  <button className="nav-dropdown-item danger" onClick={handleSignOut}>
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* NOT LOGGED IN — Masuk button */
            <button className="btn-nav-cta" onClick={() => navigate('/auth')}>
              Masuk
            </button>
          )}

          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Full-screen mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setMenuOpen(false)}>✕</button>

        {[...NAV_LINKS, ['#booking', 'Pesan Sekarang']].map(([href, label]) => (
          <a key={href} href={href} onClick={e => { e.preventDefault(); scrollTo(href) }}>
            {label}
          </a>
        ))}

        <div className="mobile-menu-divider" />

        {user ? (
          <div className="mobile-menu-user">
            <div className="mobile-menu-avatar">{getInitial()}</div>
            <span>{getDisplayName()}</span>
            <button className="mobile-menu-signout" onClick={handleSignOut}>Keluar</button>
          </div>
        ) : (
          <div className="mobile-menu-auth-btns">
            <button
              className="btn-primary"
              onClick={() => { setMenuOpen(false); navigate('/auth?tab=login') }}
            >
              Masuk
            </button>
            <button
              className="btn-outline"
              onClick={() => { setMenuOpen(false); navigate('/auth?tab=register') }}
            >
              Daftar
            </button>
          </div>
        )}
      </div>
    </>
  )
}
