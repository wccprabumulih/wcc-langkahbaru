import { useEffect, useState } from 'react'
import { Order, UserProfile, formatDate, formatDateTime, paketLabel, paketClass } from './types'
import { authFetch } from '../lib/authFetch'

const shortcuts = [
  { key: 'pesanan',    label: 'Kelola Pesanan' },
  { key: 'pengguna',   label: 'Kelola Pengguna' },
  { key: 'paket',      label: 'Info Paket' },
  { key: 'ulasan',     label: 'Ulasan' },
  { key: 'pengaturan', label: 'Pengaturan' },
]

export default function AdminDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const h = { 'Content-Type': 'application/json' }
    Promise.all([
      authFetch('/api/orders', { headers: h }).then(r => r.json()),
      authFetch('/api/admin/users', { headers: h }).then(r => r.json()),
    ]).then(([ordersData, usersData]) => {
      if (ordersData.success) setOrders(ordersData.data)
      if (usersData.success) setUsers(usersData.data)
    }).finally(() => setLoading(false))
  }, [])

  const total = orders.length
  const pending = orders.filter(o => o.status === 'pending').length
  const confirmed = orders.filter(o => o.status === 'confirmed').length
  const done = orders.filter(o => o.status === 'done').length
  const recent = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const stats = [
    { label: 'Total Pesanan', value: total,         accent: 'var(--teal)' },
    { label: 'Menunggu',      value: pending,        accent: '#f5a623' },
    { label: 'Dikonfirmasi',  value: confirmed,      accent: '#7ed321' },
    { label: 'Selesai',       value: done,           accent: '#9b59b6' },
    { label: 'Total Pengguna',value: users.length,   accent: 'var(--gold)' },
  ]

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Dashboard</h2>
        {loading && <span className="adm-muted adm-small">Memuat...</span>}
      </div>

      <div className="adm-dash-stats">
        {stats.map(s => (
          <div key={s.label} className="adm-dash-stat" style={{ borderColor: s.accent + '30' }}>
            <div className="adm-dash-stat-num" style={{ color: s.accent }}>{loading ? '—' : s.value}</div>
            <div className="adm-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="adm-dash-grid">
        <div className="adm-dash-card">
          <div className="adm-dash-card-header">
            <span className="adm-dash-card-title">Pesanan Terbaru</span>
            <button className="adm-refresh" onClick={() => onNavigate('pesanan')}>Lihat Semua</button>
          </div>
          {loading ? (
            <div className="adm-empty">Memuat data...</div>
          ) : recent.length === 0 ? (
            <div className="adm-empty">Belum ada pesanan.</div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Paket</th>
                  <th>Tanggal Acara</th>
                  <th>Status</th>
                  <th>Dipesan</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.nama}</strong></td>
                    <td className={paketClass[o.paket] || ''}>{paketLabel[o.paket] || o.paket}</td>
                    <td className="adm-muted adm-small">{formatDate(o.tanggal)}</td>
                    <td>
                      <span className={`adm-status-badge adm-status-${o.status}`}>
                        {o.status === 'pending' ? 'Pending' : o.status === 'confirmed' ? 'Confirmed' : 'Selesai'}
                      </span>
                    </td>
                    <td className="adm-muted adm-small">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="adm-dash-card">
          <div className="adm-dash-card-header">
            <span className="adm-dash-card-title">Status Pesanan</span>
          </div>
          <div className="adm-dash-donut-wrap">
            {[
              { label: 'Pending',    count: pending,   color: '#f5a623' },
              { label: 'Confirmed',  count: confirmed, color: '#7ed321' },
              { label: 'Selesai',    count: done,      color: '#9b59b6' },
            ].map(item => (
              <div key={item.label} className="adm-dash-bar-row">
                <span className="adm-dash-bar-label">{item.label}</span>
                <div className="adm-dash-bar-track">
                  <div
                    className="adm-dash-bar-fill"
                    style={{
                      width: total > 0 ? `${(item.count / total) * 100}%` : '0%',
                      background: item.color,
                    }}
                  />
                </div>
                <span className="adm-dash-bar-val">{loading ? '—' : item.count}</span>
              </div>
            ))}
          </div>

          <div className="adm-dash-shortcuts">
            <span className="adm-dash-card-title" style={{ marginBottom: 12, display: 'block' }}>Navigasi Cepat</span>
            {shortcuts.map(item => (
              <button key={item.key} className="adm-shortcut-btn" onClick={() => onNavigate(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
