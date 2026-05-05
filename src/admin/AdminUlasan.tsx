import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Review {
  id: number
  name: string
  rating: number
  comment: string
  visible: boolean
  created_at: string
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#f5a623', fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminUlasan() {
  const { session } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<number | null>(null)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviews', { headers })
      const data = await res.json()
      if (data.success) setReviews(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (review: Review) => {
    setToggling(review.id)
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}/visible`, { method: 'PUT', headers })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setReviews(rs => rs.map(r => r.id === review.id ? { ...r, visible: data.visible } : r))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status.')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (review: Review) => {
    if (!confirm(`Hapus ulasan dari "${review.name}"?`)) return
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setReviews(rs => rs.filter(r => r.id !== review.id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus.')
    }
  }

  const visible = reviews.filter(r => r.visible).length
  const hidden = reviews.filter(r => !r.visible).length

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Ulasan</h2>
        <button className="adm-refresh" onClick={load}>↻ Refresh</button>
      </div>

      <div className="adm-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="adm-stat">
          <div className="adm-stat-num">{reviews.length}</div>
          <div className="adm-stat-label">Total Ulasan</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-num" style={{ color: '#7ed321' }}>{visible}</div>
          <div className="adm-stat-label">Ditampilkan</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-num" style={{ color: '#f5a623' }}>{hidden}</div>
          <div className="adm-stat-label">Disembunyikan</div>
        </div>
      </div>

      {loading ? (
        <div className="adm-empty">Memuat ulasan...</div>
      ) : reviews.length === 0 ? (
        <div className="adm-empty">
          Belum ada ulasan yang masuk. Ulasan dari pengunjung akan muncul di sini.
        </div>
      ) : (
        <div className="adm-ulasan-list">
          {reviews.map(r => (
            <div key={r.id} className={`adm-ulasan-card${r.visible ? '' : ' adm-ulasan-hidden'}`}>
              <div className="adm-ulasan-top">
                <div className="adm-ulasan-info">
                  <div className="adm-ulasan-nama">{r.name}</div>
                  <div className="adm-ulasan-meta">
                    <Stars rating={r.rating} />
                    <span className="adm-muted adm-small">· {formatDate(r.created_at)}</span>
                  </div>
                </div>
                <div className="adm-ulasan-right">
                  <span className={`adm-status-badge ${r.visible ? 'adm-status-confirmed' : 'adm-status-pending'}`}>
                    {r.visible ? '👁 Ditampilkan' : '🙈 Tersembunyi'}
                  </span>
                </div>
              </div>

              <p className="adm-ulasan-komentar">"{r.comment}"</p>

              <div className="adm-ulasan-actions">
                <button
                  className="adm-refresh"
                  onClick={() => handleToggle(r)}
                  disabled={toggling === r.id}
                >
                  {toggling === r.id ? '...' : r.visible ? 'Sembunyikan' : 'Tampilkan'}
                </button>
                <button className="adm-btn-danger-sm" onClick={() => handleDelete(r)}>
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="adm-paket-note" style={{ marginTop: 8 }}>
        <span>
          Ulasan baru masuk dalam status <strong style={{ color: '#f5a623' }}>tersembunyi</strong> secara default.
          Klik <strong>"Tampilkan"</strong> untuk menayangkannya di website.
        </span>
      </div>
    </>
  )
}
