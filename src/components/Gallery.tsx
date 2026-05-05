const items = [
  { icon: '🎥', label: 'Cinematic Reel' },
  { icon: '💍', label: 'Akad Nikah' },
  { icon: '🌸', label: 'Moment Resepsi' },
  { icon: '📱', label: 'Instagram Story' },
  { icon: '✨', label: 'Pre-Wedding' },
  { icon: '🎊', label: 'Highlight Video' },
  { icon: '👗', label: 'Fashion Shoot' },
  { icon: '🕊️', label: 'Sacred Moments' },
]

const doubled = [...items, ...items]

export default function Gallery() {
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
          {doubled.map((item, i) => (
            <div key={i} className="gallery-item">
              <div className="gallery-item-inner">
                <div className="gi-icon">{item.icon}</div>
                <div className="gi-label">{item.label}</div>
              </div>
              <div className="gallery-overlay" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
