import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '404 – Halaman Tidak Ditemukan | WCC Langkah Baru'
    return () => { document.title = 'WCC Langkah Baru – Wedding Content Creator Prabumulih' }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-deep)',
      color: 'var(--white)',
      fontFamily: 'var(--font-body)',
      textAlign: 'center',
      padding: '2rem',
      gap: '0',
    }}>
      <div style={{
        fontSize: 'clamp(6rem, 20vw, 10rem)',
        lineHeight: 1,
        fontFamily: 'var(--font-serif)',
        fontWeight: 900,
        letterSpacing: '-4px',
        background: 'linear-gradient(135deg, var(--teal), var(--gold))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        opacity: 0.25,
        marginBottom: '1rem',
        userSelect: 'none',
      }}>404</div>

      <div style={{
        width: 40, height: 2,
        background: 'linear-gradient(90deg, var(--teal), var(--gold))',
        borderRadius: 2,
        marginBottom: '1.5rem',
      }} />

      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
        marginBottom: '1rem',
        fontWeight: 700,
      }}>
        Halaman Tidak Ditemukan
      </h1>
      <p style={{
        color: 'var(--white-muted)',
        maxWidth: 380,
        lineHeight: 1.75,
        fontSize: '0.95rem',
        marginBottom: '2.5rem',
      }}>
        Sepertinya halaman yang kamu cari sudah dipindah, dihapus, atau memang tidak pernah ada.
        Yuk kembali ke beranda!
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="btn-primary"
          onClick={() => navigate('/')}
          style={{ padding: '12px 32px', borderRadius: 50, fontSize: 14 }}
        >
          ← Kembali ke Beranda
        </button>
        <button
          className="btn-outline"
          onClick={() => navigate(-1)}
          style={{ padding: '12px 32px', borderRadius: 50, fontSize: 14 }}
        >
          Halaman Sebelumnya
        </button>
      </div>

      <p style={{ marginTop: '3rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
        WCC Langkah Baru · Wedding Content Creator Prabumulih
      </p>
    </div>
  )
}
