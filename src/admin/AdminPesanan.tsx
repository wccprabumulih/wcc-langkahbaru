import { useEffect, useState } from 'react'
import { Order, formatDate, formatDateTime, paketLabel, paketClass } from './types'
import { authFetch } from '../lib/authFetch'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  done: 'Selesai',
  canceled: 'Dibatalkan',
}

export default function AdminPesanan() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Order | null>(null)

  const h = { 'Content-Type': 'application/json' }

  const loadOrders = async (status = '') => {
    setLoading(true)
    try {
      const url = status ? `/api/orders?status=${status}` : '/api/orders'
      const res = await authFetch(url, { headers: h })
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  const handleFilter = (f: string) => { setFilter(f); loadOrders(f) }

  const updateStatus = async (id: number, status: string) => {
    const res = await authFetch(`/api/orders/${id}/status`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) loadOrders(filter)
  }

  const handleDelete = async (order: Order) => {
    setDeletingId(order.id)
    try {
      const res = await authFetch(`/api/orders/${order.id}`, { method: 'DELETE', headers: h })
      const data = await res.json()
      if (data.success) { setConfirmDelete(null); loadOrders(filter) }
    } finally {
      setDeletingId(null)
    }
  }

  const total = orders.length
  const pending = orders.filter(o => o.status === 'pending').length
  const confirmed = orders.filter(o => o.status === 'confirmed').length
  const done = orders.filter(o => o.status === 'done').length
  const canceled = orders.filter(o => o.status === 'canceled').length

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Pesanan</h2>
        <button className="adm-refresh" onClick={() => loadOrders(filter)}>Refresh</button>
      </div>

      <div className="adm-stats" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {([['Total', total, 'var(--teal)'], ['Pending', pending, '#f5a623'], ['Confirmed', confirmed, '#7ed321'], ['Selesai', done, '#9b59b6'], ['Dibatalkan', canceled, '#ff7070']] as [string, number, string][]).map(([label, num, color]) => (
          <div key={label} className="adm-stat">
            <div className="adm-stat-num" style={{ color }}>{num}</div>
            <div className="adm-stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="adm-filters">
        {([['', 'Semua'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['done', 'Selesai'], ['canceled', 'Dibatalkan']] as [string, string][]).map(([val, label]) => (
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
        {loading ? (
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
                <th></th>
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
                      href={`https://wa.me/${o.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Halo ' + o.nama + '! Konfirmasi pesanan WCC Langkah Baru')}`}
                      target="_blank" rel="noreferrer"
                    >
                      {o.whatsapp}
                    </a>
                  </td>
                  <td>{formatDate(o.tanggal)}</td>
                  <td>{o.lokasi}</td>
                  <td className={paketClass[o.paket] || ''}>{paketLabel[o.paket] || o.paket}</td>
                  <td className="adm-muted adm-clamp">
                    {o.catatan ? (o.catatan.length > 50 ? o.catatan.slice(0, 50) + '…' : o.catatan) : '-'}
                  </td>
                  <td>
                    <select
                      className="adm-select"
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      style={o.status === 'canceled' ? { color: '#ff7070' } : {}}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="done">Selesai</option>
                      <option value="canceled">Dibatalkan</option>
                    </select>
                  </td>
                  <td className="adm-muted adm-small">{formatDateTime(o.created_at)}</td>
                  <td>
                    <button
                      className="adm-btn-danger-sm"
                      onClick={() => setConfirmDelete(o)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmDelete && (
        <div className="adm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="adm-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>Hapus Pesanan</h3>
              <button className="adm-modal-close" onClick={() => setConfirmDelete(null)}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ gap: 0 }}>
              <p style={{ color: 'var(--white-muted)', fontSize: 14, lineHeight: 1.7 }}>
                Hapus pesanan dari <strong style={{ color: 'var(--white)' }}>{confirmDelete.nama}</strong>?
                Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-refresh" onClick={() => setConfirmDelete(null)}>Batal</button>
              <button
                className="adm-btn-danger-sm"
                style={{ padding: '8px 20px', fontSize: 13 }}
                disabled={deletingId === confirmDelete.id}
                onClick={() => handleDelete(confirmDelete)}
              >
                {deletingId === confirmDelete.id ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
