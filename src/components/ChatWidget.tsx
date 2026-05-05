import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WA_NUMBER = '6281532477237'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Halo! 👋 Saya asisten WCC Langkah Baru. Ada yang bisa saya bantu seputar layanan kami?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pulse, setPulse] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const updated: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      const d = await res.json()
      if (d.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: d.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, ada gangguan. Silakan hubungi kami via WhatsApp ya!' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, koneksi bermasalah. Coba lagi atau hubungi kami via WhatsApp.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const openWa = () => {
    window.open(`https://wa.me/${WA_NUMBER}?text=Halo%20kak%2C%20saya%20mau%20tanya-tanya%20tentang%20layanan%20WCC%20Langkah%20Baru%20%F0%9F%98%8A`, '_blank')
  }

  return (
    <div className="chat-widget">
      {/* Popup */}
      <div className={`chat-popup${open ? ' chat-popup-open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-avatar">LK</div>
            <div>
              <div className="chat-header-name">Langkah Baru</div>
              <div className="chat-header-status"><span className="chat-dot" />Online</div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="chat-wa-btn" onClick={openWa} title="Chat WhatsApp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
            <button className="chat-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble-wrap ${m.role}`}>
              {m.role === 'assistant' && <div className="chat-bubble-avatar">LK</div>}
              <div className={`chat-bubble ${m.role}`}>
                {m.content.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble-wrap assistant">
              <div className="chat-bubble-avatar">LK</div>
              <div className="chat-bubble assistant chat-bubble-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <input
            ref={inputRef}
            className="chat-input"
            placeholder="Ketik pesanmu..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button className="chat-send-btn" onClick={send} disabled={loading || !input.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Floating button */}
      <button
        className={`chat-fab${open ? ' chat-fab-open' : ''}${pulse ? ' chat-fab-pulse' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Buka chat"
      >
        <span className="chat-fab-icon chat-fab-icon-chat">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span className="chat-fab-icon chat-fab-icon-close">✕</span>
      </button>
    </div>
  )
}
