import React from 'react'
import { useRecipes } from '../context/RecipeContext'

// ============================================
// LAB 8 SECURITY: withAuth HOC — updated for MFA
// Checks 'isAuthenticated' which is now true ONLY when
// both login AND MFA verification are complete.
// Backward-compatible: withAuth.test.jsx mocks { isAuthenticated }
// and that behavior is preserved exactly.
// ============================================

export default function withAuth(WrappedComponent) {
  function AuthGuard(props) {
    // isAuthenticated === true only when authStage === 'authenticated'
    // (i.e., fully authenticated through MFA)
    const { isAuthenticated } = useRecipes()

    if (!isAuthenticated) {
      return (
        <div className="access-denied" style={{
          padding: '2rem',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '1rem',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔒</div>
          <h3 style={{ margin: '0 0 0.5rem' }}>Access Denied</h3>
          <p style={{ opacity: 0.6, margin: 0 }}>
            You must be logged in to access this feature.
          </p>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }

  AuthGuard.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
  return AuthGuard
}
