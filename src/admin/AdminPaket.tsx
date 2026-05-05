import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Package {
  id: number
  key: string
  label: string
  price: string
  price_note: string
  badge: string
  popular: boolean
  features: string[]
  wa_msg: string
  cta_class: string
  sort_order: number
  active: boolean
}

const emptyForm = (): Omit<Package, 'id'> => ({
  key: '',
  label: '',
  price: '',
  price_note: 'per hari acara',
  badge: '',
  popular: false,
  features: [],
  wa_msg: '',
  cta_class: 'btn-primary',
  sort_order: 0,
  active: true,
})

export default function AdminPaket() {
  const { session } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [featuresText, setFeaturesText] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/packages', { headers })
      const data = await res.json()
      if (data.success) setPackages(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm())
    setFeaturesText('')
    setMsg(null)
    setShowForm(true)
  }

  const openEdit = (pkg: Package) => {
    setEditId(pkg.id)
    setForm({
      key: pkg.key,
      label: pkg.label,
      price: pkg.price,
      price_note: pkg.price_note,
      badge: pkg.badge,
      popular: pkg.popular,
      features: pkg.features,
      wa_msg: pkg.wa_msg,
      cta_class: pkg.cta_class,
      sort_order: pkg.sort_order,
      active: pkg.active,
    })
    setFeaturesText(pkg.features.join('\n'))
    setMsg(null)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null); setMsg(null) }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setSaving(true)
    try {
      const body = {
        ...form,
        features: featuresText.split('\n').map(f => f.trim()).filter(Boolean),
      }
      const url = editId ? `/api/admin/packages/${editId}` : '/api/admin/packages'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setMsg({ type: 'ok', text: editId ? 'Paket berhasil diperbarui.' : 'Paket berhasil ditambahkan.' })
      load()
      setTimeout(closeForm, 900)
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal menyimpan.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Hapus paket "${pkg.label}"? Aksi ini tidak bisa dibatalkan.`)) return
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus.')
    }
  }

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Paket</h2>
        <button className="adm-refresh" onClick={openCreate}>+ Tambah Paket</button>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="adm-pkg-form-wrap">
          <div className="adm-pkg-form-header">
            <span className="adm-dash-card-title">{editId ? 'Edit Paket' : 'Tambah Paket Baru'}</span>
            <button className="adm-muted" style={{ background: 'none', border: 'none', fontSize: 18, lineHeight: 1 }} onClick={closeForm}>×</button>
          </div>
          <form className="adm-pkg-form" onSubmit={handleSave}>
            <div className="adm-pkg-form-grid">
              <label className="adm-settings-field">
                <span>Key (unik, huruf kecil)</span>
                <input className="adm-input" value={form.key} onChange={e => set('key', e.target.value.toLowerCase().replace(/\s+/g, '-'))} required placeholder="contoh: silver" disabled={!!editId} />
              </label>
              <label className="adm-settings-field">
                <span>Label / Nama Paket</span>
                <input className="adm-input" value={form.label} onChange={e => set('label', e.target.value)} required placeholder="contoh: Silver" />
              </label>
              <label className="adm-settings-field">
                <span>Harga</span>
                <input className="adm-input" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="contoh: 300K" />
              </label>
              <label className="adm-settings-field">
                <span>Keterangan Harga</span>
                <input className="adm-input" value={form.price_note} onChange={e => set('price_note', e.target.value)} placeholder="per hari acara" />
              </label>
              <label className="adm-settings-field">
                <span>Badge</span>
                <input className="adm-input" value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="contoh: Silver" />
              </label>
              <label className="adm-settings-field">
                <span>Urutan Tampil</span>
                <input className="adm-input" type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
              </label>
            </div>

            <label className="adm-settings-field">
              <span>Fitur (satu per baris)</span>
              <textarea
                className="adm-input adm-textarea"
                rows={5}
                value={featuresText}
                onChange={e => setFeaturesText(e.target.value)}
                placeholder={'Up 8 Story Instagram premium\nEditing Video Story dalam <24 Jam'}
              />
            </label>

            <label className="adm-settings-field">
              <span>Pesan WhatsApp</span>
              <input className="adm-input" value={form.wa_msg} onChange={e => set('wa_msg', e.target.value)} placeholder="Halo kak! Saya tertarik dengan paket ini..." />
            </label>

            <div className="adm-pkg-form-grid">
              <label className="adm-settings-field">
                <span>Tombol CTA</span>
                <select className="adm-select" style={{ padding: '10px 14px' }} value={form.cta_class} onChange={e => set('cta_class', e.target.value)}>
                  <option value="btn-primary">Solid (btn-primary)</option>
                  <option value="btn-outline">Outline (btn-outline)</option>
                </select>
              </label>
              <div className="adm-pkg-toggles">
                <label className="adm-toggle-row">
                  <input type="checkbox" checked={form.popular} onChange={e => set('popular', e.target.checked)} />
                  <span>Tampilkan badge "Terpopuler"</span>
                </label>
                <label className="adm-toggle-row">
                  <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                  <span>Aktif (tampil di website)</span>
                </label>
              </div>
            </div>

            {msg && <div className={`adm-settings-msg ${msg.type}`}>{msg.text}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="adm-refresh" style={{ padding: '10px 24px' }} disabled={saving}>
                {saving ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Tambahkan')}
              </button>
              <button type="button" className="adm-btn-danger-sm" style={{ padding: '10px 16px' }} onClick={closeForm}>Batal</button>
            </div>
          </form>
        </div>
      )}

      {/* ── LIST ── */}
      {loading ? (
        <div className="adm-empty">Memuat data...</div>
      ) : packages.length === 0 ? (
        <div className="adm-empty">Belum ada paket. Klik "+ Tambah Paket" untuk mulai.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Label</th>
                <th>Harga</th>
                <th>Fitur</th>
                <th>Urutan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg.id}>
                  <td className="adm-muted adm-small">{pkg.key}</td>
                  <td>
                    <strong>{pkg.label}</strong>
                    {pkg.popular && <span className="adm-paket-badge" style={{ marginLeft: 8 }}>Terpopuler</span>}
                  </td>
                  <td>{pkg.price} <span className="adm-muted adm-small">/ {pkg.price_note}</span></td>
                  <td className="adm-muted adm-small">{pkg.features.length} fitur</td>
                  <td className="adm-muted">{pkg.sort_order}</td>
                  <td>
                    <span className={`adm-status-badge ${pkg.active ? 'adm-status-confirmed' : 'adm-status-pending'}`}>
                      {pkg.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="adm-refresh" onClick={() => openEdit(pkg)}>Edit</button>
                      <button className="adm-btn-danger-sm" onClick={() => handleDelete(pkg)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
