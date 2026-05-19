import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from '../context/NotificationContext'
import { RecipeProvider }       from '../context/RecipeContext'
import { FavoritesProvider }    from '../context/FavoritesContext'
import { TimerProvider }        from '../context/TimerContext'

const MOCK_RECIPES = [
  { id: 201, title: 'Pancakes',      category: 'Breakfast', rating: 4, tags: ['Quick'],   ingredients: 'Flour, Eggs, Milk',    description: 'Fluffy pancakes.'    },
  { id: 202, title: 'Caesar Salad',  category: 'Lunch',     rating: 5, tags: ['Healthy'], ingredients: 'Lettuce, Croutons',    description: 'Classic Caesar.'     },
  { id: 203, title: 'Grilled Salmon',category: 'Dinner',    rating: 5, tags: ['Healthy'], ingredients: 'Salmon, Lemon, Dill', description: 'Oven grilled salmon.' },
]

vi.mock('../api/mockApi', () => ({
  apiGetRecipes:   vi.fn(() => Promise.resolve(MOCK_RECIPES)),
  apiAddRecipe:    vi.fn((data) => Promise.resolve({ ...data, id: Date.now() })),
  apiUpdateRecipe: vi.fn((id, data) => Promise.resolve({ ...data, id })),
  apiDeleteRecipe: vi.fn((id) => Promise.resolve({ success: true, id })),
  // LAB 8 SECURITY: MFA mock — always succeeds in integration tests
  apiVerifyMFA:    vi.fn(() => Promise.resolve({ success: true, token: 'test-token' })),
}))

vi.mock('../lib/supabase', () => ({
  DEMO_MODE: true,
  supabase: {
    auth: { onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) }
  }
}))

import RecipesPage         from '../pages/RecipesPage'
import NavBar              from '../components/NavBar'
import NotificationToast   from '../components/NotificationToast'
import MFAForm             from '../components/MFAForm'

function renderApp() {
  return render(
    <BrowserRouter>
      <NotificationProvider>
        <RecipeProvider>
          <FavoritesProvider>
            <TimerProvider>
              <NavBar />
              <NotificationToast />
              <MFAForm />
              <RecipesPage />
            </TimerProvider>
          </FavoritesProvider>
        </RecipeProvider>
      </NotificationProvider>
    </BrowserRouter>
  )
}

// ── Helper: complete the MFA flow (used in full-cycle test) ───────────────
async function completeMFAFlow(user) {
  await waitFor(() => {
    expect(screen.getByTestId('mfa-digit-0')).toBeInTheDocument()
  })
  for (let i = 0; i < 6; i++) {
    fireEvent.change(screen.getByTestId(`mfa-digit-${i}`), {
      target: { value: '123456'[i] }
    })
  }
  await user.click(screen.getByTestId('mfa-verify-btn'))
  await waitFor(() => {
    expect(screen.queryByTestId('mfa-digit-0')).not.toBeInTheDocument()
  })
}

describe('Integration Test — Core Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('loads and displays recipes from the mock API', async () => {
    renderApp()
    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument()
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument()
      expect(screen.getByText('Grilled Salmon')).toBeInTheDocument()
    })
  })

  it('filters recipes by search text', async () => {
    const user = userEvent.setup()
    renderApp()
    await waitFor(() => expect(screen.getByText('Pancakes')).toBeInTheDocument())

    const searchInput = screen.getByPlaceholderText('Search by title...')
    await user.type(searchInput, 'Pancakes')

    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument()
      expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument()
      expect(screen.queryByText('Grilled Salmon')).not.toBeInTheDocument()
    })
  })

  it('opens a recipe modal with lazy-loaded content', async () => {
    renderApp()
    await waitFor(() => expect(screen.getByText('Pancakes')).toBeInTheDocument())
    const viewButtons = screen.getAllByText('View')
    fireEvent.click(viewButtons[0])
    await waitFor(() => {
      const modalTitles = screen.getAllByText(/Pancakes|Caesar Salad|Grilled Salmon/)
      expect(modalTitles.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('adds a recipe via the form modal', async () => {
    const user = userEvent.setup()
    const { apiAddRecipe } = await import('../api/mockApi')

    renderApp()
    await waitFor(() => expect(screen.getByText('Pancakes')).toBeInTheDocument())

    // Open form modal
    const addBtn = screen.getByRole('button', { name: /add new recipe/i })
    await user.click(addBtn)

    // Fill fields
    const titleInput = await screen.findByTestId('input-title')
    await user.type(titleInput, 'New Test Recipe')
    await user.selectOptions(screen.getByTestId('select-category'), 'Dinner')

    fireEvent.change(screen.getByTestId('input-ingredients'), { target: { value: 'Chicken, Rice, Spices' } })
    fireEvent.blur(screen.getByTestId('input-ingredients'))

    fireEvent.change(screen.getByTestId('input-description'), { target: { value: 'Cook chicken with spices and serve over rice.' } })
    fireEvent.blur(screen.getByTestId('input-description'))

    await user.click(screen.getByRole('button', { name: /add recipe/i }))

    await waitFor(() => {
      expect(apiAddRecipe).toHaveBeenCalledTimes(1)
      const arg = apiAddRecipe.mock.calls[0][0]
      expect(arg.title).toBe('New Test Recipe')
      expect(arg.category).toBe('Dinner')
      expect(arg.ingredients).toBe('Chicken, Rice, Spices')
    })
  })
})

// ============================================
// LAB 8 SECURITY: Full-Cycle Integration Test
// Logout → Login → MFA → Add Recipe → Toast → In List
// ============================================

describe('Integration Test — Full Cycle with MFA (Lab 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('full cycle: logout → login → MFA verify → add recipe → see toast → recipe in list', async () => {
    const user = userEvent.setup()
    const { apiAddRecipe, apiVerifyMFA } = await import('../api/mockApi')

    renderApp()

    // 1. Wait for initial recipe load
    await waitFor(() => expect(screen.getByText('Pancakes')).toBeInTheDocument())

    // 2. Logout
    const logoutBtn = screen.getByText(/Logout/i)
    await user.click(logoutBtn)
    await waitFor(() => expect(screen.getByText(/Login/i)).toBeInTheDocument())

    // 3. Click Add Recipe → "Access Denied" (unauthenticated)
    const addBtn = screen.getByRole('button', { name: /add new recipe/i })
    await user.click(addBtn)
    await waitFor(() => expect(screen.getByText(/access denied/i)).toBeInTheDocument())

    // Close the modal
    const closeBtn = screen.getByLabelText('Close modal')
    await user.click(closeBtn)

    // 4. Login → MFA modal appears
    await user.click(screen.getByText(/Login/i))

    // 5. Complete MFA
    await completeMFAFlow(user)

    // 6. Now authenticated — open Add Recipe modal
    const addBtn2 = screen.getByRole('button', { name: /add new recipe/i })
    await user.click(addBtn2)

    // 7. Fill the form
    const titleInput = await screen.findByTestId('input-title')
    await user.type(titleInput, 'My Full-Cycle Dish')

    fireEvent.change(screen.getByTestId('input-ingredients'), { target: { value: 'Tomatoes, Basil, Olive oil' } })
    fireEvent.blur(screen.getByTestId('input-ingredients'))

    fireEvent.change(screen.getByTestId('input-description'), { target: { value: 'Mix everything and serve fresh.' } })
    fireEvent.blur(screen.getByTestId('input-description'))

    // 8. Submit
    await user.click(screen.getByRole('button', { name: /add recipe/i }))

    // 9. API called
    await waitFor(() => {
      expect(apiAddRecipe).toHaveBeenCalledTimes(1)
      expect(apiAddRecipe.mock.calls[0][0].title).toBe('My Full-Cycle Dish')
    })

    // 10. Success toast appears
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      const successToast = alerts.find(a => a.textContent.includes('My Full-Cycle Dish'))
      expect(successToast).toBeInTheDocument()
    })

    // 11. Recipe appears in list
    await waitFor(() => {
      expect(screen.getByText('My Full-Cycle Dish')).toBeInTheDocument()
    })
  })

  it('shows error toast when API fails to add recipe', async () => {
    const user = userEvent.setup()
    const { apiAddRecipe } = await import('../api/mockApi')
    apiAddRecipe.mockRejectedValueOnce(new Error('Server unavailable'))

    renderApp()
    await waitFor(() => expect(screen.getByText('Pancakes')).toBeInTheDocument())

    const addBtn = screen.getByRole('button', { name: /add new recipe/i })
    await user.click(addBtn)

    const titleInput = await screen.findByTestId('input-title')
    await user.type(titleInput, 'Will Fail')

    fireEvent.change(screen.getByTestId('input-ingredients'), { target: { value: 'Test ingredient' } })
    fireEvent.blur(screen.getByTestId('input-ingredients'))

    fireEvent.change(screen.getByTestId('input-description'), { target: { value: 'Test description here.' } })
    fireEvent.blur(screen.getByTestId('input-description'))

    await user.click(screen.getByRole('button', { name: /add recipe/i }))

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      const errorToast = alerts.find(a => a.textContent.includes('Server unavailable'))
      expect(errorToast).toBeInTheDocument()
    })
  })

  it('MFA invalid code shows error message in modal', async () => {
    const user = userEvent.setup()
    const { apiVerifyMFA } = await import('../api/mockApi')
    apiVerifyMFA.mockResolvedValueOnce({ success: false, message: 'Invalid code. Try: 123456' })

    renderApp()
    await waitFor(() => expect(screen.getByText('Pancakes')).toBeInTheDocument())
    await user.click(screen.getByText(/Logout/i))
    await waitFor(() => expect(screen.getByText(/Login/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Login/i))
    await waitFor(() => expect(screen.getByTestId('mfa-digit-0')).toBeInTheDocument())
    for (let i = 0; i < 6; i++) {
      fireEvent.change(screen.getByTestId(`mfa-digit-${i}`), { target: { value: '9' } })
    }
    await user.click(screen.getByTestId('mfa-verify-btn'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
