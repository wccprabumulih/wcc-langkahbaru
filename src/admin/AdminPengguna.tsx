import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UserProfile, formatDate } from './types'

export default function AdminPengguna() {
  const { user, session } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

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

  const updateUserRole = async (id: string, role: string) => {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    if (data.success) loadUsers()
  }

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Pengguna</h2>
        <button className="adm-refresh" onClick={loadUsers}>Refresh</button>
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
                <th>Ubah Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const initial = (u.full_name || u.email || '?').charAt(0).toUpperCase()
                const isSelf = u.id === user?.id
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="adm-user-cell">
                        <div className={`adm-avatar adm-avatar-sm${u.role === 'admin' ? ' adm-avatar-admin' : ''}`}>
                          {initial}
                        </div>
                        <span>
                          {u.full_name || '—'}
                          {isSelf && <span className="adm-self-tag">kamu</span>}
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
                      {isSelf ? (
                        <span className="adm-muted">—</span>
                      ) : (
                        <select className="adm-select" value={u.role} onChange={e => updateUserRole(u.id, e.target.value)}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
