import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const FALLBACK = [
  { icon: '🎥', label: 'Cinematic Reel' },
  { icon: '💍', label: 'Akad Nikah' },
  { icon: '🌸', label: 'Moment Resepsi' },
  { icon: '📱', label: 'Instagram Story' },
  { icon: '✨', label: 'Pre-Wedding' },
  { icon: '🎊', label: 'Highlight Video' },
  { icon: '👗', label: 'Fashion Shoot' },
  { icon: '🕊️', label: 'Sacred Moments' },
]

interface Photo { id: number; image_src: string }

export default function Gallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/gallery?page=1&limit=16')
      .then(r => r.json())
      .then(d => { if (d.success) { setPhotos(d.data); setTotal(d.total) } })
      .catch(() => {})
  }, [])

  const hasRealPhotos = photos.length > 0

  // Build track items — real photos or fallback emoji cards
  const trackItems = hasRealPhotos
    ? [...photos, ...photos] // duplicate for seamless loop
    : [...FALLBACK, ...FALLBACK]

  return (
    <section className="gallery" id="gallery">
      <div className="container">
        <div className="gallery-header">
          <div className="section-tag" style={{ justifyContent: 'center', marginBottom: 16 }}>Galeri Karya</div>
          <h2 className="section-title"><span>Karya</span> Yang Bicara</h2>
          <p className="section-desc" style={{ margin: '16px auto 0', textAlign: 'center' }}>
            Setiap frame adalah cerita. Lihat karya-karya terbaik kami.
          </p>
        </div>
      </div>

      <div className="gallery-track-wrap">
        <div className="gallery-track">
          {hasRealPhotos
            ? trackItems.map((item, i) => {
                const p = item as Photo
                return (
                  <div key={i} className="gallery-item" onClick={() => navigate('/galeri')}>
                    <img src={p.image_src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div className="gallery-overlay" />
                  </div>
                )
              })
            : trackItems.map((item, i) => {
                const f = item as typeof FALLBACK[0]
                return (
                  <div key={i} className="gallery-item">
                    <div className="gallery-item-inner">
                      <div className="gi-icon">{f.icon}</div>
                      <div className="gi-label">{f.label}</div>
                    </div>
                    <div className="gallery-overlay" />
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* See all link */}
      {total > 0 && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            className="btn-outline"
            style={{ padding: '12px 36px', borderRadius: 50, fontSize: 14 }}
            onClick={() => navigate('/galeri')}
          >
            Lihat Semua {total} Foto →
          </button>
        </div>
      )}
    </section>
  )
}
