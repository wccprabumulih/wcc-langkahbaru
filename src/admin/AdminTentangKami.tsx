import { useEffect, useRef, useState } from 'react'
import { authFetch } from '../lib/authFetch'

interface Feature {
  icon: string
  title: string
  desc: string
}

interface AboutContent {
  heading: string
  heading_highlight: string
  desc1: string
  desc2: string
  instagram: string
  availability: string
  features: Feature[]
}

const DEFAULT: AboutContent = {
  heading: 'Kami Bukan Sekadar',
  heading_highlight: 'Merekam',
  desc1: 'WCC Langkah Baru adalah layanan Wedding Content Creator yang hadir untuk mengabadikan hari istimewamu dengan sentuhan sinematik yang memukau. Setiap frame kami rancang dengan penuh rasa.',
  desc2: 'Dari story Instagram yang captivating hingga reels yang viral-worthy — kami pastikan momen pernikahanmu terdokumentasi dan siap dibagikan ke dunia.',
  instagram: '@wcc.prabumulih',
  availability: 'By Request 🗓️',
  features: [
    { icon: '🎬', title: 'Videografi Sinematik', desc: 'Setiap momen direkam dengan gaya cinematic yang elegan dan berkelas' },
    { icon: '✂️', title: 'Editing Profesional', desc: 'Hasil editing yang halus, estetik, dan siap tayang dalam waktu singkat' },
    { icon: '📲', title: 'Siap Posting', desc: 'Konten langsung bisa di-upload ke Instagram/TikTok' },
    { icon: '☁️', title: 'Video Mentah via Google Drive', desc: 'Semua footage mentah dikirimkan lewat Google Drive untuk koleksi pribadimu' },
  ],
}

function compressImage(file: File, maxW = 1200, quality = 0.82): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AdminTentangKami() {
  const h = { 'Content-Type': 'application/json' }

  const [content, setContent] = useState<AboutContent>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const [imgMsg, setImgMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/content/about').then(r => r.json()),
      fetch('/api/images').then(r => r.json()),
    ]).then(([aboutData, imgData]) => {
      if (aboutData.success) setContent(aboutData.data)
      if (imgData.success && imgData.data['about-main']) setImgSrc(imgData.data['about-main'].image_data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const setField = <K extends keyof AboutContent>(key: K, val: AboutContent[K]) =>
    setContent(c => ({ ...c, [key]: val }))

  const setFeature = (i: number, field: keyof Feature, val: string) =>
    setContent(c => {
      const features = c.features.map((f, idx) => idx === i ? { ...f, [field]: val } : f)
      return { ...c, features }
    })

  const addFeature = () =>
    setContent(c => ({ ...c, features: [...c.features, { icon: '✨', title: 'Fitur Baru', desc: 'Deskripsi fitur' }] }))

  const removeFeature = (i: number) =>
    setContent(c => ({ ...c, features: c.features.filter((_, idx) => idx !== i) }))

  const handleSave = async () => {
    setSaving(true); setMsg(null)
    try {
      const res = await authFetch('/api/admin/content/about', {
        method: 'PUT', headers: h, body: JSON.stringify(content),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setMsg({ type: 'ok', text: 'Konten berhasil disimpan!' })
      setTimeout(() => setMsg(null), 3000)
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal menyimpan.' })
    } finally {
      setSaving(false)
    }
  }

  const handleImgFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setImgMsg({ type: 'err', text: 'File harus berupa gambar.' }); return }
    setImgLoading(true); setImgMsg(null)
    try {
      const compressed = await compressImage(file)
      const res = await authFetch('/api/admin/images/about-main', {
        method: 'PUT', headers: h,
        body: JSON.stringify({ image_data: compressed, label: 'Foto Tentang Kami' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setImgSrc(compressed)
      setImgMsg({ type: 'ok', text: 'Foto berhasil disimpan!' })
      setTimeout(() => setImgMsg(null), 2500)
    } catch (err: unknown) {
      setImgMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal.' })
    } finally {
      setImgLoading(false)
    }
  }

  const handleImgDelete = async () => {
    setImgLoading(true); setImgMsg(null)
    try {
      const res = await authFetch('/api/admin/images/about-main', { method: 'DELETE', headers: h })
      const data = await res.json()
      if (!data.success) throw new Error(data.message)
      setImgSrc(null)
      setImgMsg({ type: 'ok', text: 'Foto dihapus.' })
      setTimeout(() => setImgMsg(null), 2000)
    } catch (err: unknown) {
      setImgMsg({ type: 'err', text: err instanceof Error ? err.message : 'Gagal.' })
    } finally {
      setImgLoading(false)
    }
  }

  if (loading) return <div className="adm-empty">Memuat konten...</div>

  return (
    <>
      <div className="adm-page-header">
        <h2 className="adm-page-title">Tentang Kami</h2>
        <button className="adm-refresh" onClick={handleSave} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Semua'}
        </button>
      </div>

      {msg && (
        <div className={`adm-settings-msg ${msg.type}`} style={{ marginBottom: 20, padding: '10px 16px', borderRadius: 8, fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      <div className="adm-settings-grid">

        {/* Foto */}
        <div className="adm-settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="adm-settings-card-title">📸 Foto Tentang Kami</div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div
              className={`img-slot-preview${imgSrc ? ' has-image' : ''}`}
              style={{ width: 200, flexShrink: 0 }}
              onClick={() => !imgLoading && inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImgFile(f) }}
            >
              {imgSrc
                ? <img src={imgSrc} alt="Tentang Kami" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                : <div className="img-slot-empty"><span className="img-slot-icon">📷</span><span className="img-slot-hint">Klik atau drag foto</span></div>
              }
              {imgLoading && <div className="img-slot-loading"><div className="img-slot-spinner" /></div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
              <p className="adm-muted adm-small" style={{ lineHeight: 1.7 }}>
                Foto ini tampil di section <strong style={{ color: 'var(--white)' }}>"Tentang Kami"</strong> halaman utama.<br />
                Format JPG/PNG, otomatis dikompres.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="adm-refresh" style={{ padding: '7px 16px' }} onClick={() => inputRef.current?.click()} disabled={imgLoading}>
                  {imgSrc ? 'Ganti Foto' : 'Upload Foto'}
                </button>
                {imgSrc && <button className="adm-btn-danger-sm" onClick={handleImgDelete} disabled={imgLoading}>Hapus</button>}
              </div>
              {imgMsg && <div className={`adm-settings-msg ${imgMsg.type}`} style={{ fontSize: 12, padding: '6px 12px' }}>{imgMsg.text}</div>}
            </div>
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImgFile(f); e.target.value = '' }} />
          </div>
        </div>

        {/* Heading */}
        <div className="adm-settings-card">
          <div className="adm-settings-card-title">✏️ Judul Utama</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="adm-settings-field">
              <span>Teks sebelum highlight</span>
              <input className="adm-input" value={content.heading}
                onChange={e => setField('heading', e.target.value)}
                placeholder="Kami Bukan Sekadar" />
            </label>
            <label className="adm-settings-field">
              <span>Kata highlight (warna teal + italic)</span>
              <input className="adm-input" value={content.heading_highlight}
                onChange={e => setField('heading_highlight', e.target.value)}
                placeholder="Merekam" />
            </label>
            <div className="adm-muted adm-small" style={{ padding: '10px 14px', background: 'rgba(0,212,184,0.04)', borderRadius: 8, border: '1px solid rgba(0,212,184,0.1)' }}>
              Preview: <strong style={{ color: 'var(--white)' }}>{content.heading}</strong>{' '}
              <em style={{ color: 'var(--teal)' }}>{content.heading_highlight}</em>
            </div>
          </div>
        </div>

        {/* Accent Cards */}
        <div className="adm-settings-card">
          <div className="adm-settings-card-title">🏷️ Kartu Info Kecil</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="adm-settings-field">
              <span>Instagram</span>
              <input className="adm-input" value={content.instagram}
                onChange={e => setField('instagram', e.target.value)}
                placeholder="@wcc.prabumulih" />
            </label>
            <label className="adm-settings-field">
              <span>Ketersediaan</span>
              <input className="adm-input" value={content.availability}
                onChange={e => setField('availability', e.target.value)}
                placeholder="By Request 🗓️" />
            </label>
          </div>
        </div>

        {/* Descriptions */}
        <div className="adm-settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="adm-settings-card-title">📝 Deskripsi</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="adm-settings-field">
              <span>Paragraf 1</span>
              <textarea className="adm-input" rows={3} value={content.desc1}
                onChange={e => setField('desc1', e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.6 }} />
            </label>
            <label className="adm-settings-field">
              <span>Paragraf 2</span>
              <textarea className="adm-input" rows={3} value={content.desc2}
                onChange={e => setField('desc2', e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.6 }} />
            </label>
          </div>
        </div>

        {/* Features */}
        <div className="adm-settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="adm-settings-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⚡ Fitur Unggulan</span>
            <button className="adm-refresh" style={{ padding: '5px 14px', fontSize: 11 }} onClick={addFeature}>
              + Tambah Fitur
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {content.features.map((f, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <label className="adm-settings-field" style={{ flex: '0 0 80px' }}>
                    <span>Icon</span>
                    <input className="adm-input" value={f.icon}
                      onChange={e => setFeature(i, 'icon', e.target.value)}
                      style={{ textAlign: 'center', fontSize: 20 }} maxLength={4} />
                  </label>
                  <label className="adm-settings-field" style={{ flex: '1 1 160px' }}>
                    <span>Judul</span>
                    <input className="adm-input" value={f.title}
                      onChange={e => setFeature(i, 'title', e.target.value)} />
                  </label>
                  <label className="adm-settings-field" style={{ flex: '2 1 260px' }}>
                    <span>Deskripsi</span>
                    <input className="adm-input" value={f.desc}
                      onChange={e => setFeature(i, 'desc', e.target.value)} />
                  </label>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                    <button className="adm-btn-danger-sm"
                      onClick={() => removeFeature(i)}
                      disabled={content.features.length <= 1}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          style={{ padding: '11px 32px', borderRadius: 50, fontSize: 14, fontFamily: 'var(--font-body)', fontWeight: 600, background: 'var(--teal)', color: '#000', border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </button>
      </div>
    </>
  )
}
