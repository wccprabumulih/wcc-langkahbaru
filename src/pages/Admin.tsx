import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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
  return `${formatDate(s)} ${d.toTimeString().slice(0, 5)}`
}

function escHtml(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default function Admin() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const loadOrders = async (status = '') => {
    setLoading(true)
    try {
      const url = status ? `/api/orders?status=${status}` : '/api/orders'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setOrders(data.data)
    } catch {
      console.error('Gagal memuat orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadOrders() }, [])

  const handleFilter = (f: string) => {
    setFilter(f)
    loadOrders(f)
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!data.success) alert('Gagal update status: ' + data.message)
      else loadOrders(filter)
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  const total = orders.length
  const pending = orders.filter(o => o.status === 'pending').length
  const confirmed = orders.filter(o => o.status === 'confirmed').length
  const done = orders.filter(o => o.status === 'done').length

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel – WCC <span>Langkah Baru</span></h1>
        <Link to="/">← Kembali ke Website</Link>
      </div>

      <div className="admin-main">
        <div className="stats-row">
          {[['Total Pesanan', total], ['Pending', pending], ['Confirmed', confirmed], ['Done', done]].map(([label, num]) => (
            <div key={label} className="stat-box">
              <div className="num">{num}</div>
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
          {loading ? (
            <div className="admin-loading">⏳ Memuat data...</div>
          ) : orders.length === 0 ? (
            <div className="admin-empty">📭 Belum ada pesanan untuk filter ini.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama</th>
                  <th>WhatsApp</th>
                  <th>Tanggal Acara</th>
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
                    <td style={{ color: 'var(--white-muted)' }}>#{o.id}</td>
                    <td><strong>{o.nama}</strong></td>
                    <td>
                      <a
                        className="wa-link"
                        href={`https://wa.me/${o.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Halo ' + o.nama + '! Konfirmasi pesanan WCC Langkah Baru kamu sudah kami terima ✅')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {o.whatsapp}
                      </a>
                    </td>
                    <td>{formatDate(o.tanggal)}</td>
                    <td>{o.lokasi}</td>
                    <td className={paketClass[o.paket] || ''}>{paketLabel[o.paket] || o.paket}</td>
                    <td style={{ color: 'var(--white-muted)', maxWidth: 160 }}>
                      {o.catatan ? (o.catatan.length > 60 ? o.catatan.substring(0, 60) + '…' : o.catatan) : '-'}
                    </td>
                    <td>
                      <select
                        className="status-sel"
                        value={o.status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                      >
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
      </div>
    </div>
  )
}
