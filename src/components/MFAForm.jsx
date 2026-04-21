import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRecipes } from '../context/RecipeContext'
import { apiVerifyMFA, apiChallengeMFA } from '../api/supabaseApi'
import { DEMO_MODE } from '../lib/supabase'

// ============================================
// MFAForm — Real TOTP verification via Supabase
// In DEMO_MODE: accepts '123456' (same as before)
// In PRODUCTION: calls supabase.auth.mfa.verify()
//   with the real factor/challenge from Supabase
// ============================================

export default function MFAForm() {
  const { isPendingMFA, completeMFA, logout, mfaFactorId, currentUser } = useRecipes()

  const [digits,      setDigits]      = useState(['', '', '', '', '', ''])
  const [challengeId, setChallengeId] = useState(null)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  const inputRefs = useRef([])

  // Create a fresh MFA challenge when the modal opens
  useEffect(() => {
    if (!isPendingMFA) return
    setDigits(['', '', '', '', '', ''])
    setError('')
    setLoading(false)

    if (!DEMO_MODE && mfaFactorId) {
      apiChallengeMFA(mfaFactorId)
        .then(c => setChallengeId(c.id))
        .catch(e => setError(`Challenge error: ${e.message}`))
    } else {
      setChallengeId('demo-challenge')
    }

    const t = setTimeout(() => inputRefs.current[0]?.focus(), 120)
    return () => clearTimeout(t)
  }, [isPendingMFA, mfaFactorId])

  const handleDigitChange = useCallback((i, v) => {
    if (!/^\d?$/.test(v)) return
    setDigits(prev => { const n = [...prev]; n[i] = v; return n })
    setError('')
    if (v && i < 5) inputRefs.current[i + 1]?.focus()
  }, [])

  const handleKeyDown = useCallback((i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }, [digits])

  const handlePaste = useCallback((e) => {
    e.preventDefault()
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (p.length === 6) { setDigits(p.split('')); setError(''); inputRefs.current[5]?.focus() }
  }, [])

  const code = digits.join('')

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Please enter all 6 digits.'); return }
    setLoading(true)
    try {
      const result = await apiVerifyMFA(mfaFactorId ?? '', challengeId ?? '', code)
      if (result.success) {
        completeMFA()
      } else {
        setError(result.message || 'Invalid code. Please try again.')
        setDigits(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 50)
      }
    } catch (err) {
      setError(err.message || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }, [code, mfaFactorId, challengeId, completeMFA])

  if (!isPendingMFA) return null

  const userLabel = currentUser?.user_metadata?.username || currentUser?.email || 'Chef User'

  return (
    <div className="mfa-backdrop" role="dialog" aria-modal="true" aria-label="Two-Factor Authentication">
      <div className="mfa-modal">
        <div className="mfa-icon-ring"><span className="mfa-icon">🔐</span></div>
        <h2 className="mfa-title">Two-Factor Authentication</h2>
        <p className="mfa-subtitle">
          {DEMO_MODE
            ? 'Enter the demo code to continue'
            : `Authenticator code for ${userLabel}`}
        </p>

        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div className="mfa-digits" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text" inputMode="numeric" maxLength={1}
                value={d}
                className={`mfa-digit${error ? ' mfa-digit-error' : ''}`}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                data-testid={`mfa-digit-${i}`}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error && <p className="mfa-error" role="alert">{error}</p>}

          {DEMO_MODE && (
            <div className="mfa-demo-hint">
              🔑 Demo code: <strong>123456</strong>
            </div>
          )}

          <div className="mfa-actions">
            <button type="button" className="btn mfa-cancel-btn" onClick={logout}>Cancel</button>
            <button
              type="submit"
              className="btn primary mfa-verify-btn"
              disabled={code.length !== 6 || loading}
              data-testid="mfa-verify-btn"
            >
              {loading ? <><span className="mfa-spinner" aria-hidden></span> Verifying…</> : '✓ Verify Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
