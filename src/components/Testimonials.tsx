import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Review {
  id: number
  name: string
  rating: number
  comment: string
  created_at: string
}

const FALLBACK: Review[] = [
  { id: -1, name: 'Desy & Rio', rating: 5, comment: 'Hasilnya diluar ekspektasi! Reels wedding kita langsung viral, banyak banget yang minta kontak WCC Langkah Baru. Sangat recommended!', created_at: '' },
  { id: -2, name: 'Ulfa & Bayu', rating: 5, comment: 'Pelayanan ramah, hasil editing cepat dan estetik banget. Story Instagram kita dapet banyak DM yang nanya siapa content creatornya!', created_at: '' },
  { id: -3, name: 'Krisna & Puput', rating: 5, comment: 'Harga terjangkau tapi kualitasnya premium! Video cinematic yang dibuat benar-benar membuat kita terharu waktu menontonnya. Terima kasih WCC!', created_at: '' },
  { id: -4, name: 'Andi & Rini', rating: 5, comment: 'Tim WCC sangat profesional dan sigap. Hasilnya jauh melebihi ekspektasi, semua momen terindah berhasil diabadikan dengan sempurna.', created_at: '' },
  { id: -5, name: 'Budi & Sari', rating: 5, comment: 'Kontennya viral di TikTok! Teman-teman pada nanya siapa WCC-nya. Recommended banget buat pasangan yang mau momen pernikahannya berkesan.', created_at: '' },
]

function Stars({ rating }: { rating: number }) {
  return (
    <span className="testi-stars-display">
      {'★'.repeat(rating)}
      <span style={{ color: 'rgba(255,255,255,0.12)' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function StarInput({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <span className="testi-star-input">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{
            cursor: 'pointer',
            color: n <= (hovered || rating) ? '#f5a623' : 'rgba(255,255,255,0.15)',
            fontSize: 28,
            transition: 'color 0.15s',
          }}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onRate(n)}
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
  const sectionRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(d => { if (d.success) setReviews(d.data) })
      .catch(() => {})
      .finally(() => setLoadingReviews(false))
  }, [])

  useEffect(() => {
    if (loadingReviews || !sectionRef.current) return
    const els = sectionRef.current.querySelectorAll<HTMLElement>('.reveal, .reveal-left, .reveal-right')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          setTimeout(() => el.classList.add('visible'), 0)
          observer.unobserve(el)
        }
      })
    }, { threshold: 0.12 })
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [loadingReviews])

  const displayReviews = reviews.length > 0 ? reviews : FALLBACK
  const trackItems = [...displayReviews, ...displayReviews]

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
    <section className="testimonials" id="testimonials" ref={sectionRef}>
      <div className="container">
        <div className="testimonials-header">
          <div className="section-tag">Ulasan Klien</div>
          <h2 className="section-title">Kata Mereka <span>Tentang Kami</span></h2>
        </div>
      </div>

      {!loadingReviews && (
        <>
          <div className="testi-track-wrap">
            <div className="testi-track">
              {trackItems.map((r, i) => (
                <div key={`${r.id}-${i}`} className="testi-card-scroll">
                  <div className="testi-stars-display" style={{ marginBottom: 12 }}>
                    <Stars rating={r.rating} />
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
          </div>

          {reviews.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button
                className="btn-outline"
                style={{ padding: '12px 36px', borderRadius: 50, fontSize: 14 }}
                onClick={() => navigate('/ulasan')}
              >
                Lihat Semua {reviews.length} Ulasan →
              </button>
            </div>
          )}
        </>
      )}

      <div className="container">
        <div className="testi-form-wrap reveal" style={{ marginTop: reviews.length > 0 ? 60 : 40 }}>
          <div className="testi-form-label">Bagikan Pengalamanmu</div>
          {submitted ? (
            <div className="testi-form-thanks">
              <span style={{ fontSize: 28 }}>🙏</span>
              <div>
                <strong>Terima kasih atas ulasanmu!</strong>
                <p>Ulasanmu sudah langsung tampil di halaman ulasan kami.</p>
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
                  <StarInput rating={form.rating} onRate={n => setForm(f => ({ ...f, rating: n }))} />
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
