import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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

function PhotoSlot({
  token,
  slot,
  label,
  description,
}: {
  token: string
  slot: string
  label: string
  description: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/images').then(r => r.json()).then(d => {
      if (d.success && d.data[slot]) setImgSrc(d.data[slot].image_data)
    }).catch(() => {})
  }, [slot])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setMsg({ type: 'err', text: 'File harus berupa gambar.' }); return }
    if (!token) { setMsg({ type: 'err', text: 'Sesi tidak ditemukan. Silakan login ulang.' }); return }
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
      setImgSrc(compressed)
      setMsg({ type: 'ok', text: 'Foto berhasil disimpan!' })
      setTimeout(() => setMsg(null), 2500)
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!token) { setMsg({ type: 'err', text: 'Sesi tidak ditemukan. Silakan login ulang.' }); return }
    setLoading(true); setMsg(null)
    try {
      const res = await fetch(`/api/admin/images/${slot}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setImgSrc(null)
      setMsg({ type: 'ok', text: 'Foto dihapus.' })
      setTimeout(() => setMsg(null), 2000)
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div
        className={`img-slot-preview${imgSrc ? ' has-image' : ''}`}
        style={{ width: 200, flexShrink: 0 }}
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        {imgSrc
          ? <img src={imgSrc} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
          : <div className="img-slot-empty"><span className="img-slot-icon">📷</span><span className="img-slot-hint">Klik atau drag foto</span></div>
        }
        {loading && <div className="img-slot-loading"><div className="img-slot-spinner" /></div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
        <p className="adm-muted adm-small" style={{ lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: description }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-refresh" style={{ padding: '7px 16px' }} onClick={() => inputRef.current?.click()} disabled={loading}>
            {imgSrc ? 'Ganti Foto' : 'Upload Foto'}
          </button>
          {imgSrc && <button className="adm-btn-danger-sm" onClick={handleDelete} disabled={loading}>Hapus</button>}
        </div>
        {msg && <div className={`adm-settings-msg ${msg.type}`} style={{ fontSize: 12, padding: '6px 12px' }}>{msg.text}</div>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
    </div>
  )
}


export default function AdminPengaturan() {
  const { user, session, signOut } = useAuth()
  const token = session?.access_token ?? ''

  const [pwForm, setPwForm] = useState({ next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  const adminName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
  const adminInitial = adminName.charAt(0).toUpperCase()

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: 'err', text: 'Konfirmasi password tidak cocok.' }); return }
    if (pwForm.next.length < 6) { setPwMsg({ type: 'err', text: 'Password minimal 6 karakter.' }); return }
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) throw error
      setPwMsg({ type: 'ok', text: 'Password berhasil diubah.' })
      setPwForm({ next: '', confirm: '' })
    } catch (err: unknown) {
      setPwMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal mengubah password.' })
    } finally {
      setPwLoading(false)
    }
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

        {/* Hero photo */}
        <div className="adm-settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="adm-settings-card-title">🖼️ Foto Hero (Kartu Visual Utama)</div>
          <PhotoSlot
            token={token}
            slot="hero-main"
            label="Foto Hero"
            description={`Foto ini tampil di <strong style="color:var(--white)">kartu visual</strong> pada section Hero halaman utama.<br />Gunakan foto portrait pernikahan untuk hasil terbaik. Format JPG/PNG, otomatis dikompres.`}
          />
        </div>

        {/* About photo */}
        <div className="adm-settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="adm-settings-card-title">📸 Foto Tentang Kami</div>
          <PhotoSlot
            token={token}
            slot="about-main"
            label="Foto Tentang Kami"
            description={`Foto ini tampil di section <strong style="color:var(--white)">"Tentang Kami"</strong> halaman utama.<br />Format JPG/PNG, otomatis dikompres.`}
          />
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
