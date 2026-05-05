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
  const [toggling, setToggling] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/packages', { headers })
      const data = await res.json()
      if (data.success) setPackages(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const scrollToForm = () => {
    setTimeout(() => {
      document.querySelector<HTMLElement>('.adm-pkg-form-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm())
    setFeaturesText('')
    setMsg(null)
    setShowForm(true)
    scrollToForm()
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
    scrollToForm()
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

  const handleToggleActive = async (pkg: Package) => {
    setToggling(pkg.id)
    try {
      const body = { ...pkg, active: !pkg.active, features: pkg.features }
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT', headers, body: JSON.stringify(body),
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

      <div className="adm-paket-note" style={{ marginBottom: 24 }}>
        <span>
          Paket yang <strong style={{ color: '#7ed321' }}>Aktif</strong> otomatis tampil di halaman website dan form pemesanan.
          Paket <strong style={{ color: '#f5a623' }}>Nonaktif</strong> hanya terlihat di sini.
        </span>
      </div>

      {/* ── FORM ── */}
      {showForm && (
        <div className="adm-pkg-form-wrap">

          {/* Header */}
          <div className="adm-pkg-form-header">
            <div className="adm-pkg-form-title">
              <div className="adm-pkg-form-title-icon">
                {editId ? '✏️' : '📦'}
              </div>
              <div>
                <h3>{editId ? 'Edit Paket' : 'Tambah Paket Baru'}</h3>
                <span>{editId ? 'Ubah detail paket yang sudah ada' : 'Buat paket layanan baru untuk ditampilkan di website'}</span>
              </div>
            </div>
            <button className="adm-pkg-form-close" onClick={closeForm} title="Tutup">✕</button>
          </div>

          <form className="adm-pkg-form" onSubmit={handleSave}>

            {/* Section 1 — Info Dasar */}
            <div className="adm-form-section">
              <div className="adm-form-section-label">Informasi Dasar</div>
              <div className="adm-pkg-form-grid">
                <label className="adm-field">
                  <span className="adm-field-label">Key Paket</span>
                  <span className="adm-field-hint">ID unik, huruf kecil, tanpa spasi. Tidak bisa diubah setelah disimpan.</span>
                  <input
                    className="adm-input"
                    value={form.key}
                    onChange={e => set('key', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    required
                    placeholder="contoh: silver"
                    disabled={!!editId}
                  />
                </label>
                <label className="adm-field">
                  <span className="adm-field-label">Nama Paket</span>
                  <span className="adm-field-hint">Nama yang ditampilkan ke pengunjung.</span>
                  <input className="adm-input" value={form.label} onChange={e => set('label', e.target.value)} required placeholder="contoh: Silver" />
                </label>
                <label className="adm-field">
                  <span className="adm-field-label">Harga</span>
                  <span className="adm-field-hint">Contoh: 300K atau Rp 300.000</span>
                  <input className="adm-input" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="300K" />
                </label>
                <label className="adm-field">
                  <span className="adm-field-label">Keterangan Harga</span>
                  <span className="adm-field-hint">Teks kecil di bawah harga.</span>
                  <input className="adm-input" value={form.price_note} onChange={e => set('price_note', e.target.value)} placeholder="per hari acara" />
                </label>
                <label className="adm-field">
                  <span className="adm-field-label">Teks Badge</span>
                  <span className="adm-field-hint">Label kecil di atas harga. Bisa pakai emoji.</span>
                  <input className="adm-input" value={form.badge} onChange={e => set('badge', e.target.value)} placeholder="🥈 Silver" />
                </label>
                <label className="adm-field">
                  <span className="adm-field-label">Urutan Tampil</span>
                  <span className="adm-field-hint">Angka lebih kecil = tampil lebih dulu.</span>
                  <input className="adm-input" type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} />
                </label>
              </div>
            </div>

            <div className="adm-form-section-divider" />

            {/* Section 2 — Konten */}
            <div className="adm-form-section">
              <div className="adm-form-section-label">Fitur & Konten</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label className="adm-field">
                  <span className="adm-field-label">Daftar Fitur</span>
                  <span className="adm-field-hint">Satu fitur per baris. Akan tampil sebagai checklist di kartu paket.</span>
                  <textarea
                    className="adm-input adm-textarea"
                    rows={6}
                    value={featuresText}
                    onChange={e => setFeaturesText(e.target.value)}
                    placeholder={'Up 8 Story Instagram premium\nEditing Video Story dalam <24 Jam\nResolusi Full HD\n1 Orang Fotografer\n50 Foto Pilihan'}
                  />
                </label>
                <label className="adm-field">
                  <span className="adm-field-label">Pesan WhatsApp Otomatis <span style={{ color: 'var(--white-muted)', fontWeight: 400 }}>(opsional)</span></span>
                  <span className="adm-field-hint">Pesan default saat pengunjung klik "Pesan Paket Ini". Kosongkan untuk pakai template sistem.</span>
                  <textarea
                    className="adm-input adm-textarea"
                    rows={3}
                    value={form.wa_msg}
                    onChange={e => set('wa_msg', e.target.value)}
                    placeholder="Halo kak! Saya tertarik dengan paket Silver WCC Langkah Baru 🥈"
                  />
                </label>
              </div>
            </div>

            <div className="adm-form-section-divider" />

            {/* Section 3 — Tampilan */}
            <div className="adm-form-section">
              <div className="adm-form-section-label">Tampilan & Status</div>
              <div className="adm-pkg-form-grid">
                <label className="adm-field">
                  <span className="adm-field-label">Gaya Tombol CTA</span>
                  <span className="adm-field-hint">Tampilan tombol "Pesan Paket Ini" di kartu.</span>
                  <select className="adm-input" value={form.cta_class} onChange={e => set('cta_class', e.target.value)}>
                    <option value="btn-primary">Solid / Isi penuh (direkomendasikan untuk paket utama)</option>
                    <option value="btn-outline">Outline / Transparan</option>
                  </select>
                </label>
                <div className="adm-field">
                  <span className="adm-field-label">Opsi Tampilan</span>
                  <span className="adm-field-hint">Atur visibilitas dan badge paket ini.</span>
                  <div className="adm-pkg-toggles" style={{ marginTop: 4 }}>
                    <label className="adm-toggle-row">
                      <input type="checkbox" checked={form.popular} onChange={e => set('popular', e.target.checked)} />
                      <span className="adm-toggle-pill" />
                      <span className="adm-toggle-text">Tampilkan badge <strong style={{ color: 'var(--teal)' }}>"Terpopuler"</strong></span>
                    </label>
                    <label className="adm-toggle-row">
                      <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
                      <span className="adm-toggle-pill" />
                      <span className="adm-toggle-text">
                        <strong style={{ color: form.active ? '#7ed321' : 'var(--white-muted)' }}>
                          {form.active ? 'Aktif' : 'Nonaktif'}
                        </strong>
                        {' — '}
                        {form.active ? 'tampil di website & form' : 'tersembunyi dari publik'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </form>

          {/* Footer actions */}
          <div className="adm-pkg-form-actions">
            {msg && (
              <div className={`adm-settings-msg ${msg.type}`} style={{ flex: 1, margin: 0 }}>
                {msg.type === 'ok' ? '✓ ' : '⚠ '}{msg.text}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
              <button type="button" className="adm-btn-cancel" onClick={closeForm}>
                Batal
              </button>
              <button
                type="submit"
                form="pkg-form-submit"
                className="adm-btn-save"
                disabled={saving}
                onClick={e => {
                  const formEl = document.querySelector<HTMLFormElement>('.adm-pkg-form')
                  if (formEl) { e.preventDefault(); formEl.requestSubmit() }
                }}
              >
                {saving ? '⏳ Menyimpan...' : editId ? '💾 Simpan Perubahan' : '✅ Tambah Paket'}
              </button>
            </div>
          </div>

        </div>
      )}

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
                      style={{ border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.2s' }}
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
    </>
  )
}
