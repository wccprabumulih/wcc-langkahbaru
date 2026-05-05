import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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

type Tab = 'orders' | 'users'

const paketLabel: Record<string, string> = { silver: '🥈 Silver', gold: '🥇 Gold', premium: '💎 Premium' }
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

  const [tab, setTab] = useState<Tab>('orders')

  // Orders state
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(true)

  // Users state
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
    } catch {
      console.error('Gagal memuat orders')
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
    } catch {
      console.error('Gagal memuat users')
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => { loadOrders() }, [])
  useEffect(() => { if (tab === 'users') loadUsers() }, [tab])

  const handleFilter = (f: string) => { setFilter(f); loadOrders(f) }

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!data.success) alert('Gagal: ' + data.message)
      else loadOrders(filter)
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  const updateUserRole = async (id: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!data.success) alert('Gagal: ' + data.message)
      else loadUsers()
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
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

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard — WCC <span>Langkah Baru</span></h1>
          <p style={{ fontSize: 13, color: 'var(--white-muted)', marginTop: 4 }}>
            Selamat datang, <strong style={{ color: 'var(--teal)' }}>{adminName}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--white-muted)' }}>← Website</Link>
          <button onClick={handleSignOut} style={{
            background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)',
            color: '#ff7070', borderRadius: 50, padding: '8px 16px',
            fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--teal)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
              {adminInitial}
            </div>
            Keluar
          </button>
        </div>
      </div>

      {/* Role Badge */}
      <div style={{ padding: '0 32px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{
          background: 'linear-gradient(135deg, var(--gold), #a07828)',
          color: '#000', fontSize: 10, fontWeight: 800, letterSpacing: '2px',
          padding: '3px 10px', borderRadius: 50, textTransform: 'uppercase'
        }}>⚙ Admin</span>
        <span style={{ fontSize: 12, color: 'var(--white-muted)' }}>{user?.email}</span>
      </div>

      {/* Tabs */}
      <div className="admin-main">
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 24 }}>
          {(['orders', 'users'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, transition: 'all 0.25s',
              background: tab === t ? 'var(--teal)' : 'transparent',
              color: tab === t ? '#000' : 'var(--white-muted)',
            }}>
              {t === 'orders' ? '📋 Pesanan' : '👥 Pengguna'}
            </button>
          ))}
        </div>

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <>
            <div className="stats-row">
              {[['Total Pesanan', total, '📋'], ['Pending', pending, '⏳'], ['Confirmed', confirmed, '✅'], ['Done', done, '🎉']].map(([label, num, icon]) => (
                <div key={label as string} className="stat-box">
                  <div className="num">{icon} {num}</div>
                  <div className="lbl">{label}</div>
                </div>
              ))}
            </div>

            <div className="filters">
              {[['', 'Semua'], ['pending', '⏳ Pending'], ['confirmed', '✅ Confirmed'], ['done', '🎉 Done']].map(([val, label]) => (
                <button key={val} className={`filter-btn${filter === val ? ' active' : ''}`} onClick={() => handleFilter(val)}>
                  {label}
                </button>
              ))}
            </div>

            <div className="table-wrap">
              {loadingOrders ? (
                <div className="admin-loading">⏳ Memuat data pesanan...</div>
              ) : orders.length === 0 ? (
                <div className="admin-empty">📭 Belum ada pesanan untuk filter ini.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Nama</th><th>WhatsApp</th><th>Tanggal Acara</th>
                      <th>Lokasi</th><th>Paket</th><th>Catatan</th><th>Status</th><th>Dipesan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={{ color: 'var(--white-muted)' }}>#{o.id}</td>
                        <td><strong>{o.nama}</strong></td>
                        <td>
                          <a className="wa-link"
                            href={`https://wa.me/${o.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Halo ' + o.nama + '! Konfirmasi pesanan WCC Langkah Baru ✅')}`}
                            target="_blank" rel="noreferrer">{o.whatsapp}</a>
                        </td>
                        <td>{formatDate(o.tanggal)}</td>
                        <td>{o.lokasi}</td>
                        <td className={paketClass[o.paket] || ''}>{paketLabel[o.paket] || o.paket}</td>
                        <td style={{ color: 'var(--white-muted)', maxWidth: 160 }}>
                          {o.catatan ? (o.catatan.length > 60 ? o.catatan.substring(0,60) + '…' : o.catatan) : '-'}
                        </td>
                        <td>
                          <select className="status-sel" value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                            <option value="pending">⏳ Pending</option>
                            <option value="confirmed">✅ Confirmed</option>
                            <option value="done">🎉 Done</option>
                          </select>
                        </td>
                        <td style={{ color: 'var(--white-muted)', fontSize: 12 }}>{formatDateTime(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="table-wrap">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--white-muted)' }}>
                Total {users.length} pengguna terdaftar
              </div>
              <button onClick={loadUsers} style={{
                background: 'var(--teal-dim)', border: '1px solid var(--border-teal)',
                color: 'var(--teal)', borderRadius: 8, padding: '6px 14px',
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)'
              }}>🔄 Refresh</button>
            </div>

            {loadingUsers ? (
              <div className="admin-loading">⏳ Memuat data pengguna...</div>
            ) : users.length === 0 ? (
              <div className="admin-empty">📭 Belum ada pengguna terdaftar.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Pengguna</th><th>Email</th><th>Role</th><th>Terdaftar</th><th>Ubah Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const initial = (u.full_name || u.email || '?').charAt(0).toUpperCase()
                    const isSelf = u.id === user?.id
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: u.role === 'admin' ? 'linear-gradient(135deg, var(--gold), #a07828)' : 'var(--teal)',
                              color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 900, flexShrink: 0
                            }}>{initial}</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>
                                {u.full_name || '—'}
                                {isSelf && <span style={{ fontSize: 10, color: 'var(--teal)', marginLeft: 6 }}>(Kamu)</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--white-muted)' }}>{u.email}</td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 700, letterSpacing: '1px',
                            padding: '3px 10px', borderRadius: 50, textTransform: 'uppercase',
                            background: u.role === 'admin' ? 'linear-gradient(135deg, var(--gold), #a07828)' : 'var(--teal-dim)',
                            color: u.role === 'admin' ? '#000' : 'var(--teal)',
                            border: u.role === 'admin' ? 'none' : '1px solid var(--border-teal)',
                          }}>
                            {u.role === 'admin' ? '⚙ Admin' : '👤 User'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--white-muted)' }}>{formatDate(u.created_at)}</td>
                        <td>
                          {isSelf ? (
                            <span style={{ fontSize: 11, color: 'var(--white-muted)' }}>—</span>
                          ) : (
                            <select
                              className="status-sel"
                              value={u.role}
                              onChange={e => updateUserRole(u.id, e.target.value)}
                            >
                              <option value="user">👤 User</option>
                              <option value="admin">⚙ Admin</option>
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
        )}
      </div>
    </div>
  )
}
