import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

interface Review {
  id: number
  name: string
  rating: number
  comment: string
  created_at: string
}

function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)
    return () => {
      document.title = 'WCC Langkah Baru – Wedding Content Creator Prabumulih'
      if (meta) meta.setAttribute('content', 'WCC Langkah Baru - Wedding Content Creator Prabumulih. Abadikan momen pernikahanmu dengan cinematic dan profesional.')
    }
  }, [])
}

function Stars({ rating, interactive, onRate }: { rating: number; interactive?: boolean; onRate?: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <span>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            color: n <= (interactive ? (hovered || rating) : rating) ? '#f5a623' : 'rgba(255,255,255,0.15)',
            fontSize: interactive ? 28 : 15,
            transition: 'color 0.15s',
          }}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate && onRate(n)}
        >★</span>
      ))}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Ulasan() {
  usePageMeta(
    'Ulasan Pelanggan – WCC Langkah Baru | Wedding Content Creator Prabumulih',
    'Baca ulasan dan testimoni nyata dari pelanggan WCC Langkah Baru. Wedding Content Creator terpercaya di Prabumulih, Sumatera Selatan.'
  )
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ name: '', comment: '', rating: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const loadReviews = () => {
    setLoading(true)
    fetch('/api/reviews')
      .then(r => r.json())
      .then(d => { if (d.success) setReviews(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReviews()
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.rating) { setSubmitMsg({ type: 'err', text: 'Pilih dulu rating bintangnya ya!' }); return }
    setSubmitting(true)
    setSubmitMsg(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setSubmitMsg({ type: 'ok', text: data.message })
      setSubmitted(true)
      setForm({ name: '', comment: '', rating: 0 })
      loadReviews()
    } catch (err: unknown) {
      setSubmitMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal mengirim.' })
    } finally {
      setSubmitting(false)
    }
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="ulasan-page">
      <Navbar />

      <div className="ulasan-page-hero">
        <div className="container">
          <button className="ulasan-back" onClick={() => navigate('/')}>
            ← Kembali
          </button>
          <div className="section-tag" style={{ justifyContent: 'flex-start' }}>Ulasan Klien</div>
          <h1 className="ulasan-page-title">Kata Mereka <span>Tentang Kami</span></h1>
          {avg && (
            <div className="ulasan-page-summary">
              <span className="ulasan-avg-score">{avg}</span>
              <div>
                <Stars rating={Math.round(Number(avg))} />
                <div className="ulasan-avg-count">{reviews.length} ulasan</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container ulasan-page-body">

        {/* Reviews grid */}
        {loading ? (
          <div className="adm-empty" style={{ color: 'var(--white-muted)', padding: '60px 0' }}>Memuat ulasan...</div>
        ) : reviews.length === 0 ? (
          <div className="adm-empty" style={{ padding: '60px 0' }}>Belum ada ulasan. Jadilah yang pertama!</div>
        ) : (
          <div className="testi-grid ulasan-page-grid">
            {reviews.map((r, i) => (
              <div key={r.id} className="testi-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div style={{ marginBottom: 12 }}>
                  <Stars rating={r.rating} />
                </div>
                <p className="testi-quote">"{r.comment}"</p>
                <div className="testi-author">
                  <div className="testi-avatar" style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="testi-name">{r.name}</div>
                    <div className="testi-meta">{formatDate(r.created_at)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit form */}
        <div className="testi-form-wrap" style={{ marginTop: 80 }}>
          <div className="testi-form-label">Bagikan Pengalamanmu</div>
          {submitted ? (
            <div className="testi-form-thanks">
              <span style={{ fontSize: 28 }}>🙏</span>
              <div>
                <strong>Terima kasih atas ulasanmu!</strong>
                <p>Ulasanmu sudah langsung tampil di halaman ini.</p>
              </div>
            </div>
          ) : (
            <form className="testi-form" onSubmit={handleSubmit}>
              <div className="testi-form-row">
                <label className="testi-form-field">
                  <span className="testi-form-flabel">Nama kamu</span>
                  <input
                    className="testi-form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Contoh: Andi & Rini"
                    required
                    maxLength={80}
                  />
                </label>
                <label className="testi-form-field testi-form-field--rating">
                  <span className="testi-form-flabel">Rating</span>
                  <Stars rating={form.rating} interactive onRate={n => setForm(f => ({ ...f, rating: n }))} />
                </label>
              </div>
              <label className="testi-form-field">
                <span className="testi-form-flabel">Ceritakan pengalamanmu</span>
                <textarea
                  className="testi-form-input testi-form-textarea"
                  value={form.comment}
                  onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Bagaimana kesan kamu dengan layanan WCC Langkah Baru?"
                  required
                  rows={3}
                  maxLength={500}
                />
              </label>
              {submitMsg && (
                <div className={`testi-form-msg testi-form-msg--${submitMsg.type}`}>{submitMsg.text}</div>
              )}
              <button type="submit" className="testi-form-btn" disabled={submitting}>
                {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
