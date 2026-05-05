import { useEffect, useState } from 'react'

interface Review {
  id: number
  name: string
  rating: number
  comment: string
  created_at: string
}

const FALLBACK = [
  { id: -1, name: 'Desy & Rio', rating: 5, comment: 'Hasilnya diluar ekspektasi! Reels wedding kita langsung viral, banyak banget yang minta kontak WCC Langkah Baru. Sangat recommended!', created_at: '' },
  { id: -2, name: 'Ulfa & Bayu', rating: 5, comment: 'Pelayanan ramah, hasil editing cepat dan estetik banget. Story Instagram kita dapet banyak DM yang nanya siapa content creatornya!', created_at: '' },
  { id: -3, name: 'Krisna & Puput', rating: 5, comment: 'Harga terjangkau tapi kualitasnya premium! Video cinematic yang dibuat benar-benar membuat kita terharu waktu menontonnya. Terima kasih WCC!', created_at: '' },
]

function Stars({ rating, interactive, onRate }: { rating: number; interactive?: boolean; onRate?: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <span className={interactive ? 'testi-star-input' : 'testi-stars-display'}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            color: n <= (interactive ? (hovered || rating) : rating) ? '#f5a623' : 'rgba(255,255,255,0.15)',
            fontSize: interactive ? 28 : 14,
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

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const [form, setForm] = useState({ name: '', comment: '', rating: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(d => { if (d.success) setReviews(d.data) })
      .catch(() => {})
      .finally(() => setLoadingReviews(false))
  }, [])

  const displayReviews = reviews.length > 0 ? reviews : FALLBACK

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
    } catch (err: unknown) {
      setSubmitMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal mengirim.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="testimonials-header">
          <div className="section-tag">Ulasan Klien</div>
          <h2 className="section-title">Kata Mereka <span>Tentang Kami</span></h2>
        </div>

        {/* Review cards */}
        {loadingReviews ? null : (
          <div className="testi-grid">
            {displayReviews.map((r, i) => (
              <div key={r.id} className="testi-card reveal" style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="testi-stars-display" style={{ marginBottom: 12 }}>
                  {'★'.repeat(r.rating)}<span style={{ color: 'rgba(255,255,255,0.12)' }}>{'★'.repeat(5 - r.rating)}</span>
                </div>
                <p className="testi-quote">"{r.comment}"</p>
                <div className="testi-author">
                  <div className="testi-avatar">{r.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="testi-name">{r.name}</div>
                    {r.created_at && (
                      <div className="testi-meta">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit review form */}
        <div className="testi-form-wrap">
          <div className="testi-form-label">Bagikan Pengalamanmu</div>
          {submitted ? (
            <div className="testi-form-thanks">
              <span style={{ fontSize: 28 }}>🙏</span>
              <div>
                <strong>Terima kasih atas ulasanmu!</strong>
                <p>Ulasanmu sedang kami review dan akan ditampilkan setelah disetujui.</p>
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
    </section>
  )
}
