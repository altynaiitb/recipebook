import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom as the test environment (simulates browser DOM)
    environment: 'jsdom',
    // Run setupTests before each test file
    setupFiles: ['./src/setupTests.js'],
    // Allow Jest-style global APIs (describe, it, expect, etc.)
    globals: true,
    // Coverage configuration
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/setupTests.js']
    }
  }
})
