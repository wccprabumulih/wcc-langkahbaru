import { useState, useCallback, useEffect } from 'react'
import Modal from './Modal'
import Toast, { ToastData } from './Toast'

const WA_NUMBER = '6281532477237'

interface Package {
  id: number
  key: string
  label: string
  price: string
  wa_msg: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const contactItems = [
  { icon: '📱', label: 'WhatsApp', value: '+62 815-3247-7237' },
  { icon: '📸', label: 'Instagram', value: '@wcc.prabumulih' },
  { icon: '📍', label: 'Lokasi', value: 'Prabumulih, Sumatera Selatan' },
  { icon: '⏰', label: 'Jam Operasional', value: 'Setiap Hari, Available by Request' },
]

export default function Booking() {
  const [loading, setLoading] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [toast, setToast] = useState<ToastData | null>(null)
  const [modal, setModal] = useState<{ open: boolean; title: string; desc: string; waUrl: string }>({
    open: false, title: '', desc: '', waUrl: '',
  })

  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.json())
      .then(data => { if (data.success) setPackages(data.data) })
      .catch(() => {})
  }, [])

  const showToast = useCallback((type: 'success' | 'error', title: string, msg: string) => {
    setToast({ type, title, msg })
  }, [])

  const closeToast = useCallback(() => setToast(null), [])
  const closeModal = useCallback(() => setModal(m => ({ ...m, open: false })), [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const paketKey = (form.elements.namedItem('paket') as HTMLSelectElement).value
    const selectedPkg = packages.find(p => p.key === paketKey)
    const data = {
      nama: (form.elements.namedItem('nama') as HTMLInputElement).value.trim(),
      whatsapp: (form.elements.namedItem('whatsapp') as HTMLInputElement).value.trim(),
      tanggal: (form.elements.namedItem('tanggal') as HTMLInputElement).value,
      lokasi: (form.elements.namedItem('lokasi') as HTMLInputElement).value.trim(),
      paket: paketKey,
      catatan: (form.elements.namedItem('catatan') as HTMLTextAreaElement).value.trim(),
    }

    if (!data.nama || !data.whatsapp || !data.tanggal || !data.lokasi || !data.paket) {
      showToast('error', '⚠️ Form Belum Lengkap', 'Mohon isi semua kolom yang wajib diisi.')
      return
    }
    if (!/^(\+62|62|0)[0-9]{8,13}$/.test(data.whatsapp.replace(/\s/g, ''))) {
      showToast('error', '⚠️ Nomor Tidak Valid', 'Masukkan nomor WhatsApp yang valid (contoh: 0812xxxxxxxx)')
      return
    }

    setLoading(true)
    let orderId: string | null = null

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) orderId = result.order_id
    } catch {
      console.warn('Database tidak tersedia')
    }

    const paketLabel = selectedPkg ? `${selectedPkg.label} (${selectedPkg.price})` : paketKey

    const waMsg = selectedPkg?.wa_msg
      ? selectedPkg.wa_msg + `\n\n👤 *Nama:* ${data.nama}\n📱 *WA:* ${data.whatsapp}\n📅 *Tanggal:* ${formatDate(data.tanggal)}\n📍 *Lokasi:* ${data.lokasi}` + (data.catatan ? `\n📝 *Catatan:* ${data.catatan}` : '') + (orderId ? `\n📋 *Order ID:* #${orderId}` : '')
      : [
          '🎬 *PEMESANAN WCC LANGKAH BARU*',
          orderId ? `📋 Order ID: #${orderId}` : '',
          '',
          `👤 *Nama:* ${data.nama}`,
          `📱 *WhatsApp:* ${data.whatsapp}`,
          `📅 *Tanggal:* ${formatDate(data.tanggal)}`,
          `📍 *Lokasi:* ${data.lokasi}`,
          `📦 *Paket:* ${paketLabel}`,
          data.catatan ? `📝 *Catatan:* ${data.catatan}` : '',
          '',
          '✨ Saya ingin memesan jasa Wedding Content Creator. Mohon konfirmasinya! 🙏',
        ].filter(Boolean).join('\n')

    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`

    setModal({
      open: true,
      title: 'Pesanan Berhasil!',
      desc: `Terima kasih ${data.nama}! Pesanan kamu telah dicatat${orderId ? ` (ID: #${orderId})` : ''}. Klik tombol di bawah untuk langsung chat ke WhatsApp kami.`,
      waUrl,
    })

    form.reset()
    setLoading(false)
  }

  const openWa = (msg: string) => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank')

  return (
    <section className="booking" id="booking">
      <div className="container">
        <div className="booking-info reveal-left">
          <div className="section-tag">Pemesanan</div>
          <h2 className="section-title">Pesan <span>Sekarang</span></h2>
          <p className="section-desc" style={{ marginTop: 16 }}>
            Isi form di samping, pesananmu akan langsung tersimpan dan kami akan konfirmasi via WhatsApp dalam waktu singkat.
          </p>
          <div className="booking-contact-items">
            {contactItems.map((c, i) => (
              <div key={i} className="contact-item">
                <div className="ci-icon">{c.icon}</div>
                <div>
                  <div className="ci-label">{c.label}</div>
                  <div className="ci-value">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="booking-form-wrap reveal-right">
          <div className="form-title">📋 Form Pemesanan</div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="nama">Nama Lengkap *</label>
                <input className="form-control" type="text" id="nama" name="nama" placeholder="Contoh: Budi & Siti" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="whatsapp">Nomor WhatsApp *</label>
                <input className="form-control" type="tel" id="whatsapp" name="whatsapp" placeholder="0812xxxxxxxx" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="tanggal">Tanggal Acara *</label>
                <input className="form-control" type="date" id="tanggal" name="tanggal" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="paket">Pilih Paket *</label>
                <select className="form-control" id="paket" name="paket" required defaultValue="">
                  <option value="" disabled>-- Pilih Paket --</option>
                  {packages.map(pkg => (
                    <option key={pkg.key} value={pkg.key}>
                      {pkg.label} – {pkg.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lokasi">Lokasi Acara *</label>
              <input className="form-control" type="text" id="lokasi" name="lokasi" placeholder="Contoh: Gedung Serba Guna, Prabumulih" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="catatan">Catatan / Permintaan Khusus (opsional)</label>
              <textarea className="form-control" id="catatan" name="catatan" rows={3} placeholder="Konsep, tema, atau hal khusus yang ingin kamu sampaikan..." />
            </div>
            <button type="submit" className="btn-primary form-submit" disabled={loading}>
              {loading ? '⏳ Menyimpan...' : '📲 Kirim Pemesanan via WhatsApp'}
            </button>
            <p className="form-note">
              Pesanan akan tersimpan di database &amp; diteruskan via WhatsApp secara otomatis.<br />
              Ada pertanyaan? <a href="#" onClick={e => { e.preventDefault(); openWa('Halo kak, saya mau tanya tentang WCC Langkah Baru 😊') }}>Chat langsung disini →</a>
            </p>
          </form>
        </div>
      </div>

      <Toast toast={toast} onClose={closeToast} />
      <Modal
        open={modal.open}
        icon="🎉"
        title={modal.title}
        desc={modal.desc}
        waUrl={modal.waUrl}
        onClose={closeModal}
      />
    </section>
  )
}
