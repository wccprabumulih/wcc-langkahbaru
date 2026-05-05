import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface Photo { id: number; image_src: string; created_at: string }

// Bento pattern repeating every 7: big, tall, small, small, wide, small, small
function getBentoClass(i: number): string {
  const mod = i % 7
  if (mod === 0) return 'bento-big'
  if (mod === 1) return 'bento-tall'
  if (mod === 4) return 'bento-wide'
  return 'bento-small'
}

const SKELETON_PATTERN = [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6]

export default function Galeri() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const navigate = useNavigate()
  const LIMIT = 28
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchPhotos = async (p = 1, append = false) => {
    if (p === 1) setLoading(true); else setLoadingMore(true)
    try {
      const res = await fetch(`/api/gallery?page=${p}&limit=${LIMIT}`)
      const data = await res.json()
      if (data.success) {
        setPhotos(prev => append ? [...prev, ...data.data] : data.data)
        setTotal(data.total)
        setPage(p)
      }
    } finally {
      setLoading(false); setLoadingMore(false)
    }
  }

  useEffect(() => { fetchPhotos(1) }, [])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') {
        const idx = photos.findIndex(p => p.id === lightbox.id)
        if (idx < photos.length - 1) setLightbox(photos[idx + 1])
      }
      if (e.key === 'ArrowLeft') {
        const idx = photos.findIndex(p => p.id === lightbox.id)
        if (idx > 0) setLightbox(photos[idx - 1])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, photos])

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  const lightboxIdx = lightbox ? photos.findIndex(p => p.id === lightbox.id) : -1
  const hasMore = photos.length < total

  return (
    <>
      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightbox && (
        <div className="glb-backdrop" onClick={() => setLightbox(null)}>
          <button className="glb-close" onClick={() => setLightbox(null)}>✕</button>

          {lightboxIdx > 0 && (
            <button className="glb-nav glb-prev"
              onClick={e => { e.stopPropagation(); setLightbox(photos[lightboxIdx - 1]) }}>‹</button>
          )}
          {lightboxIdx < photos.length - 1 && (
            <button className="glb-nav glb-next"
              onClick={e => { e.stopPropagation(); setLightbox(photos[lightboxIdx + 1]) }}>›</button>
          )}

          <img
            src={lightbox.image_src}
            alt=""
            className="glb-img"
            onClick={e => e.stopPropagation()}
          />

          <div className="glb-counter">
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}

      <Navbar />

      <main className="galeri-page">
        <div className="container">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="galeri-header">
            <button className="galeri-back" onClick={() => navigate('/')}>
              ← Kembali ke Beranda
            </button>
            <div className="section-tag">Portofolio</div>
            <h1 className="section-title" style={{ marginTop: 12 }}>
              Galeri <span>Karya Kami</span>
            </h1>
            <p className="section-desc" style={{ marginTop: 12 }}>
              {total > 0
                ? `${total} foto karya terbaik WCC Langkah Baru`
                : 'Koleksi karya wedding content creator kami'}
            </p>
          </div>

          {/* ── Skeleton loading ────────────────────────────────────────── */}
          {loading && (
            <div className="galeri-bento">
              {SKELETON_PATTERN.map((mod, i) => {
                let cls = 'bento-small'
                if (mod === 0) cls = 'bento-big'
                else if (mod === 1) cls = 'bento-tall'
                else if (mod === 4) cls = 'bento-wide'
                return (
                  <div key={i} className={`galeri-item ${cls} galeri-skeleton`}
                    style={{ animationDelay: `${i * 0.06}s` }} />
                )
              })}
            </div>
          )}

          {/* ── Empty state ─────────────────────────────────────────────── */}
          {!loading && photos.length === 0 && (
            <div className="galeri-empty">
              <div className="galeri-empty-icon">📷</div>
              <div className="galeri-empty-title">Galeri masih kosong</div>
              <p>Foto-foto karya akan segera hadir di sini.</p>
            </div>
          )}

          {/* ── Bento grid ──────────────────────────────────────────────── */}
          {!loading && photos.length > 0 && (
            <div className="galeri-bento">
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className={`galeri-item ${getBentoClass(i)}`}
                  style={{ animationDelay: `${(i % LIMIT) * 0.04}s` }}
                  onClick={() => setLightbox(photo)}
                >
                  <img src={photo.image_src} alt="" className="galeri-img" loading="lazy" />
                  <div className="galeri-item-overlay">
                    <div className="galeri-zoom-icon">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="8.5" cy="8.5" r="5.5" stroke="white" strokeWidth="1.8"/>
                        <path d="M13 13l4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                        <path d="M6 8.5h5M8.5 6v5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Load more ───────────────────────────────────────────────── */}
          {hasMore && !loading && (
            <div style={{ textAlign: 'center', marginTop: 56 }} ref={bottomRef}>
              <button
                className="btn-outline"
                style={{ padding: '14px 44px', fontSize: 14, borderRadius: 50 }}
                onClick={() => fetchPhotos(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Memuat...' : `Muat Lebih Banyak — ${total - photos.length} foto lagi`}
              </button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
