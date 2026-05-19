import React, { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRecipes } from '../context/RecipeContext'

// ============================================
// SignUpPage — Real account creation via Supabase Auth
// Supabase handles password hashing server-side (bcrypt).
// Sends confirmation email before account is active.
// ============================================

export default function SignUpPage() {
  const { signUp, isAuthenticated } = useRecipes()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Safely navigate after authentication without rendering a <Navigate> component
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !username.trim() || !password || !confirm) {
      setError('All fields are required.'); return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.'); return
    }
    if (password !== confirm) {
      setError('Passwords do not match.'); return
    }

    setLoading(true)
    try {
      await signUp(email.trim(), password, username.trim())
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Sign-up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, username, password, confirm, signUp])

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-success-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">📬</span>
            <h1 className="auth-title">Check Your Email</h1>
            <p className="auth-subtitle">
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account, then sign in.
            </p>
          </div>
          <Link to="/login" className="btn primary auth-submit-btn" style={{ textAlign: 'center', display: 'block' }}>
            Go to Sign In →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">👨‍🍳</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join your personal cookbook</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              type="text"
              placeholder="Chef John"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="chef@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-password">Password <span className="field-hint">(min 8 chars)</span></label>
            <input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button type="submit" className="btn primary auth-submit-btn" disabled={loading}>
            {loading ? <><span className="mfa-spinner" aria-hidden></span> Creating…</> : '✨ Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
