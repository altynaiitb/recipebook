import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// ============================================
// MSW Server for Vitest / Node environment
// Used in test files that need HTTP-level mocking
// of Supabase API calls (not just vi.mock)
// ============================================

export const server = setupServer(...handlers)
