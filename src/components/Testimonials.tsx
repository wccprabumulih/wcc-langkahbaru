const testimonials = [
  {
    avatar: '👰',
    quote: '"Hasilnya diluar ekspektasi! Reels wedding kita langsung viral, banyak banget yang minta kontak WCC Langkah Baru. Sangat recommended!"',
    name: 'Desy & Rio',
    meta: 'Gold Package • Prabumulih',
  },
  {
    avatar: '💍',
    quote: '"Pelayanan ramah, hasil editing cepat dan estetik banget. Story Instagram kita dapet banyak DM yang nanya siapa content creatornya!"',
    name: 'Ulfa & Bayu',
    meta: 'Premium Package • Desa marga mulia',
  },
  {
    avatar: '🎊',
    quote: '"Harga terjangkau tapi kualitasnya premium! Video cinematic yang dibuat benar-benar membuat kita terharu waktu menontonnya. Terima kasih WCC!"',
    name: 'Krisna & Puput',
    meta: 'Premium Package • Prabumulih',
  },
]

export default function Testimonials() {
  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="testimonials-header">
          <div className="section-tag">Ulasan Klien</div>
          <h2 className="section-title">Kata Mereka <span>Tentang Kami</span></h2>
        </div>
        <div className="testi-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="testi-card reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="testi-stars">★★★★★</div>
              <p className="testi-quote">{t.quote}</p>
              <div className="testi-author">
                <div className="testi-avatar">{t.avatar}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-meta">{t.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
