import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import withAuth from './withAuth'

let mockIsAuthenticated = true

vi.mock('../../context/RecipeContext', () => ({
  useRecipes: () => ({
    isAuthenticated: mockIsAuthenticated
  })
}))

function SecretComponent({ message }) {
  return <div data-testid="secret">{message || 'Secret Content'}</div>
}

const ProtectedComponent = withAuth(SecretComponent)

describe('withAuth HOC (Task 7)', () => {

  it('renders the wrapped component when isAuthenticated is true', () => {
    mockIsAuthenticated = true
    render(<ProtectedComponent message="Hello Authenticated" />)

    expect(screen.getByTestId('secret')).toBeInTheDocument()
    expect(screen.getByText('Hello Authenticated')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })

  it('shows "Access Denied" when isAuthenticated is false', () => {
    mockIsAuthenticated = false
    render(<ProtectedComponent message="Should not appear" />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByTestId('secret')).not.toBeInTheDocument()
  })

  it('forwards props to the wrapped component', () => {
    mockIsAuthenticated = true
    render(<ProtectedComponent message="Forwarded Prop" />)

    expect(screen.getByText('Forwarded Prop')).toBeInTheDocument()
  })

  it('sets a descriptive displayName', () => {
    expect(ProtectedComponent.displayName).toBe('withAuth(SecretComponent)')
  })
})
