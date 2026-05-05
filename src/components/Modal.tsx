interface Props {
  open: boolean
  icon: string
  title: string
  desc: string
  waUrl: string
  onClose: () => void
}

export default function Modal({ open, icon, title, desc, waUrl, onClose }: Props) {
  return (
    <div className={`modal-overlay${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-icon">{icon}</div>
        <div className="modal-title">{title}</div>
        <div className="modal-desc">{desc}</div>
        <div className="modal-actions">
          <a href={waUrl} target="_blank" rel="noreferrer" className="btn-primary">💬 Chat via WhatsApp</a>
          <button className="btn-outline" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  )
}
