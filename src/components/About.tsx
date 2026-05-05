import { useEffect, useState } from 'react'

interface Feature {
  icon: string
  title: string
  desc: string
}

interface AboutContent {
  heading: string
  heading_highlight: string
  desc1: string
  desc2: string
  instagram: string
  availability: string
  features: Feature[]
}

const DEFAULT: AboutContent = {
  heading: 'Kami Bukan Sekadar',
  heading_highlight: 'Merekam',
  desc1: 'WCC Langkah Baru adalah layanan Wedding Content Creator yang hadir untuk mengabadikan hari istimewamu dengan sentuhan sinematik yang memukau. Setiap frame kami rancang dengan penuh rasa.',
  desc2: 'Dari story Instagram yang captivating hingga reels yang viral-worthy — kami pastikan momen pernikahanmu terdokumentasi dan siap dibagikan ke dunia.',
  instagram: '@wcc.prabumulih',
  availability: 'By Request 🗓️',
  features: [
    { icon: '🎬', title: 'Videografi Sinematik', desc: 'Setiap momen direkam dengan gaya cinematic yang elegan dan berkelas' },
    { icon: '✂️', title: 'Editing Profesional', desc: 'Hasil editing yang halus, estetik, dan siap tayang dalam waktu singkat' },
    { icon: '📲', title: 'Siap Posting', desc: 'Konten langsung bisa di-upload ke Instagram/TikTok' },
    { icon: '☁️', title: 'Video Mentah via Google Drive', desc: 'Semua footage mentah dikirimkan lewat Google Drive untuk koleksi pribadimu' },
  ],
}

export default function About() {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [content, setContent] = useState<AboutContent>(DEFAULT)

  useEffect(() => {
    Promise.all([
      fetch('/api/content/about').then(r => r.json()).catch(() => null),
      fetch('/api/images').then(r => r.json()).catch(() => null),
    ]).then(([aboutData, imgData]) => {
      if (aboutData?.success) setContent(aboutData.data)
      if (imgData?.success && imgData.data['about-main']) setImgSrc(imgData.data['about-main'].image_data)
    })
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
            <div className="ac-value">{content.instagram}</div>
          </div>
          <div className="about-accent-card2">
            <div className="ac-label">Tersedia</div>
            <div className="ac-value">{content.availability}</div>
          </div>
        </div>
        <div className="about-content reveal-right">
          <div className="section-tag">Tentang Kami</div>
          <h2 className="section-title">
            {content.heading} <span>{content.heading_highlight}</span>
          </h2>
          <p className="section-desc">{content.desc1}</p>
          <p className="section-desc" style={{ marginTop: 12 }}>{content.desc2}</p>
          <div className="about-features">
            {content.features.map((f, i) => (
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
