import { useEffect, useState } from 'react'

const SLOTS = [
  { key: 'gallery-1', icon: '🎥', label: 'Cinematic Reel' },
  { key: 'gallery-2', icon: '💍', label: 'Akad Nikah' },
  { key: 'gallery-3', icon: '🌸', label: 'Moment Resepsi' },
  { key: 'gallery-4', icon: '📱', label: 'Instagram Story' },
  { key: 'gallery-5', icon: '✨', label: 'Pre-Wedding' },
  { key: 'gallery-6', icon: '🎊', label: 'Highlight Video' },
  { key: 'gallery-7', icon: '👗', label: 'Fashion Shoot' },
  { key: 'gallery-8', icon: '🕊️', label: 'Sacred Moments' },
]

interface ImageMap {
  [slot: string]: { image_data: string; label: string }
}

export default function Gallery() {
  const [images, setImages] = useState<ImageMap>({})

  useEffect(() => {
    fetch('/api/images')
      .then(r => r.json())
      .then(d => { if (d.success) setImages(d.data) })
      .catch(() => {})
  }, [])

  const items = [...SLOTS, ...SLOTS]

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
          {items.map((item, i) => {
            const img = images[item.key]
            return (
              <div key={i} className="gallery-item">
                {img ? (
                  <img
                    src={img.image_data}
                    alt={img.label || item.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div className="gallery-item-inner">
                    <div className="gi-icon">{item.icon}</div>
                    <div className="gi-label">{item.label}</div>
                  </div>
                )}
                <div className="gallery-overlay" />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
