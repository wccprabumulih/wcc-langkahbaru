const WA_NUMBER = '6281532477237'

export default function Footer() {
  const openWa = (msg: string) => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')

  const scrollTo = (id: string) => {
    const el = document.querySelector(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <footer id="contact">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="nav-logo">
              <span className="logo-lk">LK</span>
              <span className="logo-sub">Langkah Baru</span>
            </div>
            <p>Wedding Content Creator profesional di Prabumulih. Mengabadikan setiap momen pernikahan dengan cinta dan kreativitas.</p>
            <div className="footer-social">
              <a className="social-link" href="https://instagram.com/wcc.prabumulih" target="_blank" rel="noreferrer" title="Instagram">📸</a>
              <a className="social-link" href="#" onClick={e => { e.preventDefault(); openWa('Halo WCC Langkah Baru! 👋') }} title="WhatsApp">💬</a>
              <a className="social-link" href="https://www.tiktok.com" target="_blank" rel="noreferrer" title="TikTok">🎵</a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Layanan</h4>
            <ul>
              {['Silver Package','Gold Package','Premium Package'].map(p => (
                <li key={p}><a href="#services" onClick={e => { e.preventDefault(); scrollTo('#services') }}>{p}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Navigasi</h4>
            <ul>
              {[['#about','Tentang Kami'],['#process','Cara Kerja'],['#gallery','Galeri'],['#testimonials','Ulasan'],['#booking','Pesan Sekarang']].map(([href, label]) => (
                <li key={href}><a href={href} onClick={e => { e.preventDefault(); scrollTo(href) }}>{label}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Kontak</h4>
            <ul>
              <li><a href="#" onClick={e => { e.preventDefault(); openWa('Halo! Saya mau bertanya tentang WCC 😊') }}>📱 0815-3247-7237</a></li>
              <li><a href="https://instagram.com/wcc.prabumulih" target="_blank" rel="noreferrer">📸 @wcc.prabumulih</a></li>
              <li><a href="#">📍 Prabumulih, Sumsel</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2024 WCC Langkah Baru. Dibuat dengan ❤️ untuk setiap pasangan.</span>
          <span>by <a href="#">@dhkpngsttt_</a></span>
        </div>
      </div>
    </footer>
  )
}
