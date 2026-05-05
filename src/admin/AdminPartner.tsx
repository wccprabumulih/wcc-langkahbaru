import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Partner {
  id: number
  name: string
  category: string
  logo_data: string | null
  website_url: string
  order_index: number
  active: boolean
  created_at: string
}

const emptyForm = { name: '', category: '', logo_data: '', website_url: '', order_index: 0, active: true }

function compressLogo(file: File, maxW = 400, quality = 0.85): Promise<string> {
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
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AdminPartner() {
  const { session } = useAuth()
  const token = session?.access_token ?? ''
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const logoRef = useRef<HTMLInputElement>(null)

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const fetchPartners = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/partners', { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.success) setPartners(d.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPartners() }, [])

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
    setMsg(null)
  }

  const openEdit = (p: Partner) => {
    setEditId(p.id)
    setForm({ name: p.name, category: p.category || '', logo_data: p.logo_data || '', website_url: p.website_url || '', order_index: p.order_index, active: p.active })
    setShowForm(true)
    setMsg(null)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressLogo(file)
      setForm(f => ({ ...f, logo_data: compressed }))
    } catch {
      setMsg({ type: 'err', text: 'Gagal memproses logo.' })
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setMsg({ type: 'err', text: 'Nama partner harus diisi.' }); return }
    setSaving(true); setMsg(null)
    try {
      const url = editId ? `/api/admin/partners/${editId}` : '/api/admin/partners'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) })
      const d = await res.json()
      if (!d.success) throw new Error(d.message)
      setMsg({ type: 'ok', text: editId ? 'Partner berhasil diupdate!' : 'Partner berhasil ditambahkan!' })
      setShowForm(false)
      fetchPartners()
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal menyimpan.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus partner "${name}"?`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (!d.success) throw new Error(d.message)
      setPartners(prev => prev.filter(p => p.id !== id))
      setMsg({ type: 'ok', text: 'Partner berhasil dihapus.' })
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal menghapus.' })
    } finally {
      setDeletingId(null)
    }
  }

  const toggleActive = async (p: Partner) => {
    try {
      await fetch(`/api/admin/partners/${p.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ ...p, active: !p.active }),
      })
      setPartners(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
    } catch { /* silent */ }
  }

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h2 className="adm-page-title">Partner &amp; Mitra</h2>
          <div className="adm-muted adm-small" style={{ marginTop: 4 }}>{partners.length} partner terdaftar</div>
        </div>
        <button className="adm-btn-save" onClick={openAdd}>+ Tambah Partner</button>
      </div>

      {msg && (
        <div className={`adm-settings-msg ${msg.type}`} style={{ marginBottom: 20 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h3>{editId ? 'Edit Partner' : 'Tambah Partner Baru'}</h3>
              <button className="adm-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div className="adm-modal-body">
              {/* Logo upload */}
              <div className="adm-partner-logo-upload" onClick={() => logoRef.current?.click()}>
                {form.logo_data ? (
                  <img src={form.logo_data} alt="Logo preview" className="adm-partner-logo-preview" />
                ) : (
                  <div className="adm-partner-logo-empty">
                    <span style={{ fontSize: 28, opacity: 0.4 }}>🖼️</span>
                    <span style={{ fontSize: 12, color: 'var(--white-muted)', marginTop: 6 }}>Upload Logo</span>
                  </div>
                )}
                <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              </div>
              {form.logo_data && (
                <button className="adm-muted adm-small" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.7)', marginBottom: 16, display: 'block' }}
                  onClick={() => setForm(f => ({ ...f, logo_data: '' }))}>
                  Hapus Logo
                </button>
              )}

              <div className="adm-form-row">
                <label className="adm-label">Nama Partner <span style={{ color: 'tomato' }}>*</span></label>
                <input className="adm-input" placeholder="cth. Aula Serbaguna Prabumulih" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="adm-form-row">
                <label className="adm-label">Kategori</label>
                <input className="adm-input" placeholder="cth. Venue Pernikahan, Wedding Organizer, MUA…" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>

              <div className="adm-form-row">
                <label className="adm-label">Website / Link</label>
                <input className="adm-input" placeholder="https://..." value={form.website_url}
                  onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} />
              </div>

              <div className="adm-form-grid-2">
                <div className="adm-form-row">
                  <label className="adm-label">Urutan Tampil</label>
                  <input className="adm-input" type="number" min={0} value={form.order_index}
                    onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="adm-form-row">
                  <label className="adm-label">Status</label>
                  <button
                    className={`adm-partner-toggle${form.active ? ' active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  >
                    {form.active ? '✓ Aktif' : '✗ Nonaktif'}
                  </button>
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button className="adm-btn-cancel" onClick={() => setShowForm(false)}>Batal</button>
              <button className="adm-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partners list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--white-muted)' }}>Memuat...</div>
      ) : partners.length === 0 ? (
        <div className="adm-galeri-dropzone" style={{ cursor: 'default' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🤝</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Belum ada partner</div>
          <div className="adm-muted adm-small">Klik "+ Tambah Partner" untuk mulai menambahkan mitra</div>
        </div>
      ) : (
        <div className="adm-partner-list">
          {partners.map(p => (
            <div key={p.id} className={`adm-partner-row${p.active ? '' : ' inactive'}`}>
              <div className="adm-partner-row-logo">
                {p.logo_data ? (
                  <img src={p.logo_data} alt={p.name} />
                ) : (
                  <div className="adm-partner-row-initial">{p.name.charAt(0)}</div>
                )}
              </div>
              <div className="adm-partner-row-info">
                <div className="adm-partner-row-name">{p.name}</div>
                {p.category && <div className="adm-partner-row-cat">{p.category}</div>}
                {p.website_url && <div className="adm-partner-row-url">{p.website_url}</div>}
              </div>
              <div className="adm-partner-row-meta">
                <span className={`adm-status-badge ${p.active ? 'confirmed' : 'cancelled'}`}>
                  {p.active ? 'Aktif' : 'Nonaktif'}
                </span>
                <span className="adm-muted adm-small">Urutan: {p.order_index}</span>
              </div>
              <div className="adm-partner-row-actions">
                <button className="adm-partner-toggle-btn" onClick={() => toggleActive(p)} title={p.active ? 'Nonaktifkan' : 'Aktifkan'}>
                  {p.active ? '⏸' : '▶'}
                </button>
                <button className="adm-galeri-view" onClick={() => openEdit(p)} title="Edit">✏️</button>
                <button className="adm-galeri-del" onClick={() => handleDelete(p.id, p.name)} disabled={deletingId === p.id} title="Hapus">
                  {deletingId === p.id ? '...' : '🗑'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
