// Lab 6 — Testing Setup
// Extends Vitest's "expect" with Jest-DOM matchers
import '@testing-library/jest-dom'

// ============================================
// MSW v2 — Intercept real HTTP calls in tests
// Handlers simulate Supabase REST API responses.
// Tests using vi.mock('../api/mockApi') still work
// via DEMO_MODE fallback in supabaseApi.js.
// MSW here adds a second layer for any direct
// HTTP calls that escape the mock boundary.
// ============================================
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Start the MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reset any handlers added inside individual tests
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())
