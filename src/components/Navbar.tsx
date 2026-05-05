import { useEffect, useState } from 'react'

const WA_NUMBER = '6281532477237'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openWa = (msg: string) => {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const closeMenu = () => setMenuOpen(false)

  const scrollTo = (id: string) => {
    closeMenu()
    setTimeout(() => {
      const el = document.querySelector(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <a href="#hero" className="nav-logo" onClick={e => { e.preventDefault(); scrollTo('#hero') }}>
            <span className="logo-lk">LK</span>
            <span className="logo-sub">Langkah Baru</span>
          </a>
          <ul className="nav-links">
            {[['#about','Tentang Kami'],['#services','Paket'],['#process','Proses'],['#gallery','Galeri'],['#testimonials','Ulasan']].map(([href, label]) => (
              <li key={href}><a href={href} onClick={e => { e.preventDefault(); scrollTo(href) }}>{label}</a></li>
            ))}
          </ul>
          <button className="btn-primary nav-cta" onClick={() => openWa('Halo! Saya ingin konsultasi tentang layanan WCC Langkah Baru 😊')}>
            📲 Konsultasi Gratis
          </button>
          <button className={`hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        {[['#about','Tentang'],['#services','Paket'],['#process','Proses'],['#gallery','Galeri'],['#testimonials','Ulasan'],['#booking','Pesan']].map(([href, label]) => (
          <a key={href} href={href} onClick={e => { e.preventDefault(); scrollTo(href) }}>{label}</a>
        ))}
      </div>
    </>
  )
}
