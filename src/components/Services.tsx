import { useCallback } from 'react'

const WA_NUMBER = '6281532477237'

const packages = [
  {
    id: 'silver', badge: '🥈 Silver', price: '250K',
    features: [
      'Up 6 Story Instagram yang estetik',
      'Editing Video Story dalam <24 Jam',
      '1 Reels Instagram atau TikTok',
      'Video Mentah dikirim via Google Drive',
    ],
    waMsg: 'Halo kak! Saya tertarik dengan Silver Package (250K). Bisa info lebih lanjut? 🥈',
    ctaClass: 'btn-outline',
  },
  {
    id: 'gold', badge: '🥇 Gold', price: '300K', popular: true,
    features: [
      'Up 8 Story Instagram premium',
      'Editing Video Story dalam <24 Jam',
      '1 Video Cinematic minimal 1 Menit',
      '1-2 Reels Instagram atau TikTok',
      'Video Mentah dikirim via Google Drive',
    ],
    waMsg: 'Halo kak! Saya tertarik dengan Gold Package (300K). Bisa info lebih lanjut? 🥇',
    ctaClass: 'btn-primary',
  },
  {
    id: 'premium', badge: '💎 Premium', price: '400K',
    features: [
      'Up 12 Story Instagram full coverage',
      'Editing Video Story dalam <24 Jam',
      '2 Video Cinematic minimal 1 Menit',
      '2-4 Reels Instagram atau TikTok',
      'Video Mentah dikirim via Google Drive',
    ],
    waMsg: 'Halo kak! Saya tertarik dengan Premium Package (400K). Bisa info lebih lanjut? 💎',
    ctaClass: 'btn-primary',
  },
]

function createRipple(el: HTMLElement, e: React.MouseEvent) {
  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  const ripple = document.createElement('span')
  Object.assign(ripple.style, {
    position: 'absolute', borderRadius: '50%',
    width: size + 'px', height: size + 'px',
    left: x + 'px', top: y + 'px',
    background: 'rgba(255,255,255,0.2)',
    transform: 'scale(0)',
    animation: 'ripple-anim 0.6s ease-out forwards',
    pointerEvents: 'none',
  })
  el.style.position = 'relative'
  el.style.overflow = 'hidden'
  el.appendChild(ripple)
  setTimeout(() => ripple.remove(), 700)
}

export default function Services() {
  const handleOrder = useCallback((pkg: typeof packages[0], e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e.currentTarget, e)
    // Set booking form package
    const select = document.querySelector<HTMLSelectElement>('[name="paket"]')
    if (select) {
      select.value = pkg.id
      select.dispatchEvent(new Event('change'))
      select.style.borderColor = 'var(--teal)'
      select.style.boxShadow = '0 0 0 3px var(--teal-dim)'
      setTimeout(() => { select.style.borderColor = ''; select.style.boxShadow = '' }, 1500)
    }
    const booking = document.getElementById('booking')
    if (booking) booking.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <section className="services" id="services">
      <div className="container">
        <div className="services-header">
          <div className="section-tag">Paket Layanan</div>
          <h2 className="section-title">Pilih Paket <span>Terbaikmu</span></h2>
          <p className="section-desc" style={{ margin: '16px auto 0', textAlign: 'center' }}>
            Setiap paket dirancang untuk memenuhi kebutuhanmu. Dari yang simple hingga premium — semua tersedia!
          </p>
        </div>
        <div className="services-grid">
          {packages.map((pkg, i) => (
            <div key={pkg.id} className={`service-card ${pkg.id} reveal`} style={{ transitionDelay: `${i * 0.1}s` }}>
              {pkg.popular && <div className="most-popular">Terpopuler</div>}
              <div className="card-badge">{pkg.badge}</div>
              <div className="card-price">{pkg.price}</div>
              <div className="card-price-period">per hari acara</div>
              <div className="card-divider" />
              <ul className="card-features">
                {pkg.features.map((f, j) => (
                  <li key={j} className="card-feature">
                    <span className="check">✓</span>
                    <span dangerouslySetInnerHTML={{ __html: f }} />
                  </li>
                ))}
              </ul>
              <button className="card-cta" onClick={e => handleOrder(pkg, e)}>
                Pesan Paket Ini →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
