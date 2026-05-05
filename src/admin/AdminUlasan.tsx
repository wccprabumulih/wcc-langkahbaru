import { useState } from 'react'

const dummyUlasan = [
  { id: 1, nama: 'Rizky & Farah', paket: 'Gold', rating: 5, komentar: 'Hasilnya luar biasa! Tim sangat profesional dan ramah. Video highlight kami membuat semua tamu menangis terharu.', tanggal: '2025-03-15', status: 'published' },
  { id: 2, nama: 'Budi & Sari', paket: 'Premium', rating: 5, komentar: 'Drone footage-nya amazing banget. Sudah rekomendasiin ke semua teman yang mau nikah.', tanggal: '2025-04-02', status: 'published' },
  { id: 3, nama: 'Andi & Maya', paket: 'Silver', rating: 4, komentar: 'Hasil foto dan video bagus, pengiriman tepat waktu. Puas dengan pelayanannya!', tanggal: '2025-04-20', status: 'published' },
  { id: 4, nama: 'Dimas & Rini', paket: 'Gold', rating: 5, komentar: 'Best investment for our wedding! The team captured every precious moment perfectly.', tanggal: '2025-05-01', status: 'pending' },
]

export default function AdminUlasan() {
  const [ulasan] = useState(dummyUlasan)

  const published = ulasan.filter(u => u.status === 'published').length
  const pending = ulasan.filter(u => u.status === 'pending').length

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Ulasan</h2>
        <div className="adm-ulasan-coming">
          <span className="adm-coming-badge">Preview Data</span>
        </div>
      </div>

      <div className="adm-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="adm-stat">
          <div className="adm-stat-num">{ulasan.length}</div>
          <div className="adm-stat-label">Total Ulasan</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-num" style={{ color: '#7ed321' }}>{published}</div>
          <div className="adm-stat-label">Ditampilkan</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-num" style={{ color: '#f5a623' }}>{pending}</div>
          <div className="adm-stat-label">Menunggu</div>
        </div>
      </div>

      <div className="adm-ulasan-list">
        {ulasan.map(u => (
          <div key={u.id} className="adm-ulasan-card">
            <div className="adm-ulasan-top">
              <div className="adm-ulasan-info">
                <div className="adm-ulasan-nama">{u.nama}</div>
                <div className="adm-ulasan-meta">
                  <span className={`pkg-${u.paket.toLowerCase()}`}>{u.paket}</span>
                  <span className="adm-muted adm-small">• {u.tanggal}</span>
                </div>
              </div>
              <div className="adm-ulasan-right">
                <div className="adm-ulasan-stars">{'★'.repeat(u.rating)}{'☆'.repeat(5 - u.rating)}</div>
                <span className={`adm-status-badge adm-status-${u.status === 'published' ? 'confirmed' : 'pending'}`}>
                  {u.status === 'published' ? 'Ditampilkan' : 'Menunggu'}
                </span>
              </div>
            </div>
            <p className="adm-ulasan-komentar">"{u.komentar}"</p>
            <div className="adm-ulasan-actions">
              {u.status === 'pending' && (
                <button className="adm-refresh">Tampilkan</button>
              )}
              <button className="adm-btn-danger-sm">Hapus</button>
            </div>
          </div>
        ))}
      </div>

      <div className="adm-paket-note">
        <span>ℹ</span>
        <span>Fitur manajemen ulasan dari pelanggan nyata akan segera tersedia. Data di atas adalah preview tampilan.</span>
      </div>
    </>
  )
}
