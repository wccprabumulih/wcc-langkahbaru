import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Order, formatDate, formatDateTime, paketLabel, paketClass } from './types'

export default function AdminPesanan() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }

  const loadOrders = async (status = '') => {
    setLoading(true)
    try {
      const url = status ? `/api/orders?status=${status}` : '/api/orders'
      const res = await fetch(url, { headers })
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  const handleFilter = (f: string) => { setFilter(f); loadOrders(f) }

  const updateStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) loadOrders(filter)
  }

  const total = orders.length
  const pending = orders.filter(o => o.status === 'pending').length
  const confirmed = orders.filter(o => o.status === 'confirmed').length
  const done = orders.filter(o => o.status === 'done').length

  return (
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
  )
}
