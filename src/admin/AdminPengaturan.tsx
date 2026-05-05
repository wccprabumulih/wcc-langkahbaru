import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AdminPengaturan() {
  const { user, signOut } = useAuth()
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  const adminName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
  const adminInitial = adminName.charAt(0).toUpperCase()

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ type: 'err', text: 'Konfirmasi password tidak cocok.' })
      return
    }
    if (pwForm.next.length < 6) {
      setPwMsg({ type: 'err', text: 'Password minimal 6 karakter.' })
      return
    }
    setPwLoading(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
      )
      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) throw error
      setPwMsg({ type: 'ok', text: 'Password berhasil diubah.' })
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah password.'
      setPwMsg({ type: 'err', text: msg })
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
              <input
                type="password"
                className="adm-input"
                placeholder="Minimal 6 karakter"
                value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                required
              />
            </label>
            <label className="adm-settings-field">
              <span>Konfirmasi Password</span>
              <input
                type="password"
                className="adm-input"
                placeholder="Ulangi password baru"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                required
              />
            </label>
            {pwMsg && (
              <div className={`adm-settings-msg ${pwMsg.type}`}>{pwMsg.text}</div>
            )}
            <button type="submit" className="adm-refresh" disabled={pwLoading} style={{ width: '100%', padding: '10px' }}>
              {pwLoading ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </form>
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
