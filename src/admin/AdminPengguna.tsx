import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UserProfile, formatDate, formatDateTime } from './types'

export default function AdminPengguna() {
  const { user, session } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<UserProfile | null>(null)
  const [roleChanging, setRoleChanging] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { headers })
      const data = await res.json()
      if (data.success) setUsers(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const openDetail = (u: UserProfile) => {
    setSelected({ ...u })
    setMsg(null)
  }

  const closeDetail = () => { setSelected(null); setMsg(null) }

  const handleRoleChange = async (newRole: string) => {
    if (!selected) return
    setRoleChanging(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${selected.id}/role`, {
        method: 'POST', headers, body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setSelected(s => s ? { ...s, role: newRole } : s)
      setUsers(us => us.map(u => u.id === selected.id ? { ...u, role: newRole } : u))
      setMsg({ type: 'ok', text: `Role diubah ke ${newRole === 'admin' ? 'Admin' : 'User'}` })
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal mengubah role' })
    } finally {
      setRoleChanging(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!confirm(`Hapus pengguna "${selected.full_name || selected.email}"?\n\nAksi ini tidak bisa dibatalkan.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${selected.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setUsers(us => us.filter(u => u.id !== selected.id))
      closeDetail()
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal menghapus pengguna' })
    } finally {
      setDeleting(false)
    }
  }

  const isSelf = selected?.id === user?.id

  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Pengguna</h2>
        <button className="adm-refresh" onClick={loadUsers}>↻ Refresh</button>
      </div>

      <div className="adm-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="adm-stat">
          <div className="adm-stat-num">{users.length}</div>
          <div className="adm-stat-label">Total Pengguna</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-num" style={{ color: 'var(--teal)' }}>{adminCount}</div>
          <div className="adm-stat-label">Admin</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-num">{users.length - adminCount}</div>
          <div className="adm-stat-label">User Biasa</div>
        </div>
      </div>

      <div className="adm-table-wrap">
        {loading ? (
          <div className="adm-empty">Memuat data...</div>
        ) : users.length === 0 ? (
          <div className="adm-empty">Belum ada pengguna.</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Email</th>
                <th>Role</th>
                <th>Terdaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const initial = (u.full_name || u.email || '?').charAt(0).toUpperCase()
                const isSelfRow = u.id === user?.id
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="adm-user-cell">
                        <div className={`adm-avatar adm-avatar-sm${u.role === 'admin' ? ' adm-avatar-admin' : ''}`}>
                          {initial}
                        </div>
                        <span>
                          {u.full_name || '—'}
                          {isSelfRow && <span className="adm-self-tag">kamu</span>}
                        </span>
                      </div>
                    </td>
                    <td className="adm-muted adm-small">{u.email}</td>
                    <td>
                      <span className={`adm-role-badge${u.role === 'admin' ? ' admin' : ''}`}>
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="adm-muted adm-small">{formatDate(u.created_at)}</td>
                    <td>
                      <button className="adm-refresh" onClick={() => openDetail(u)}>
                        Detail
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeDetail() }}>
          <div className="adm-modal" style={{ maxWidth: 480 }}>

            <div className="adm-modal-header">
              <h3>Detail Pengguna</h3>
              <button className="adm-modal-close" onClick={closeDetail}>✕</button>
            </div>

            <div className="adm-modal-body" style={{ gap: 0 }}>

              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div
                  className={`adm-avatar${selected.role === 'admin' ? ' adm-avatar-admin' : ''}`}
                  style={{ width: 52, height: 52, fontSize: '1.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,212,184,0.12)', border: '1px solid rgba(0,212,184,0.2)', fontWeight: 700, flexShrink: 0 }}
                >
                  {(selected.full_name || selected.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--white)' }}>
                    {selected.full_name || '(no name)'}
                    {isSelf && <span className="adm-self-tag" style={{ marginLeft: 8 }}>kamu</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--white-muted)', marginTop: 3 }}>{selected.email}</div>
                </div>
              </div>

              {/* Info rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid var(--border)' }}>
                {[
                  { label: 'User ID', value: <code style={{ fontSize: 11, color: 'var(--white-muted)', wordBreak: 'break-all' }}>{selected.id}</code> },
                  { label: 'Email', value: selected.email },
                  { label: 'Terdaftar', value: formatDateTime(selected.created_at) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--white-muted)', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: 'var(--white)', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}

                {/* Role row with inline change */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--white-muted)' }}>Role</span>
                  {isSelf ? (
                    <span className={`adm-role-badge${selected.role === 'admin' ? ' admin' : ''}`}>
                      {selected.role === 'admin' ? 'Admin' : 'User'} (kamu)
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleRoleChange('user')}
                        disabled={roleChanging || selected.role === 'user'}
                        style={{
                          padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid var(--border)',
                          background: selected.role === 'user' ? 'rgba(255,255,255,0.08)' : 'transparent',
                          color: selected.role === 'user' ? 'var(--white)' : 'var(--white-muted)',
                          fontFamily: 'var(--font-body)', fontWeight: selected.role === 'user' ? 600 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        User
                      </button>
                      <button
                        onClick={() => handleRoleChange('admin')}
                        disabled={roleChanging || selected.role === 'admin'}
                        style={{
                          padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                          border: `1px solid ${selected.role === 'admin' ? 'rgba(0,212,184,0.4)' : 'var(--border)'}`,
                          background: selected.role === 'admin' ? 'rgba(0,212,184,0.12)' : 'transparent',
                          color: selected.role === 'admin' ? 'var(--teal)' : 'var(--white-muted)',
                          fontFamily: 'var(--font-body)', fontWeight: selected.role === 'admin' ? 600 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        Admin
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {msg && (
                <div className={`adm-settings-msg ${msg.type}`} style={{ margin: '16px 0 0' }}>
                  {msg.type === 'ok' ? '✓ ' : '⚠ '}{msg.text}
                </div>
              )}
            </div>

            <div className="adm-modal-footer" style={{ justifyContent: 'space-between' }}>
              {!isSelf ? (
                <button
                  className="adm-btn-danger-sm"
                  style={{ padding: '8px 18px', fontSize: 12 }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Menghapus...' : 'Hapus Pengguna'}
                </button>
              ) : <span />}
              <button className="adm-btn-cancel" onClick={closeDetail}>Tutup</button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
