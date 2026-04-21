import { createClient } from '@supabase/supabase-js'

// ============================================
// Supabase client singleton
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
// Without them the app runs in DEMO_MODE (localStorage mock).
// ============================================

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  ?? 'https://placeholder.supabase.co'
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
    storage:             window?.localStorage
  }
})

export const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL
  || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co'

console.log(
  DEMO_MODE
    ? '⚠️ SUPABASE AUTH: Running in DEMO_MODE (using local mock data). Please set VITE_SUPABASE_URL.'
    : '✅ SUPABASE AUTH: Running in REAL_MODE with live database.'
)
