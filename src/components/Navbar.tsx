import { useEffect, useState } from 'react'

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

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)

      // Active section tracking
      const sections = NAV_LINKS.map(([href]) => document.querySelector(href))
      let current = ''
      sections.forEach(el => {
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 120) current = '#' + el.id
        }
      })
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const openWa = () => {
    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo! Saya ingin konsultasi tentang layanan WCC Langkah Baru 😊')}`,
      '_blank'
    )
  }

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    setTimeout(() => {
      const el = document.querySelector(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, menuOpen ? 350 : 0)
  }

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        {/* Logo */}
        <a
          href="#hero"
          className="nav-logo"
          onClick={e => { e.preventDefault(); scrollTo('#hero') }}
        >
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
          <button className="btn-nav-cta" onClick={openWa}>
            📲 Konsultasi
          </button>
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
          <a
            key={href}
            href={href}
            onClick={e => { e.preventDefault(); scrollTo(href) }}
          >
            {label}
          </a>
        ))}
        <button className="btn-primary" onClick={() => { setMenuOpen(false); openWa() }}>
          📲 Chat WhatsApp
        </button>
      </div>
    </>
  )
}
