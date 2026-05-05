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

  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const reset = () => { setError(''); setSuccess('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    reset()
    setLoading(true)

    try {
      if (mode === 'register') {
        if (!name.trim()) { setError('Nama lengkap wajib diisi.'); setLoading(false); return }
        if (password.length < 6) { setError('Password minimal 6 karakter.'); setLoading(false); return }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        })
        if (error) throw error
        setSuccess('Akun berhasil dibuat! Cek email kamu untuk verifikasi, lalu login.')
        setMode('login')
        setPassword('')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      const msg = err.message || 'Terjadi kesalahan'
      if (msg.includes('Invalid login credentials')) setError('Email atau password salah.')
      else if (msg.includes('Email not confirmed')) setError('Email belum diverifikasi. Cek inbox kamu.')
      else if (msg.includes('User already registered')) setError('Email ini sudah terdaftar. Silahkan login.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      {/* Back to home */}
      <a href="/" className="auth-back" onClick={e => { e.preventDefault(); navigate('/') }}>
        ← Kembali ke Website
      </a>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="logo-lk">LK</span>
          <span className="logo-sub">Langkah Baru</span>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => { setMode('login'); reset() }}
          >
            Masuk
          </button>
          <button
            className={`auth-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => { setMode('register'); reset() }}
          >
            Daftar
          </button>
        </div>

        <div className="auth-heading">
          <h1>{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}</h1>
          <p>{mode === 'login' ? 'Masuk untuk melanjutkan' : 'Daftar untuk memesan layanan kami'}</p>
        </div>

        {error && (
          <div className="auth-alert error">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="auth-alert success">
            <span>✅</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Nama Lengkap</label>
              <input
                id="name"
                className="form-control"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-control"
              type="email"
              placeholder="contoh@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
              {mode === 'login' && (
                <a href="#" className="auth-forgot" onClick={async e => {
                  e.preventDefault()
                  if (!email) { setError('Masukkan email dulu untuk reset password.'); return }
                  reset()
                  setLoading(true)
                  await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth' })
                  setSuccess('Link reset password telah dikirim ke email kamu.')
                  setLoading(false)
                }}>
                  Lupa password?
                </a>
              )}
            </div>
            <div className="input-wrap">
              <input
                id="password"
                className="form-control"
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Minimal 6 karakter' : 'Masukkan password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
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
