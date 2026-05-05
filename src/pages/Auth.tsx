import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'register'

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)

  const { user, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in based on role
  useEffect(() => {
    if (!authLoading && user && role !== null) {
      navigate(role === 'admin' ? '/admin' : '/', { replace: true })
    }
  }, [user, role, authLoading, navigate])

  const reset = () => { setError(''); setSuccess('') }

  const createProfile = async (userId: string, fullName: string) => {
    try {
      await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, full_name: fullName }),
      })
    } catch {
      // Silent fail — trigger in Supabase may handle this
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!name.trim()) { setError('Nama lengkap wajib diisi.'); setLoading(false); return }
        if (password.length < 6) { setError('Password minimal 6 karakter.'); setLoading(false); return }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        })
        if (error) throw error

        // Create profile with role='user' via API
        if (data.user) {
          await createProfile(data.user.id, name.trim())
        }

        setSuccess('Akun berhasil dibuat! Silakan cek email untuk verifikasi, lalu login.')
        setMode('login')
        setPassword('')
        setName('')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        // Role-based redirect is handled by useEffect above via AuthContext
        // But if profile doesn't exist yet, create it
        if (data.user) {
          await createProfile(data.user.id, data.user.user_metadata?.full_name || '')
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Terjadi kesalahan'
      if (msg.includes('Invalid login credentials')) setError('Email atau password salah.')
      else if (msg.includes('Email not confirmed')) setError('Email belum diverifikasi. Cek inbox kamu.')
      else if (msg.includes('User already registered')) setError('Email ini sudah terdaftar. Silakan login.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-bg"><div className="orb orb-1" /><div className="orb orb-2" /></div>
        <div className="auth-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <div style={{ color: 'var(--white-muted)', fontSize: 14 }}>Memuat...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <a href="/" className="auth-back" onClick={e => { e.preventDefault(); navigate('/') }}>
        ← Kembali ke Website
      </a>

      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-lk">LK</span>
          <span className="logo-sub">Langkah Baru</span>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); reset() }}>
            Masuk
          </button>
          <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => { setMode('register'); reset() }}>
            Daftar
          </button>
        </div>

        <div className="auth-heading">
          <h1>{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}</h1>
          <p>{mode === 'login' ? 'Masuk untuk melanjutkan' : 'Daftar untuk memesan layanan kami'}</p>
        </div>

        {error && <div className="auth-alert error"><span>⚠️</span> {error}</div>}
        {success && <div className="auth-alert success"><span>✅</span> {success}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Nama Lengkap</label>
              <input id="name" className="form-control" type="text" placeholder="Masukkan nama lengkap"
                autoComplete="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" className="form-control" type="email" placeholder="contoh@email.com"
              autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
              {mode === 'login' && (
                <a href="#" className="auth-forgot" onClick={async e => {
                  e.preventDefault()
                  if (!email) { setError('Masukkan email dulu.'); return }
                  reset(); setLoading(true)
                  await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth' })
                  setSuccess('Link reset password dikirim ke email kamu.')
                  setLoading(false)
                }}>Lupa password?</a>
              )}
            </div>
            <div className="input-wrap">
              <input id="password" className="form-control" type={showPass ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan password'}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="input-eye" onClick={() => setShowPass(s => !s)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? '⏳ Memproses...' : mode === 'login' ? '🔐 Masuk' : '✨ Buat Akun'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); reset() }}>
            {mode === 'login' ? 'Daftar sekarang' : 'Masuk disini'}
          </button>
        </p>
      </div>
    </div>
  )
}
