import { http, HttpResponse } from 'msw'

// ============================================
// MSW v2 Handlers — simulate real Supabase REST API
// Used in tests so components that fetch from Supabase
// get realistic responses without a real network call.
//
// Supabase REST endpoints follow PostgREST conventions:
//   GET  /rest/v1/recipes        → list
//   POST /rest/v1/recipes        → insert
//   PATCH /rest/v1/recipes?id=eq.X → update
//   DELETE /rest/v1/recipes?id=eq.X → delete
//   POST /auth/v1/token          → sign in
//   POST /auth/v1/signup         → sign up
// ============================================

const SUPABASE_URL = '*'  // wildcard — matches any project URL

const MOCK_RECIPES = [
  { id: 1, title: 'Pancakes',      category: 'Breakfast', rating: 4, tags: ['Quick'],   ingredients: 'Flour, Eggs',  description: 'Fluffy pancakes.', timer_minutes: 15, user_id: 'user-1' },
  { id: 2, title: 'Caesar Salad',  category: 'Lunch',     rating: 5, tags: ['Healthy'], ingredients: 'Lettuce',      description: 'Classic Caesar.',  timer_minutes: 10, user_id: 'user-1' },
  { id: 3, title: 'Grilled Salmon',category: 'Dinner',    rating: 5, tags: ['Healthy'], ingredients: 'Salmon',       description: 'Grilled salmon.',  timer_minutes: 20, user_id: 'user-1' },
]

const MOCK_SESSION = {
  access_token:  'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: {
    id: 'user-1', email: 'chef@test.com',
    user_metadata: { username: 'Chef User' },
    last_sign_in_at: new Date().toISOString()
  }
}

export const handlers = [
  // ── Recipes CRUD ──────────────────────────────────────────────────
  http.get('https://*.supabase.co/rest/v1/recipes', () => {
    return HttpResponse.json(MOCK_RECIPES)
  }),

  http.post('https://*.supabase.co/rest/v1/recipes', async ({ request }) => {
    const body = await request.json()
    const newRecipe = { ...body, id: Date.now(), created_at: new Date().toISOString() }
    return HttpResponse.json([newRecipe], { status: 201 })
  }),

  http.patch('https://*.supabase.co/rest/v1/recipes', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json([{ ...body, id: 999 }])
  }),

  http.delete('https://*.supabase.co/rest/v1/recipes', () => {
    return HttpResponse.json([], { status: 204 })
  }),

  // ── Auth: Sign In ─────────────────────────────────────────────────
  http.post('https://*.supabase.co/auth/v1/token', () => {
    return HttpResponse.json(MOCK_SESSION)
  }),

  // ── Auth: Sign Up ─────────────────────────────────────────────────
  http.post('https://*.supabase.co/auth/v1/signup', () => {
    return HttpResponse.json({ user: MOCK_SESSION.user, session: null })
  }),

  // ── Auth: Sign Out ────────────────────────────────────────────────
  http.post('https://*.supabase.co/auth/v1/logout', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // ── Auth: Get Session ─────────────────────────────────────────────
  http.get('https://*.supabase.co/auth/v1/user', () => {
    return HttpResponse.json(MOCK_SESSION.user)
  }),

  // ── MFA: Enroll ───────────────────────────────────────────────────
  http.post('https://*.supabase.co/auth/v1/factors', () => {
    return HttpResponse.json({
      id: 'factor-mock-id',
      type: 'totp',
      totp: { qr_code: 'data:image/svg+xml,...', secret: 'MOCK-SECRET' }
    })
  }),

  // ── MFA: Challenge ────────────────────────────────────────────────
  http.post('https://*.supabase.co/auth/v1/factors/:factorId/challenge', () => {
    return HttpResponse.json({ id: 'challenge-mock-id', factor_id: 'factor-mock-id' })
  }),

  // ── MFA: Verify ───────────────────────────────────────────────────
  http.post('https://*.supabase.co/auth/v1/factors/:factorId/verify', async ({ request }) => {
    const body = await request.json()
    if (body.code === '123456') {
      return HttpResponse.json(MOCK_SESSION)
    }
    return HttpResponse.json({ error: 'Invalid TOTP code' }, { status: 422 })
  }),
]
