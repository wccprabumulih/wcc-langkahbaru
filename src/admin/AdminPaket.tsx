import { useEffect, useState } from 'react'
import { authFetch } from '../lib/authFetch'

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
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [featuresText, setFeaturesText] = useState('')
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const h = { 'Content-Type': 'application/json' }

  const load = async () => {
    setLoading(true)
    try {
      const res = await authFetch('/api/admin/packages', { headers: h })
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
    setShowModal(true)
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
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditId(null); setMsg(null) }

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
      const res = await authFetch(url, { method, headers: h, body: JSON.stringify(body) })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setMsg({ type: 'ok', text: editId ? 'Paket berhasil diperbarui.' : 'Paket berhasil ditambahkan.' })
      load()
      setTimeout(closeModal, 700)
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal menyimpan.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Hapus paket "${pkg.label}"?`)) return
    try {
      const res = await authFetch(`/api/admin/packages/${pkg.id}`, { method: 'DELETE', headers: h })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus.')
    }
  }

  const handleToggleActive = async (pkg: Package) => {
    setToggling(pkg.id)
    try {
      const body = { ...pkg, active: !pkg.active, features: pkg.features }
      const res = await authFetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT', headers: h, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status.')
    } finally {
      setToggling(null)
    }
  }

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Paket</h2>
        <button className="adm-refresh" onClick={openCreate}>+ Tambah Paket</button>
      </div>

      {/* ── TABLE ── */}
      {loading ? (
        <div className="adm-empty">Memuat data...</div>
      ) : packages.length === 0 ? (
        <div className="adm-empty">Belum ada paket. Klik "+ Tambah Paket" untuk mulai.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Nama Paket</th>
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
                  <td>
                    <code style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 5, color: 'var(--white-muted)' }}>
                      {pkg.key}
                    </code>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>{pkg.label}</strong>
                      {pkg.popular && <span className="adm-paket-badge">Terpopuler</span>}
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--teal)' }}>{pkg.price}</strong>
                    <div className="adm-muted adm-small">{pkg.price_note}</div>
                  </td>
                  <td className="adm-muted adm-small">{pkg.features.length} fitur</td>
                  <td className="adm-muted" style={{ textAlign: 'center' }}>{pkg.sort_order}</td>
                  <td>
                    <button
                      className={`adm-status-badge ${pkg.active ? 'adm-status-confirmed' : 'adm-status-pending'}`}
                      style={{ border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
                      onClick={() => handleToggleActive(pkg)}
                      disabled={toggling === pkg.id}
                      title={pkg.active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                    >
                      {toggling === pkg.id ? '...' : pkg.active ? '✓ Aktif' : '✗ Nonaktif'}
                    </button>
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

      {/* ── MODAL ── */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="adm-modal">

            <div className="adm-modal-header">
              <h3>{editId ? 'Edit Paket' : 'Tambah Paket'}</h3>
              <button className="adm-modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="adm-modal-body">

                <div className="adm-modal-grid">
                  <label className="adm-field">
                    <span className="adm-field-label">Key</span>
                    <input
                      className="adm-input"
                      value={form.key}
                      onChange={e => set('key', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      required
                      placeholder="silver"
                      disabled={!!editId}
                    />
                  </label>
                  <label className="adm-field">
                    <span className="adm-field-label">Nama Paket</span>
                    <input className="adm-input" value={form.label} onChange={e => set('label', e.target.value)} required placeholder="Silver" />
                  </label>
                  <label className="adm-field">
                    <span className="adm-field-label">Harga</span>
                    <input className="adm-input" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="300K" />
                  </label>
                  <label className="adm-field">
                    <span className="adm-field-label">Keterangan Harga</span>
                    <input className="adm-input" value={form.price_note} onChange={e => set('price_note', e.target.value)} placeholder="per hari acara" />
                  </label>
                  <label className="adm-field">
                    <span className="adm-field-label">Badge</span>
                    <input className="adm-input" value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="🥈 Silver" />
                  </label>
                  <label className="adm-field">
                    <span className="adm-field-label">Urutan</span>
                    <input className="adm-input" type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
                  </label>
                </div>

                <label className="adm-field">
                  <span className="adm-field-label">Fitur (satu per baris)</span>
                  <textarea
                    className="adm-input adm-textarea"
                    value={featuresText}
                    onChange={e => setFeaturesText(e.target.value)}
                    placeholder={'Up 8 Story Instagram premium\nEditing Video Story dalam <24 Jam\nResolusi Full HD'}
                  />
                </label>

                <label className="adm-field">
                  <span className="adm-field-label">Pesan WhatsApp (opsional)</span>
                  <textarea
                    className="adm-input adm-textarea"
                    style={{ minHeight: 64 }}
                    value={form.wa_msg}
                    onChange={e => set('wa_msg', e.target.value)}
                    placeholder="Halo kak! Saya tertarik dengan paket Silver 🥈"
                  />
                </label>

                <label className="adm-field">
                  <span className="adm-field-label">Gaya Tombol</span>
                  <select className="adm-input" value={form.cta_class} onChange={e => set('cta_class', e.target.value)}>
                    <option value="btn-primary">Solid (direkomendasikan untuk paket utama)</option>
                    <option value="btn-outline">Outline / Transparan</option>
                  </select>
                </label>

                <div style={{ display: 'flex', gap: 20 }}>
                  <label className="adm-check-row">
                    <input type="checkbox" checked={form.popular} onChange={e => set('popular', e.target.checked)} />
                    Tandai sebagai Terpopuler
                  </label>
                  <label className="adm-check-row">
                    <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                    Aktif (tampil di website)
                  </label>
                </div>

                {msg && (
                  <div className={`adm-settings-msg ${msg.type}`} style={{ margin: 0 }}>
                    {msg.text}
                  </div>
                )}

              </div>

              <div className="adm-modal-footer">
                <button type="button" className="adm-btn-cancel" onClick={closeModal}>Batal</button>
                <button type="submit" className="adm-btn-save" disabled={saving}>
                  {saving ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
