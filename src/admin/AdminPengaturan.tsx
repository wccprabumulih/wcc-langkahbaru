import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const GALLERY_SLOTS = [
  { key: 'gallery-1', label: 'Cinematic Reel' },
  { key: 'gallery-2', label: 'Akad Nikah' },
  { key: 'gallery-3', label: 'Moment Resepsi' },
  { key: 'gallery-4', label: 'Instagram Story' },
  { key: 'gallery-5', label: 'Pre-Wedding' },
  { key: 'gallery-6', label: 'Highlight Video' },
  { key: 'gallery-7', label: 'Fashion Shoot' },
  { key: 'gallery-8', label: 'Sacred Moments' },
]

interface ImageMap { [slot: string]: { image_data: string; label: string } }

function compressImage(file: File, maxW = 1200, quality = 0.82): Promise<string> {
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
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function ImageSlot({
  slot, label, imageData, token,
  onSaved, onDeleted,
}: {
  slot: string
  label: string
  imageData: string | null
  token: string
  onSaved: (slot: string, data: string) => void
  onDeleted: (slot: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMsg({ type: 'err', text: 'File harus berupa gambar.' })
      return
    }
    setLoading(true); setMsg(null)
    try {
      const compressed = await compressImage(file)
      const res = await fetch(`/api/admin/images/${slot}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image_data: compressed, label }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      onSaved(slot, compressed)
      setMsg({ type: 'ok', text: 'Tersimpan!' })
      setTimeout(() => setMsg(null), 2000)
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true); setMsg(null)
    try {
      const res = await fetch(`/api/admin/images/${slot}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      onDeleted(slot)
      setMsg({ type: 'ok', text: 'Dihapus!' })
      setTimeout(() => setMsg(null), 2000)
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="img-slot">
      <div
        className={`img-slot-preview${imageData ? ' has-image' : ''}`}
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        {imageData ? (
          <img src={imageData} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
        ) : (
          <div className="img-slot-empty">
            <span className="img-slot-icon">📷</span>
            <span className="img-slot-hint">Klik atau drag foto</span>
          </div>
        )}
        {loading && (
          <div className="img-slot-loading">
            <div className="img-slot-spinner" />
          </div>
        )}
      </div>
      <div className="img-slot-footer">
        <span className="img-slot-label">{label}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="adm-refresh" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => inputRef.current?.click()} disabled={loading}>
            {imageData ? 'Ganti' : 'Upload'}
          </button>
          {imageData && (
            <button className="adm-btn-danger-sm" style={{ padding: '4px 10px', fontSize: 11 }} onClick={handleDelete} disabled={loading}>
              Hapus
            </button>
          )}
        </div>
      </div>
      {msg && <div className={`adm-settings-msg ${msg.type}`} style={{ marginTop: 4, fontSize: 11, padding: '6px 10px' }}>{msg.text}</div>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
    </div>
  )
}

export default function AdminPengaturan() {
  const { user, signOut } = useAuth()
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)
  const [images, setImages] = useState<ImageMap>({})
  const [token, setToken] = useState('')

  const adminName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
  const adminInitial = adminName.charAt(0).toUpperCase()

  useEffect(() => {
    fetch('/api/images').then(r => r.json()).then(d => { if (d.success) setImages(d.data) }).catch(() => {})
  }, [])

  useEffect(() => {
    import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.access_token) setToken(data.session.access_token)
      })
    })
  }, [])

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: 'err', text: 'Konfirmasi password tidak cocok.' }); return }
    if (pwForm.next.length < 6) { setPwMsg({ type: 'err', text: 'Password minimal 6 karakter.' }); return }
    setPwLoading(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) throw error
      setPwMsg({ type: 'ok', text: 'Password berhasil diubah.' })
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err: unknown) {
      setPwMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal mengubah password.' })
    } finally {
      setPwLoading(false)
    }
  }

  const handleSaved = (slot: string, data: string) => {
    setImages(prev => ({ ...prev, [slot]: { image_data: data, label: '' } }))
  }
  const handleDeleted = (slot: string) => {
    setImages(prev => { const next = { ...prev }; delete next[slot]; return next })
  }

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Pengaturan</h2>
      </div>

      <div className="adm-settings-grid">

        {/* Profile card */}
        <div className="adm-settings-card">
          <div className="adm-settings-card-title">Profil Admin</div>
          <div className="adm-profile-display">
            <div className="adm-avatar adm-avatar-lg">{adminInitial}</div>
            <div>
              <div className="adm-user-name" style={{ fontSize: 15 }}>{adminName}</div>
              <div className="adm-user-email" style={{ fontSize: 13, marginTop: 4 }}>{user?.email}</div>
              <span className="adm-role-badge admin" style={{ marginTop: 8, display: 'inline-block' }}>Admin</span>
            </div>
          </div>
          <div className="adm-settings-divider" />
          <div className="adm-settings-row">
            <span className="adm-settings-label">ID Akun</span>
            <span className="adm-muted adm-small" style={{ fontFamily: 'monospace' }}>{user?.id?.slice(0, 16)}…</span>
          </div>
          <div className="adm-settings-row">
            <span className="adm-settings-label">Login terakhir</span>
            <span className="adm-muted adm-small">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('id-ID') : '—'}
            </span>
          </div>
        </div>

        {/* Change password card */}
        <div className="adm-settings-card">
          <div className="adm-settings-card-title">Ubah Password</div>
          <form className="adm-settings-form" onSubmit={handleChangePw}>
            <label className="adm-settings-field">
              <span>Password Baru</span>
              <input type="password" className="adm-input" placeholder="Minimal 6 karakter" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required />
            </label>
            <label className="adm-settings-field">
              <span>Konfirmasi Password</span>
              <input type="password" className="adm-input" placeholder="Ulangi password baru" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
            </label>
            {pwMsg && <div className={`adm-settings-msg ${pwMsg.type}`}>{pwMsg.text}</div>}
            <button type="submit" className="adm-refresh" disabled={pwLoading} style={{ width: '100%', padding: '10px' }}>
              {pwLoading ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </form>
        </div>

        {/* Photo — About */}
        <div className="adm-settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="adm-settings-card-title">📸 Foto Tentang Kami</div>
          <p className="adm-muted adm-small" style={{ marginBottom: 16 }}>
            Foto ini tampil di section "Tentang Kami" halaman utama. Format JPG/PNG, otomatis dikompres.
          </p>
          <div style={{ maxWidth: 260 }}>
            <ImageSlot
              slot="about-main"
              label="Foto Tentang Kami"
              imageData={images['about-main']?.image_data ?? null}
              token={token}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          </div>
        </div>

        {/* Photo — Gallery */}
        <div className="adm-settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="adm-settings-card-title">🖼️ Foto Galeri (8 Slot)</div>
          <p className="adm-muted adm-small" style={{ marginBottom: 20 }}>
            Foto-foto ini tampil di section Galeri yang berjalan otomatis. Klik slot untuk upload, drag & drop juga didukung.
          </p>
          <div className="img-slots-grid">
            {GALLERY_SLOTS.map(s => (
              <ImageSlot
                key={s.key}
                slot={s.key}
                label={s.label}
                imageData={images[s.key]?.image_data ?? null}
                token={token}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="adm-settings-card adm-settings-danger">
          <div className="adm-settings-card-title" style={{ color: '#ff7070' }}>Zona Berbahaya</div>
          <p className="adm-muted adm-small" style={{ marginBottom: 16 }}>
            Tindakan ini tidak dapat dibatalkan. Pastikan kamu yakin sebelum melanjutkan.
          </p>
          <button className="adm-signout" onClick={() => signOut()} style={{ maxWidth: 200 }}>
            Keluar dari Akun
          </button>
        </div>

      </div>
    </>
  )
}
