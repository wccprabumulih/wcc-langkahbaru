import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

interface Photo { id: number; image_src: string; created_at: string }

export default function Galeri() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const navigate = useNavigate()
  const LIMIT = 24
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

  // Keyboard navigation for lightbox
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

  // Lock scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  const hasMore = photos.length < total

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.image_src}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
          />
          <button style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 44, height: 44, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightbox(null)}>✕</button>
          {/* Prev */}
          {photos.findIndex(p => p.id === lightbox.id) > 0 && (
            <button style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 44, height: 44, color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={e => { e.stopPropagation(); const idx = photos.findIndex(p => p.id === lightbox.id); if (idx > 0) setLightbox(photos[idx - 1]) }}>‹</button>
          )}
          {/* Next */}
          {photos.findIndex(p => p.id === lightbox.id) < photos.length - 1 && (
            <button style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 44, height: 44, color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={e => { e.stopPropagation(); const idx = photos.findIndex(p => p.id === lightbox.id); if (idx < photos.length - 1) setLightbox(photos[idx + 1]) }}>›</button>
          )}
        </div>
      )}

      <Navbar />

      <main style={{ minHeight: '100vh', paddingTop: 120, paddingBottom: 80, background: 'var(--bg-deep)' }}>
        <div className="container">

          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: 'var(--white-muted)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--white)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--white-muted)')}
            >
              ← Kembali ke Beranda
            </button>
            <div className="section-tag">Portofolio</div>
            <h1 className="section-title" style={{ marginTop: 12 }}>Galeri <span>Karya Kami</span></h1>
            <p className="section-desc" style={{ marginTop: 12 }}>
              {total > 0 ? `${total} foto karya terbaik WCC Langkah Baru` : 'Koleksi karya wedding content creator kami'}
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="galeri-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: '3/4', borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'skeleton-pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && photos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--white-muted)' }}>
              <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.3 }}>📷</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--white)' }}>Galeri masih kosong</div>
              <p style={{ fontSize: 14 }}>Foto-foto karya akan segera hadir di sini.</p>
            </div>
          )}

          {/* Photo grid */}
          {!loading && photos.length > 0 && (
            <div className="galeri-grid">
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="galeri-item"
                  style={{ animationDelay: `${(i % LIMIT) * 0.03}s` }}
                  onClick={() => setLightbox(photo)}
                >
                  <img src={photo.image_src} alt="" className="galeri-img" loading="lazy" />
                  <div className="galeri-item-overlay">
                    <span style={{ fontSize: 24 }}>🔍</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && (
            <div style={{ textAlign: 'center', marginTop: 48 }} ref={bottomRef}>
              <button
                className="btn-outline"
                style={{ padding: '14px 40px', fontSize: 14 }}
                onClick={() => fetchPhotos(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Memuat...' : `Muat Lebih Banyak (${total - photos.length} foto lagi)`}
              </button>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
