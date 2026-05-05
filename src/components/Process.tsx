const steps = [
  { num: '01', icon: '💬', title: 'Konsultasi', desc: 'Hubungi kami via WhatsApp untuk diskusikan konsep, tanggal, dan lokasi acaramu.' },
  { num: '02', icon: '📋', title: 'Pemesanan', desc: 'Pilih paket yang sesuai dan lakukan konfirmasi booking dengan mengisi form pemesanan.' },
  { num: '03', icon: '🎬', title: 'Hari H', desc: 'Tim kami hadir tepat waktu, merekam setiap momen berharga dengan penuh dedikasi.' },
  { num: '04', icon: '✨', title: 'Terima Konten', desc: 'Konten siap pakai dikirim dalam 24 jam. Footage mentah via Google Drive.' },
]

export default function Process() {
  return (
    <section className="process" id="process">
      <div className="container">
        <div className="process-header">
          <div className="section-tag">Cara Kerja</div>
          <h2 className="section-title">Dari Pesan <span>Sampai Terabadikan</span></h2>
          <p className="section-desc" style={{ marginTop: 16 }}>
            Proses yang simple dan transparan. Kamu tinggal fokus bahagia di hari spesialmu!
          </p>
        </div>
        <div className="process-steps">
          {steps.map((s, i) => (
            <div key={i} className="process-step">
              <div className="step-num">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
