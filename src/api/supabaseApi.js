/**
 * supabaseApi.js — Production API layer
 *
 * DEMO_MODE (no real Supabase keys):
 *   All functions delegate to mockApi.js (localStorage) so the
 *   app and ALL existing tests continue to work unchanged.
 *
 * PRODUCTION (real VITE_SUPABASE_URL set in .env.local):
 *   All functions call the real Supabase backend with JWT auth,
 *   PostgreSQL rows, and server-side TOTP MFA.
 *
 * RecipeContext imports from this file exclusively.
 */

import { supabase, DEMO_MODE } from '../lib/supabase'

// ── Lazy import of mockApi (only used in DEMO_MODE) ──────────────────────
async function mock() {
  return import('./mockApi')
}

// ════════════════════════════════════════════════════════════════════
//  CRUD — Recipes
// ════════════════════════════════════════════════════════════════════

export async function apiGetRecipes() {
  if (DEMO_MODE) return (await mock()).apiGetRecipes()

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data.map(r => ({ ...r, tags: r.tags ?? [] }))
}

export async function apiAddRecipe(recipeData) {
  if (DEMO_MODE) return (await mock()).apiAddRecipe(recipeData)

  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...recipeData, user_id: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function apiUpdateRecipe(id, recipeData) {
  if (DEMO_MODE) return (await mock()).apiUpdateRecipe(id, recipeData)

  const { data, error } = await supabase
    .from('recipes')
    .update(recipeData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function apiDeleteRecipe(id) {
  if (DEMO_MODE) return (await mock()).apiDeleteRecipe(id)

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return { success: true, id }
}

// ════════════════════════════════════════════════════════════════════
//  Auth — Sign Up / Sign In / Sign Out / Session
// ════════════════════════════════════════════════════════════════════

/**
 * Sign up with email + password + optional username.
 * Returns the new user. Supabase sends a confirmation email.
 */
export async function apiSignUp(email, password, username = '') {
  if (DEMO_MODE) {
    return { user: { id: 'demo-id', email, user_metadata: { username } }, isDemo: true }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  })
  if (error) throw new Error(error.message)
  return data
}

/**
 * Sign in. Returns { user, session, needsMFA }.
 * needsMFA = true when the user has enrolled TOTP and must reach AAL2.
 */
export async function apiSignIn(email, password) {
  if (DEMO_MODE) {
    return {
      user:    { id: 'demo-id', email, user_metadata: { username: 'Chef User' } },
      session: null,
      needsMFA: false
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)

  // Check if user needs to step up to AAL2 (has TOTP enrolled)
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const needsMFA = aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2'

  let factorId = null
  if (needsMFA) {
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (!factorsError && factors && factors.totp && factors.totp.length > 0) {
      factorId = factors.totp[0].id
    }
  }

  return { user: data.user, session: data.session, needsMFA, factorId }
}

/** Sign out and clear local session */
export async function apiSignOut() {
  if (DEMO_MODE) return { error: null }
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
  return { error: null }
}

/** Get the current persisted session (for page-refresh persistence) */
export async function apiGetSession() {
  if (DEMO_MODE) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/** Subscribe to auth state changes. Returns unsubscribe function. */
export function apiOnAuthChange(callback) {
  if (DEMO_MODE) return () => {}
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return () => subscription.unsubscribe()
}

// ════════════════════════════════════════════════════════════════════
//  MFA — TOTP Enrollment & Verification
// ════════════════════════════════════════════════════════════════════

/**
 * Begin TOTP enrollment. Returns { id, totp: { qr_code, secret } }.
 * In DEMO_MODE returns a fake QR code for UI demonstration.
 */
export async function apiEnrollMFA() {
  if (DEMO_MODE) {
    return {
      id: 'demo-factor-id',
      type: 'totp',
      totp: {
        qr_code: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f3f4f6'/><text x='50' y='55' text-anchor='middle' font-size='10' fill='%23374151'>DEMO QR</text></svg>`,
        secret:  'DEMO-SECRET-BASE32'
      }
    }
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
  if (error) throw new Error(error.message)
  return data
}

/**
 * Create a challenge for a given factorId.
 * Must be called before verify.
 */
export async function apiChallengeMFA(factorId) {
  if (DEMO_MODE) return { id: 'demo-challenge-id' }
  const { data, error } = await supabase.auth.mfa.challenge({ factorId })
  if (error) throw new Error(error.message)
  return data
}

/**
 * Verify the TOTP code. Returns updated session on success.
 * DEMO_MODE: '123456' always succeeds.
 */
export async function apiVerifyMFA(factorId, challengeId, code) {
  if (DEMO_MODE) {
    if (String(code) === '123456') return { success: true }
    return { success: false, message: 'Invalid code. Demo code: 123456' }
  }

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code
  })
  if (error) return { success: false, message: error.message }
  return { success: true, data }
}

/**
 * Unenroll (remove) a TOTP factor.
 */
export async function apiUnenrollMFA(factorId) {
  if (DEMO_MODE) return { success: true }
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw new Error(error.message)
  return { success: true }
}

/**
 * Get list of enrolled MFA factors for the current user.
 */
export async function apiListMFAFactors() {
  if (DEMO_MODE) return []
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw new Error(error.message)
  return data.totp ?? []
}
