import { useCallback, useEffect, useState } from 'react'

const WA_NUMBER = '6281532477237'

interface Package {
  id: number
  key: string
  label: string
  price: string
  price_note: string
  badge: string
  popular: boolean
  features: string[]
  wa_msg: string
  cta_class: string
}

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
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.json())
      .then(data => { if (data.success) setPackages(data.data) })
      .finally(() => setLoading(false))
  }, [])

  const handleOrder = useCallback((pkg: Package, e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e.currentTarget, e)
    if (pkg.wa_msg) {
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(pkg.wa_msg)}`, '_blank')
      return
    }
    const select = document.querySelector<HTMLSelectElement>('[name="paket"]')
    if (select) {
      select.value = pkg.key
      select.dispatchEvent(new Event('change'))
      select.style.borderColor = 'var(--teal)'
      select.style.boxShadow = '0 0 0 3px var(--teal-dim)'
      setTimeout(() => { select.style.borderColor = ''; select.style.boxShadow = '' }, 1500)
    }
    const booking = document.getElementById('booking')
    if (booking) booking.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (loading) {
    return (
      <section className="services" id="services">
        <div className="container">
          <div className="services-header">
            <div className="section-tag">Paket Layanan</div>
            <h2 className="section-title">Pilih Paket <span>Terbaikmu</span></h2>
          </div>
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--white-muted)' }}>Memuat paket...</div>
        </div>
      </section>
    )
  }

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
            <div key={pkg.id} className={`service-card ${pkg.key} reveal`} style={{ transitionDelay: `${i * 0.1}s` }}>
              {pkg.popular && <div className="most-popular">Terpopuler</div>}
              <div className="card-badge">{pkg.badge}</div>
              <div className="card-price">{pkg.price}</div>
              <div className="card-price-period">{pkg.price_note}</div>
              <div className="card-divider" />
              <ul className="card-features">
                {pkg.features.map((f, j) => (
                  <li key={j} className="card-feature">
                    <span className="check">✓</span>
                    <span dangerouslySetInnerHTML={{ __html: f }} />
                  </li>
                ))}
              </ul>
              <button className={`card-cta${pkg.cta_class === 'btn-outline' ? ' outline' : ''}`} onClick={e => handleOrder(pkg, e)}>
                Pesan Paket Ini →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
