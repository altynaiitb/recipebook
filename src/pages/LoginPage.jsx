import React, { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRecipes } from '../context/RecipeContext'
import { DEMO_MODE } from '../lib/supabase'

// ============================================
// LoginPage — Glassmorphism email/password login
// Uses real Supabase signIn in production.
// In DEMO_MODE shows a quick-login button.
// ============================================

export default function LoginPage() {
  const { signIn, login, isAuthenticated } = useRecipes()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Already authenticated → redirect to home
  if (isAuthenticated) { navigate('/'); return null }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) { setError('Both fields are required.'); return }
    setError(''); setLoading(true)
    try {
      await signIn(email.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, password, signIn, navigate])

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">🍳</span>
          <h1 className="auth-title">Recipe Book</h1>
          <p className="auth-subtitle">Sign in to your personal cookbook</p>
        </div>

        {DEMO_MODE && (
          <div className="demo-banner">
            <span>🧪 Demo Mode — Supabase not configured</span>
            <button className="btn primary demo-quick-btn" onClick={() => { login(); navigate('/') }}>
              Quick Demo Login →
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="chef@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="btn primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? <><span className="mfa-spinner" aria-hidden></span> Signing in…</> : '🔐 Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="auth-link">Create one →</Link>
        </p>
      </div>
    </div>
  )
}
