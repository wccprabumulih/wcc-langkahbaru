import { useEffect } from 'react'

const WA_NUMBER = '6281532477237'

export default function Hero() {
  useEffect(() => {
    const orbs = document.querySelectorAll('.orb')
    const onScroll = () => {
      const y = window.scrollY
      orbs.forEach((orb, i) => {
        const speed = i === 0 ? 0.2 : i === 1 ? 0.15 : 0.1
        ;(orb as HTMLElement).style.transform = `translateY(${y * speed}px)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openWa = (msg: string) => {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const scrollTo = (id: string) => {
    const el = document.querySelector(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="hero" id="hero">
      <div className="hero-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="container">
        <div className="hero-content">
          <div className="hero-eyebrow">📍 Prabumulih, Sumatera Selatan</div>
          <h1 className="hero-title">
            <span className="line"><span>Abadikan</span></span>
            <span className="line"><span>Momen <span className="accent">Terindah</span></span></span>
            <span className="line"><span>Pernikahanmu</span></span>
          </h1>
          <p className="hero-sub">
            Layanan Wedding Content Creator profesional — dari raw footage hingga konten siap publish di Instagram &amp; TikTok. <em>Karena setiap momen layak dikenang.</em>
          </p>
          <div className="hero-actions">
            <a href="#services" className="btn-primary" onClick={e => { e.preventDefault(); scrollTo('#services') }}>✨ Lihat Paket</a>
            <button className="btn-outline" onClick={() => openWa('Halo kak, saya mau tanya-tanya tentang layanan WCC Langkah Baru dulu 😊')}>💬 Chat Sekarang</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-stack">
            <div className="hero-card hero-card-back2" />
            <div className="hero-card hero-card-back" />
            <div className="hero-card hero-card-main">
              <div className="card-logo">LK</div>
              <div className="card-brand">Langkah Baru</div>
              <div className="card-divider" />
              <div className="card-tagline">Wedding Content Creator</div>
            </div>
            <div className="hero-badge">
              <span className="badge-icon">🎬</span>
              <span className="badge-text">
                <strong>Cinematic Quality</strong>
                Capture • Edit • Post
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-scroll">
        <span>Scroll</span>
        <span className="arrow">↓</span>
      </div>
    </section>
  )
}
