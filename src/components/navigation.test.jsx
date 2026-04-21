import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'

import { RecipeProvider } from '../context/RecipeContext'
import { FavoritesProvider } from '../context/FavoritesContext'
import NavBar from '../components/NavBar'
import MFAForm from '../components/MFAForm'

// ============================================
// LAB 8: Navigation Tests (updated for MFA flow)
// ============================================

vi.mock('../api/mockApi', () => ({
  apiGetRecipes:  vi.fn(() => Promise.resolve([])),
  apiAddRecipe:   vi.fn((d) => Promise.resolve({ ...d, id: 999 })),
  apiUpdateRecipe: vi.fn((id, d) => Promise.resolve({ ...d, id })),
  apiDeleteRecipe: vi.fn(() => Promise.resolve({ success: true })),
  // LAB 8 SECURITY: MFA verification — always succeeds in navigation tests
  apiVerifyMFA:   vi.fn(() => Promise.resolve({ success: true, token: 'test-token' })),
}))

// Lightweight page stubs
const StubHome     = () => <div data-testid="page-home">Home Page</div>
const StubRecipes  = () => <div data-testid="page-recipes">Recipes Page</div>
const StubProfile  = () => <div data-testid="page-profile">Profile Page</div>
const StubExplore  = () => <div data-testid="page-explore">Explore Page</div>
const StubNotFound = () => <div data-testid="page-notfound">404 Not Found</div>

function renderWithNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <RecipeProvider>
        <FavoritesProvider>
          <NavBar />
          <MFAForm />
          <Routes>
            <Route path="/"        element={<StubHome />} />
            <Route path="/recipes" element={<StubRecipes />} />
            <Route path="/profile" element={<StubProfile />} />
            <Route path="/explore" element={<StubExplore />} />
            <Route path="*"        element={<StubNotFound />} />
          </Routes>
        </FavoritesProvider>
      </RecipeProvider>
    </MemoryRouter>
  )
}

describe('Navigation Tests (Lab 8)', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all NavBar links (Home, Recipes, Explore, Profile)', async () => {
    renderWithNav('/')
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Recipes')).toBeInTheDocument()
      expect(screen.getByText('Explore')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
    })
  })

  it('starts on the Home page at /', async () => {
    renderWithNav('/')
    await waitFor(() => {
      expect(screen.getByTestId('page-home')).toBeInTheDocument()
    })
  })

  it('clicking "Recipes" link navigates to /recipes', async () => {
    const user = userEvent.setup()
    renderWithNav('/')
    await user.click(screen.getByText('Recipes'))
    await waitFor(() => {
      expect(screen.getByTestId('page-recipes')).toBeInTheDocument()
    })
  })

  it('clicking "Profile" link navigates to /profile', async () => {
    const user = userEvent.setup()
    renderWithNav('/')
    await user.click(screen.getByText('Profile'))
    await waitFor(() => {
      expect(screen.getByTestId('page-profile')).toBeInTheDocument()
    })
  })

  it('clicking "Explore" link navigates to /explore', async () => {
    const user = userEvent.setup()
    renderWithNav('/')
    await user.click(screen.getByText('Explore'))
    await waitFor(() => {
      expect(screen.getByTestId('page-explore')).toBeInTheDocument()
    })
  })

  it('unknown route /xyz renders the 404 NotFound page', () => {
    renderWithNav('/xyz-unknown-route')
    expect(screen.getByTestId('page-notfound')).toBeInTheDocument()
  })

  it('NavBar brand displays the Recipe Book name', () => {
    renderWithNav('/')
    expect(screen.getByText('Recipe Book')).toBeInTheDocument()
  })

  it('Login triggers MFA flow; completing MFA restores authentication', async () => {
    const user = userEvent.setup()
    renderWithNav('/')

    // App starts authenticated
    await waitFor(() => {
      expect(screen.getByText(/Logout/i)).toBeInTheDocument()
    })

    // Logout
    await user.click(screen.getByText(/Logout/i))
    await waitFor(() => {
      expect(screen.getByText(/Login/i)).toBeInTheDocument()
    })

    // Login → triggers MFA pending (MFA modal appears)
    await user.click(screen.getByText(/Login/i))
    await waitFor(() => {
      expect(screen.getByTestId('mfa-digit-0')).toBeInTheDocument()
    })

    // Fill MFA code digit by digit
    for (let i = 0; i < 6; i++) {
      fireEvent.change(screen.getByTestId(`mfa-digit-${i}`), {
        target: { value: '123456'[i] }
      })
    }

    // Submit MFA
    const verifyBtn = screen.getByTestId('mfa-verify-btn')
    await user.click(verifyBtn)

    // Should now be fully authenticated
    await waitFor(() => {
      expect(screen.getByText(/Logout/i)).toBeInTheDocument()
    })
  })

  it('Cancel in MFA modal signs the user out completely', async () => {
    const user = userEvent.setup()
    renderWithNav('/')

    await waitFor(() => expect(screen.getByText(/Logout/i)).toBeInTheDocument())

    // Logout then Login → MFA appears
    await user.click(screen.getByText(/Logout/i))
    await waitFor(() => expect(screen.getByText(/Login/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Login/i))

    await waitFor(() => {
      expect(screen.getByTestId('mfa-digit-0')).toBeInTheDocument()
    })

    // Cancel → back to unauthenticated
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.queryByTestId('mfa-digit-0')).not.toBeInTheDocument()
      expect(screen.getByText(/Login/i)).toBeInTheDocument()
    })
  })
})
