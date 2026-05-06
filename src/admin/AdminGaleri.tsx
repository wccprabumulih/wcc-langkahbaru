import { useEffect, useRef, useState } from 'react'
import { authFetch } from '../lib/authFetch'

interface Photo { id: number; image_src: string; created_at: string }

function compressImage(file: File, maxW = 1400, quality = 0.80): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AdminGaleri() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const LIMIT = 24

  const fetchPhotos = async (p = 1, append = false) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/gallery?page=${p}&limit=${LIMIT}`)
      const data = await res.json()
      if (data.success) {
        setPhotos(prev => append ? [...prev, ...data.data] : data.data)
        setTotal(data.total)
        setPage(p)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPhotos(1) }, [])

  const handleFiles = async (files: FileList) => {
    if (!files.length) return
    setUploading(true); setMsg(null); setUploadProgress(0)
    const total = files.length
    const compressed: string[] = []
    for (let i = 0; i < total; i++) {
      try {
        compressed.push(await compressImage(files[i]))
        setUploadProgress(Math.round(((i + 1) / total) * 50))
      } catch { /* skip bad files */ }
    }
    try {
      const res = await authFetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: compressed }),
      })
      setUploadProgress(100)
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setMsg({ type: 'ok', text: `${compressed.length} foto berhasil diupload!` })
      fetchPhotos(1)
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Upload gagal.' })
    } finally {
      setUploading(false); setUploadProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus foto ini?')) return
    setDeletingId(id)
    try {
      const res = await authFetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setPhotos(prev => prev.filter(p => p.id !== id))
      setTotal(t => t - 1)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus.')
    } finally {
      setDeletingId(null)
    }
  }

  const hasMore = photos.length < total

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer' }} onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}

      <div className="adm-page-header">
        <div>
          <h2 className="adm-page-title">Galeri Foto</h2>
          <div className="adm-muted adm-small" style={{ marginTop: 4 }}>{total} foto tersimpan</div>
        </div>
        <button className="adm-btn-save" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? `Mengupload... ${uploadProgress}%` : '+ Upload Foto'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files) handleFiles(e.target.files) }}
      />

      {/* Upload progress bar */}
      {uploading && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 50, height: 6, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--teal)', borderRadius: 50, transition: 'width 0.3s ease' }} />
        </div>
      )}

      {/* Drop zone (when empty) */}
      {!loading && photos.length === 0 && (
        <div
          className="adm-galeri-dropzone"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files) }}
        >
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🖼️</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Belum ada foto</div>
          <div className="adm-muted adm-small">Klik tombol Upload atau drag & drop foto ke sini</div>
          <div className="adm-muted adm-small" style={{ marginTop: 4 }}>Mendukung JPG, PNG, WEBP — bisa multiple sekaligus</div>
        </div>
      )}

      {/* Drop zone overlay (when has photos) */}
      {photos.length > 0 && (
        <div
          className="adm-galeri-drop-strip"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files) }}
        >
          <span>📁 Drag & drop foto di sini untuk upload, atau klik</span>
        </div>
      )}

      {msg && (
        <div className={`adm-settings-msg ${msg.type}`} style={{ marginBottom: 20 }}>
          {msg.text}
        </div>
      )}

      {/* Photo grid */}
      <div className="adm-galeri-grid">
        {photos.map(photo => (
          <div key={photo.id} className="adm-galeri-item">
            <img
              src={photo.image_src}
              alt=""
              className="adm-galeri-img"
              onClick={() => setLightbox(photo.image_src)}
            />
            <div className="adm-galeri-overlay">
              <button className="adm-galeri-view" onClick={() => setLightbox(photo.image_src)}>🔍</button>
              <button
                className="adm-galeri-del"
                onClick={() => handleDelete(photo.id)}
                disabled={deletingId === photo.id}
              >
                {deletingId === photo.id ? '...' : '🗑'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--white-muted)' }}>Memuat...</div>
      )}

      {hasMore && !loading && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="adm-refresh" style={{ padding: '10px 28px' }} onClick={() => fetchPhotos(page + 1, true)}>
            Muat Lebih Banyak ({total - photos.length} lagi)
          </button>
        </div>
      )}
    </>
  )
}
