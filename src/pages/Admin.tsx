import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Order {
  id: number
  nama: string
  whatsapp: string
  tanggal: string
  lokasi: string
  paket: string
  catatan: string
  status: string
  created_at: string
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

type Page = 'orders' | 'users'

const paketLabel: Record<string, string> = { silver: 'Silver', gold: 'Gold', premium: 'Premium' }
const paketClass: Record<string, string> = { silver: 'pkg-silver', gold: 'pkg-gold', premium: 'pkg-premium' }
const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function formatDate(s: string) {
  if (!s) return '-'
  const d = new Date(s)
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}
function formatDateTime(s: string) {
  if (!s) return '-'
  const d = new Date(s)
  return `${formatDate(s)} ${d.toTimeString().slice(0,5)}`
}

export default function Admin() {
  const { user, signOut, session } = useAuth()
  const navigate = useNavigate()

  const [page, setPage] = useState<Page>('orders')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(true)

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const getAuthHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  })

  const loadOrders = async (status = '') => {
    setLoadingOrders(true)
    try {
      const url = status ? `/api/orders?status=${status}` : '/api/orders'
      const res = await fetch(url, { headers: getAuthHeader() })
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } finally {
      setLoadingOrders(false)
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/admin/users', { headers: getAuthHeader() })
      const data = await res.json()
      if (data.success) setUsers(data.data)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => { loadOrders() }, [])
  useEffect(() => { if (page === 'users') loadUsers() }, [page])

  const handleFilter = (f: string) => { setFilter(f); loadOrders(f) }

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) loadOrders(filter)
  }

  const updateUserRole = async (id: string, role: string) => {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ role }),
    })
    const data = await res.json()
    if (data.success) loadUsers()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const total = orders.length
  const pending = orders.filter(o => o.status === 'pending').length
  const confirmed = orders.filter(o => o.status === 'confirmed').length
  const done = orders.filter(o => o.status === 'done').length

  const adminName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'
  const adminInitial = adminName.charAt(0).toUpperCase()

  const navItems: { key: Page; icon: string; label: string }[] = [
    { key: 'orders', icon: '📋', label: 'Pesanan' },
    { key: 'users',  icon: '👥', label: 'Pengguna' },
  ]

  return (
    <div className="adm-layout">

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="adm-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="adm-sidebar-logo">
          <span className="logo-lk">LK</span>
          <div>
            <div className="adm-sidebar-brand">Langkah Baru</div>
            <div className="adm-sidebar-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="adm-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`adm-nav-item${page === item.key ? ' active' : ''}`}
              onClick={() => { setPage(item.key); setSidebarOpen(false) }}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <Link to="/" className="adm-back-link">
            ← Kembali ke Website
          </Link>
          <div className="adm-user-row">
            <div className="adm-avatar">{adminInitial}</div>
            <div className="adm-user-info">
              <div className="adm-user-name">{adminName}</div>
              <div className="adm-user-email">{user?.email}</div>
            </div>
          </div>
          <button className="adm-signout" onClick={handleSignOut}>
            Keluar
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="adm-main">

        {/* Topbar (mobile hamburger) */}
        <div className="adm-topbar">
          <button className="adm-menu-btn" onClick={() => setSidebarOpen(o => !o)}>
            <span /><span /><span />
          </button>
          <span className="adm-topbar-title">
            {page === 'orders' ? 'Pesanan' : 'Pengguna'}
          </span>
        </div>

        <div className="adm-content">

          {/* ── ORDERS PAGE ── */}
          {page === 'orders' && (
            <>
              <div className="adm-page-header">
                <h2 className="adm-page-title">Pesanan</h2>
                <button className="adm-refresh" onClick={() => loadOrders(filter)}>Refresh</button>
              </div>

              <div className="adm-stats">
                {([['Total', total], ['Pending', pending], ['Confirmed', confirmed], ['Selesai', done]] as [string, number][]).map(([label, num]) => (
                  <div key={label} className="adm-stat">
                    <div className="adm-stat-num">{num}</div>
                    <div className="adm-stat-label">{label}</div>
                  </div>
                ))}
              </div>

              <div className="adm-filters">
                {([['', 'Semua'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['done', 'Selesai']] as [string, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    className={`adm-filter${filter === val ? ' active' : ''}`}
                    onClick={() => handleFilter(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="adm-table-wrap">
                {loadingOrders ? (
                  <div className="adm-empty">Memuat data...</div>
                ) : orders.length === 0 ? (
                  <div className="adm-empty">Belum ada pesanan.</div>
                ) : (
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nama</th>
                        <th>WhatsApp</th>
                        <th>Tanggal</th>
                        <th>Lokasi</th>
                        <th>Paket</th>
                        <th>Catatan</th>
                        <th>Status</th>
                        <th>Dipesan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td className="adm-muted">#{o.id}</td>
                          <td><strong>{o.nama}</strong></td>
                          <td>
                            <a
                              className="adm-wa-link"
                              href={`https://wa.me/${o.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Halo ' + o.nama + '! Konfirmasi pesanan WCC Langkah Baru')}`}
                              target="_blank" rel="noreferrer"
                            >
                              {o.whatsapp}
                            </a>
                          </td>
                          <td>{formatDate(o.tanggal)}</td>
                          <td>{o.lokasi}</td>
                          <td className={paketClass[o.paket] || ''}>{paketLabel[o.paket] || o.paket}</td>
                          <td className="adm-muted adm-clamp">
                            {o.catatan ? (o.catatan.length > 50 ? o.catatan.slice(0,50) + '…' : o.catatan) : '-'}
                          </td>
                          <td>
                            <select className="adm-select" value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="done">Selesai</option>
                            </select>
                          </td>
                          <td className="adm-muted adm-small">{formatDateTime(o.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── USERS PAGE ── */}
          {page === 'users' && (
            <>
              <div className="adm-page-header">
                <h2 className="adm-page-title">Pengguna</h2>
                <button className="adm-refresh" onClick={loadUsers}>Refresh</button>
              </div>

              <div className="adm-table-wrap">
                {loadingUsers ? (
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
          )}

        </div>
      </div>
    </div>
  )
}
