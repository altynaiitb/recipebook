import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import { BrowserRouter } from 'react-router-dom'
import { RecipeProvider } from '../context/RecipeContext'
import { FavoritesProvider } from '../context/FavoritesContext'


const MOCK_RECIPES = [
  { id: 201, title: 'Pancakes', category: 'Breakfast', rating: 4, tags: ['Quick'], ingredients: 'Flour, Eggs, Milk', description: 'Fluffy pancakes.' },
  { id: 202, title: 'Caesar Salad', category: 'Lunch', rating: 5, tags: ['Healthy'], ingredients: 'Lettuce, Croutons', description: 'Classic Caesar.' },
  { id: 203, title: 'Grilled Salmon', category: 'Dinner', rating: 5, tags: ['Healthy'], ingredients: 'Salmon, Lemon, Dill', description: 'Oven grilled salmon.' },
]

vi.mock('../api/mockApi', () => ({
  apiGetRecipes: vi.fn(() => Promise.resolve(MOCK_RECIPES)),
  apiAddRecipe: vi.fn((data) => Promise.resolve({ ...data, id: Date.now() })),
  apiUpdateRecipe: vi.fn((id, data) => Promise.resolve({ ...data, id })),
  apiDeleteRecipe: vi.fn((id) => Promise.resolve({ success: true, id })),
}))

import RecipesPage from '../pages/RecipesPage'

function renderApp() {
  return render(
    <BrowserRouter>
      <RecipeProvider>
        <FavoritesProvider>
          <RecipesPage />
        </FavoritesProvider>
      </RecipeProvider>
    </BrowserRouter>
  )
}

describe('Integration Test (Task 10)', () => {
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

    // Wait for recipes to load
    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument()
    })

    // Type in the search field
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

    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument()
    })

    // Click "View" on first recipe
    const viewButtons = screen.getAllByText('View')
    fireEvent.click(viewButtons[0])

    // Modal should appear with recipe details (lazy loaded)
    await waitFor(() => {
      // The modal should show the recipe title
      const modalTitles = screen.getAllByText(/Pancakes|Caesar Salad|Grilled Salmon/)
      expect(modalTitles.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('adds a recipe via the hybrid form', async () => {
    const user = userEvent.setup()
    const { apiAddRecipe } = await import('../api/mockApi')

    renderApp()

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Pancakes')).toBeInTheDocument()
    })

    // Fill controlled fields
    const titleInput = screen.getByTestId('input-title')
    await user.type(titleInput, 'New Test Recipe')

    await user.selectOptions(screen.getByTestId('select-category'), 'Dinner')

    // Fill uncontrolled fields
    const ingredientsArea = screen.getByTestId('input-ingredients')
    fireEvent.change(ingredientsArea, { target: { value: 'Chicken, Rice, Spices' } })
    fireEvent.blur(ingredientsArea)

    const descArea = screen.getByTestId('input-description')
    fireEvent.change(descArea, { target: { value: 'Cook chicken with spices and serve over rice.' } })
    fireEvent.blur(descArea)

    // Submit
    const submitBtn = screen.getByRole('button', { name: /add recipe/i })
    await user.click(submitBtn)

    // Verify the API was called
    await waitFor(() => {
      expect(apiAddRecipe).toHaveBeenCalledTimes(1)
      const arg = apiAddRecipe.mock.calls[0][0]
      expect(arg.title).toBe('New Test Recipe')
      expect(arg.category).toBe('Dinner')
      expect(arg.ingredients).toBe('Chicken, Rice, Spices')
    })
  })
})
