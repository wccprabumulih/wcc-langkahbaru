export default function AdminPaket() {
  const pakets = [
    {
      key: 'silver',
      label: 'Silver',
      price: 'Rp 1.500.000',
      color: '#a0aec0',
      icon: '🥈',
      features: [
        'Durasi 4 jam dokumentasi',
        '1 Videografer & 1 Fotografer',
        'Highlight video 3–5 menit',
        '100 foto edited',
        'Delivered dalam 14 hari',
      ],
    },
    {
      key: 'gold',
      label: 'Gold',
      price: 'Rp 2.800.000',
      color: 'var(--gold)',
      icon: '🥇',
      badge: 'Terpopuler',
      features: [
        'Durasi 8 jam dokumentasi',
        '2 Videografer & 2 Fotografer',
        'Highlight video 5–8 menit',
        '200 foto edited',
        'Same-day edit teaser',
        'Delivered dalam 10 hari',
      ],
    },
    {
      key: 'premium',
      label: 'Premium',
      price: 'Rp 4.500.000',
      color: 'var(--teal)',
      icon: '👑',
      features: [
        'Full day dokumentasi',
        '3 Videografer & 3 Fotografer',
        'Cinematic film 10–15 menit',
        'Unlimited foto edited',
        'Same-day edit teaser',
        'Drone footage',
        'Delivered dalam 7 hari',
      ],
    },
  ]

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Paket</h2>
        <span className="adm-muted adm-small">Informasi paket layanan</span>
      </div>

      <div className="adm-paket-grid">
        {pakets.map(p => (
          <div key={p.key} className="adm-paket-card" style={{ borderColor: p.color + '40' }}>
            <div className="adm-paket-top">
              <span className="adm-paket-icon">{p.icon}</span>
              {p.badge && (
                <span className="adm-paket-badge">{p.badge}</span>
              )}
            </div>
            <div className="adm-paket-name" style={{ color: p.color }}>{p.label}</div>
            <div className="adm-paket-price">{p.price}</div>
            <div className="adm-paket-divider" />
            <ul className="adm-paket-features">
              {p.features.map(f => (
                <li key={f}>
                  <span className="adm-paket-check" style={{ color: p.color }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="adm-paket-note">
        <span>ℹ</span>
        <span>Untuk mengubah harga atau fitur paket, hubungi pengembang atau edit langsung di halaman publik.</span>
      </div>
    </>
  )
}
