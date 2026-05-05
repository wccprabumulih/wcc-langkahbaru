import { useEffect, useRef, useState } from 'react'

interface Partner {
  id: number
  name: string
  category: string | null
  logo_data: string | null
  website_url: string | null
}

export default function Partners() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/partners')
      .then(r => r.json())
      .then(d => { if (d.success) setPartners(d.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const doubled = partners.length > 0 ? [...partners, ...partners] : []

  return (
    <section
      ref={sectionRef}
      className={`partners-section${visible ? ' partners-visible' : ''}`}
      id="partners"
    >
      <div className="container">
        <div className="partners-header">
          <div className="partners-eyebrow">Mitra Kami</div>
          <h2 className="partners-title">Dipercaya Bersama</h2>
          <p className="partners-sub">
            Didukung oleh mitra &amp; platform terpilih yang kami percaya.
          </p>
        </div>
      </div>

      {partners.length === 0 ? (
        <div className="partners-empty">
          <div className="partners-empty-row">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="partner-card partner-card-ghost" />
            ))}
          </div>
          <p className="partners-empty-hint">Partner akan tampil di sini setelah ditambahkan dari admin panel.</p>
        </div>
      ) : (
        <div className="partners-ticker-wrap">
          <div className="partners-ticker-fade partners-ticker-fade-left" />
          <div className="partners-ticker-fade partners-ticker-fade-right" />
          <div className="partners-ticker" ref={trackRef}>
            <div className="partners-track">
              {doubled.map((p, i) => (
                <PartnerCard key={`${p.id}-${i}`} partner={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function PartnerCard({ partner }: { partner: Partner }) {
  const inner = (
    <div className="partner-card">
      <div className="partner-card-inner">
        {partner.logo_data ? (
          <img src={partner.logo_data} alt={partner.name} className="partner-logo" />
        ) : (
          <div className="partner-logo-placeholder">
            {partner.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="partner-info">
        <div className="partner-name">{partner.name}</div>
        {partner.category && <div className="partner-category">{partner.category}</div>}
      </div>
    </div>
  )

  if (partner.website_url) {
    return (
      <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="partner-card-wrap">
        {inner}
      </a>
    )
  }
  return <div className="partner-card-wrap">{inner}</div>
}
