import React, { useState, useCallback } from 'react'
import { useRecipes } from '../../context/RecipeContext'
import { useNotifications } from '../../context/NotificationContext'
import { apiEnrollMFA, apiChallengeMFA, apiVerifyMFA, apiUnenrollMFA, apiListMFAFactors } from '../../api/supabaseApi'
import { DEMO_MODE } from '../../lib/supabase'

export default function MFAEnroll() {
  const { isAuthenticated } = useRecipes()
  const { addNotification } = useNotifications()

  const [step,       setStep]       = useState('idle')
  const [factorData, setFactorData] = useState(null)
  const [challenge,  setChallenge]  = useState(null)
  const [code,       setCode]       = useState('')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [factors,    setFactors]    = useState([])

  const loadFactors = useCallback(async () => {
    try { setFactors(await apiListMFAFactors()) } catch {}
  }, [])

  useState(() => { if (isAuthenticated) loadFactors() })

  const startEnroll = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await apiEnrollMFA()
      setFactorData(data)
      const ch = await apiChallengeMFA(data.id)
      setChallenge(ch)
      setStep('enrolling')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [])

  const verifyEnroll = useCallback(async (e) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Enter 6-digit code from your authenticator.'); return }
    setLoading(true); setError('')
    try {
      const result = await apiVerifyMFA(factorData?.id, challenge?.id, code)
      if (result.success) {
        addNotification('✅ Authenticator app enrolled! MFA is now active.', 'success')
        setStep('done'); loadFactors()
      } else {
        setError(result.message || 'Invalid code.')
      }
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [code, factorData, challenge, addNotification, loadFactors])

  const unenroll = useCallback(async (factorId) => {
    setLoading(true)
    try {
      await apiUnenrollMFA(factorId)
      addNotification('🗑️ MFA factor removed.', 'success')
      setFactors([]); setStep('idle')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [addNotification])

  if (!isAuthenticated) return null

  const hasFactor = factors.length > 0 || step === 'done'

  return (
    <div className="mfa-enroll-section">
      <h3 className="mfa-enroll-title">🔑 Authenticator App (TOTP)</h3>

      {hasFactor ? (
        <div className="mfa-enrolled-status">
          <span className="sec-ok">✅ Authenticator app enrolled — MFA active</span>
          {factors.map(f => (
            <button key={f.id} className="btn danger mfa-unenroll-btn" onClick={() => unenroll(f.id)} disabled={loading}>
              Remove
            </button>
          ))}
        </div>
      ) : step === 'idle' ? (
        <div>
          <p className="mfa-enroll-desc">
            Use Google Authenticator, Authy, or any TOTP app.
            {DEMO_MODE && ' (Demo mode — no real enrollment)'}
          </p>
          <button className="btn primary" onClick={startEnroll} disabled={loading}>
            {loading ? 'Starting…' : '➕ Enable 2FA'}
          </button>
        </div>
      ) : step === 'enrolling' && factorData ? (
        <div className="mfa-enroll-qr-step">
          <p className="mfa-enroll-desc">Scan this QR code with your authenticator app:</p>
          <div className="mfa-qr-wrapper">
            {factorData.totp?.qr_code.startsWith('data:') ? (
              <img
                src={factorData.totp?.qr_code}
                alt="MFA QR code"
                className="mfa-qr-img"
                width={180} height={180}
              />
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: factorData.totp?.qr_code }}
                className="mfa-qr-img"
                style={{ width: 180, height: 180 }}
              />
            )}
          </div>
          <p className="mfa-secret-hint">
            Or enter manually: <code>{factorData.totp?.secret}</code>
          </p>
          <form onSubmit={verifyEnroll} className="mfa-enroll-verify">
            <input
              type="text" inputMode="numeric" maxLength={6}
              placeholder="Enter 6-digit code"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
              className="mfa-code-input"
            />
            {error && <p className="mfa-error" role="alert">{error}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn" onClick={() => setStep('idle')}>Cancel</button>
              <button type="submit" className="btn primary" disabled={code.length !== 6 || loading}>
                {loading ? 'Verifying…' : 'Confirm & Enable'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {error && step === 'idle' && <p className="mfa-error">{error}</p>}
    </div>
  )
}
