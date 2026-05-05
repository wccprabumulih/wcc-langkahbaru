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
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/partners')
      .then(r => r.json())
      .then(d => { if (d.success) setPartners(d.data) })
      .catch(() => {})
  }, [])

  if (partners.length === 0) return null

  const doubled = [...partners, ...partners]

  return (
    <section className="partners-section reveal" id="partners">
      <div className="container">
        <div className="partners-header">
          <div className="partners-eyebrow">Ekosistem Wedding Terbaik</div>
          <h2 className="partners-title">Dipercaya Bersama</h2>
          <p className="partners-sub">
            Kami berkolaborasi dengan vendor &amp; mitra terpilih untuk menghadirkan pernikahan yang sempurna.
          </p>
        </div>
      </div>

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
