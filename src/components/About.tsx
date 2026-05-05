import { useEffect, useState } from 'react'

const features = [
  { icon: '🎬', title: 'Videografi Sinematik', desc: 'Setiap momen direkam dengan gaya cinematic yang elegan dan berkelas' },
  { icon: '✂️', title: 'Editing Profesional', desc: 'Hasil editing yang halus, estetik, dan siap tayang dalam waktu singkat' },
  { icon: '📲', title: 'Siap Posting', desc: 'Konten langsung bisa di-upload ke Instagram/TikTok' },
  { icon: '☁️', title: 'Video Mentah via Google Drive', desc: 'Semua footage mentah dikirimkan lewat Google Drive untuk koleksi pribadimu' },
]

export default function About() {
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/images')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data['about-main']) {
          setImgSrc(d.data['about-main'].image_data)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <section className="about" id="about">
      <div className="container">
        <div className="about-visual reveal-left">
          <div className="about-img-frame">
            {imgSrc ? (
              <img src={imgSrc} alt="WCC Langkah Baru" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20 }} />
            ) : (
              <div className="about-img-placeholder">📸</div>
            )}
          </div>
          <div className="about-accent-card">
            <div className="ac-label">Instagram</div>
            <div className="ac-value">@wcc.prabumulih</div>
          </div>
          <div className="about-accent-card2">
            <div className="ac-label">Tersedia</div>
            <div className="ac-value">By Request 🗓️</div>
          </div>
        </div>
        <div className="about-content reveal-right">
          <div className="section-tag">Tentang Kami</div>
          <h2 className="section-title">Kami Bukan Sekadar <span>Merekam</span></h2>
          <p className="section-desc">
            WCC Langkah Baru adalah layanan Wedding Content Creator yang hadir untuk mengabadikan hari istimewamu dengan sentuhan sinematik yang memukau. Setiap frame kami rancang dengan penuh rasa.
          </p>
          <p className="section-desc" style={{ marginTop: 12 }}>
            Dari story Instagram yang captivating hingga reels yang viral-worthy — kami pastikan momen pernikahanmu terdokumentasi dan siap dibagikan ke dunia.
          </p>
          <div className="about-features">
            {features.map((f, i) => (
              <div key={i} className="about-feature">
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-text">
                  <strong>{f.title}</strong>
                  <span>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
