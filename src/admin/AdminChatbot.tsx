import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Knowledge {
  id: number
  category: string
  question: string
  answer: string
  active: boolean
  order_index: number
  created_at: string
}

const emptyForm = { category: '', question: '', answer: '', active: true, order_index: 0 }

export default function AdminChatbot() {
  const { session } = useAuth()
  const token = session?.access_token ?? ''
  const [items, setItems] = useState<Knowledge[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [testInput, setTestInput] = useState('')
  const [testReply, setTestReply] = useState('')
  const [testing, setTesting] = useState(false)

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/chatbot', { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.success) setItems(d.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchItems() }, [])

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowForm(true); setMsg(null) }
  const openEdit = (k: Knowledge) => {
    setEditId(k.id)
    setForm({ category: k.category || '', question: k.question, answer: k.answer, active: k.active, order_index: k.order_index })
    setShowForm(true); setMsg(null)
  }

  const handleSave = async () => {
    if (!form.question.trim()) { setMsg({ type: 'err', text: 'Pertanyaan harus diisi.' }); return }
    if (!form.answer.trim()) { setMsg({ type: 'err', text: 'Jawaban harus diisi.' }); return }
    setSaving(true); setMsg(null)
    try {
      const url = editId ? `/api/admin/chatbot/${editId}` : '/api/admin/chatbot'
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers, body: JSON.stringify(form) })
      const d = await res.json()
      if (!d.success) throw new Error(d.message)
      setMsg({ type: 'ok', text: editId ? 'Pengetahuan diupdate!' : 'Pengetahuan ditambahkan!' })
      setShowForm(false); fetchItems()
    } catch (e: unknown) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Gagal menyimpan.' })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus entri pengetahuan ini?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/admin/chatbot/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setItems(prev => prev.filter(x => x.id !== id))
    } finally { setDeletingId(null) }
  }

  const toggleActive = async (k: Knowledge) => {
    try {
      await fetch(`/api/admin/chatbot/${k.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...k, active: !k.active }) })
      setItems(prev => prev.map(x => x.id === k.id ? { ...x, active: !x.active } : x))
    } catch { /* silent */ }
  }

  const handleTest = async () => {
    if (!testInput.trim()) return
    setTesting(true); setTestReply('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: testInput }] }),
      })
      const d = await res.json()
      setTestReply(d.success ? d.reply : 'Error: ' + d.message)
    } catch { setTestReply('Gagal menghubungi chatbot.') }
    finally { setTesting(false) }
  }

  const categories = [...new Set(items.map(x => x.category).filter(Boolean))]

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h2 className="adm-page-title">Chatbot Knowledge Base</h2>
          <div className="adm-muted adm-small" style={{ marginTop: 4 }}>{items.filter(x => x.active).length} entri aktif · {items.length} total</div>
        </div>
        <button className="adm-btn-save" onClick={openAdd}>+ Tambah Pengetahuan</button>
      </div>

      {msg && (
        <div className={`adm-settings-msg ${msg.type}`} style={{ marginBottom: 20 }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Test panel */}
      <div className="adm-chatbot-test">
        <div className="adm-chatbot-test-title">🧪 Tes Chatbot Langsung</div>
        <div className="adm-chatbot-test-row">
          <input
            className="adm-input"
            placeholder="Ketik pertanyaan untuk tes..."
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTest()}
          />
          <button className="adm-btn-save" style={{ flexShrink: 0 }} onClick={handleTest} disabled={testing || !testInput.trim()}>
            {testing ? '...' : 'Tes'}
          </button>
        </div>
        {testReply && (
          <div className="adm-chatbot-test-reply">
            <span className="adm-chatbot-test-reply-label">Jawaban Bot:</span>
            <span>{testReply}</span>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h3>{editId ? 'Edit Pengetahuan' : 'Tambah Pengetahuan Baru'}</h3>
              <button className="adm-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-form-grid-2">
                <div className="adm-form-row">
                  <label className="adm-label">Kategori</label>
                  <input className="adm-input" list="cat-list" placeholder="cth: Harga, Paket, Booking..."
                    value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                  <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="adm-form-row">
                  <label className="adm-label">Urutan</label>
                  <input className="adm-input" type="number" min={0} value={form.order_index}
                    onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="adm-form-row">
                <label className="adm-label">Pertanyaan / Topik <span style={{ color: 'tomato' }}>*</span></label>
                <input className="adm-input" placeholder="cth: Berapa harga paket wedding content creator?"
                  value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
                <div className="adm-muted adm-small" style={{ marginTop: 5 }}>Bot akan pakai ini sebagai konteks untuk memahami topik</div>
              </div>
              <div className="adm-form-row">
                <label className="adm-label">Jawaban <span style={{ color: 'tomato' }}>*</span></label>
                <textarea className="adm-input" rows={5} placeholder="Tulis jawaban lengkap di sini..."
                  value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} />
              </div>
              <div className="adm-form-row">
                <label className="adm-label">Status</label>
                <button className={`adm-partner-toggle${form.active ? ' active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}>
                  {form.active ? '✓ Aktif — Bot akan pakai pengetahuan ini' : '✗ Nonaktif — Disembunyikan dari bot'}
                </button>
              </div>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn-cancel" onClick={() => setShowForm(false)}>Batal</button>
              <button className="adm-btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--white-muted)' }}>Memuat...</div>
      ) : items.length === 0 ? (
        <div className="adm-galeri-dropzone" style={{ cursor: 'default' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🤖</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Knowledge base kosong</div>
          <div className="adm-muted adm-small">Tambahkan pengetahuan agar chatbot bisa menjawab pertanyaan pengunjung</div>
        </div>
      ) : (
        <div className="adm-chatbot-list">
          {items.map(k => (
            <div key={k.id} className={`adm-chatbot-row${k.active ? '' : ' inactive'}`}>
              <div className="adm-chatbot-row-body">
                <div className="adm-chatbot-row-head">
                  {k.category && <span className="adm-chatbot-cat">{k.category}</span>}
                  <span className={`adm-status-badge ${k.active ? 'confirmed' : 'cancelled'}`}>{k.active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div className="adm-chatbot-row-q">{k.question}</div>
                <div className="adm-chatbot-row-a">{k.answer.length > 140 ? k.answer.slice(0, 140) + '…' : k.answer}</div>
              </div>
              <div className="adm-partner-row-actions">
                <button className="adm-partner-toggle-btn" onClick={() => toggleActive(k)} title={k.active ? 'Nonaktifkan' : 'Aktifkan'}>{k.active ? '⏸' : '▶'}</button>
                <button className="adm-galeri-view" onClick={() => openEdit(k)} title="Edit">✏️</button>
                <button className="adm-galeri-del" onClick={() => handleDelete(k.id)} disabled={deletingId === k.id}>{deletingId === k.id ? '...' : '🗑'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
