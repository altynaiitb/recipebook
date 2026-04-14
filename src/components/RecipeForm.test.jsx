import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import RecipeForm from './RecipeForm'
import { RecipeProvider } from '../context/RecipeContext'

// ============================================
// LAB 7 Task 9: Hybrid Form Test
// Tests both controlled (title, category) and uncontrolled
// (ingredients, description) fields, plus validation.
// ============================================

const mockAddRecipe    = vi.fn()
const mockUpdateRecipe = vi.fn()
const mockSetEditing   = vi.fn()

let mockContextValue = {
  addRecipe:       mockAddRecipe,
  updateRecipe:    mockUpdateRecipe,
  editingRecipe:   null,
  setEditingRecipe: mockSetEditing,
  isAuthenticated: true
}

vi.mock('../context/RecipeContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useRecipes: () => mockContextValue
  }
})

function renderForm() {
  return render(
    <RecipeProvider>
      <RecipeForm />
    </RecipeProvider>
  )
}

describe('RecipeForm — Hybrid Form (Task 9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContextValue = {
      addRecipe:       mockAddRecipe,
      updateRecipe:    mockUpdateRecipe,
      editingRecipe:   null,
      setEditingRecipe: mockSetEditing,
      isAuthenticated: true
    }
  })

  // ── Controlled field tests ──

  it('renders title input (controlled) and reflects changes', async () => {
    const user = userEvent.setup()
    renderForm()

    const titleInput = screen.getByTestId('input-title')
    expect(titleInput).toHaveValue('')

    await user.type(titleInput, 'My Recipe')
    expect(titleInput).toHaveValue('My Recipe')
  })

  it('renders category select (controlled)', () => {
    renderForm()
    const select = screen.getByTestId('select-category')
    expect(select).toBeInTheDocument()
    expect(select.value).toBe('Breakfast')
  })

  // ── Uncontrolled field tests ──

  it('renders ingredients textarea (uncontrolled via ref)', () => {
    renderForm()
    const ingredientsArea = screen.getByTestId('input-ingredients')
    expect(ingredientsArea).toBeInTheDocument()
    expect(ingredientsArea.tagName).toBe('TEXTAREA')
  })

  it('renders description textarea (uncontrolled via ref)', () => {
    renderForm()
    const descArea = screen.getByTestId('input-description')
    expect(descArea).toBeInTheDocument()
    expect(descArea.tagName).toBe('TEXTAREA')
  })

  // ── Validation tests ──

  it('shows validation error for title < 3 chars on blur', async () => {
    const user = userEvent.setup()
    renderForm()

    const titleInput = screen.getByTestId('input-title')
    await user.type(titleInput, 'AB')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('shows validation error for empty ingredients on blur', async () => {
    const user = userEvent.setup()
    renderForm()

    const ingredientsArea = screen.getByTestId('input-ingredients')
    await user.click(ingredientsArea)
    await user.tab()

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      const ingredientAlert = alerts.find(a => a.textContent.toLowerCase().includes('ingredients'))
      expect(ingredientAlert).toBeTruthy()
    })
  })

  it('shows validation error for empty description on blur', async () => {
    const user = userEvent.setup()
    renderForm()

    const descArea = screen.getByTestId('input-description')
    await user.click(descArea)
    await user.tab()

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      const descAlert = alerts.find(a => a.textContent.toLowerCase().includes('description'))
      expect(descAlert).toBeTruthy()
    })
  })

  it('submit button is disabled when form is invalid', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /add recipe/i })).toBeDisabled()
  })

  // ── Submit test ──

  it('calls addRecipe with both controlled and uncontrolled values on submit', async () => {
    const user = userEvent.setup()
    renderForm()

    // Fill controlled fields
    await user.type(screen.getByTestId('input-title'), 'Pizza')
    await user.selectOptions(screen.getByTestId('select-category'), 'Dinner')

    // Fill uncontrolled fields (via fireEvent since they are uncontrolled)
    const ingredientsArea = screen.getByTestId('input-ingredients')
    fireEvent.change(ingredientsArea, { target: { value: 'Dough, Sauce, Cheese' } })
    fireEvent.blur(ingredientsArea)

    const descArea = screen.getByTestId('input-description')
    fireEvent.change(descArea, { target: { value: 'Bake at 250°C for 12 minutes' } })
    fireEvent.blur(descArea)

    // Submit
    const submitBtn = screen.getByRole('button', { name: /add recipe/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockAddRecipe).toHaveBeenCalledTimes(1)
      const arg = mockAddRecipe.mock.calls[0][0]
      // Controlled values
      expect(arg.title).toBe('Pizza')
      expect(arg.category).toBe('Dinner')
      // Uncontrolled values
      expect(arg.ingredients).toBe('Dough, Sauce, Cheese')
      expect(arg.description).toBe('Bake at 250°C for 12 minutes')
    })
  })

  // ── Edit mode ──

  it('prefills all fields in edit mode and calls updateRecipe', async () => {
    const user = userEvent.setup()
    mockContextValue = {
      ...mockContextValue,
      editingRecipe: {
        id: 42,
        title: 'Old Title',
        category: 'Lunch',
        ingredients: 'Eggs',
        description: 'Old instructions',
        tags: [],
        rating: 3,
        timerMinutes: 10
      }
    }

    renderForm()

    // Controlled fields should be prefilled
    expect(screen.getByTestId('input-title')).toHaveValue('Old Title')
    expect(screen.getByTestId('select-category')).toHaveValue('Lunch')

    // Uncontrolled fields should be prefilled via refs
    expect(screen.getByTestId('input-ingredients')).toHaveValue('Eggs')
    expect(screen.getByTestId('input-description')).toHaveValue('Old instructions')

    // Submit edit
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(mockUpdateRecipe).toHaveBeenCalledTimes(1)
    })
  })

  it('Cancel resets all fields and calls setEditingRecipe(null)', async () => {
    const user = userEvent.setup()
    mockContextValue = {
      ...mockContextValue,
      editingRecipe: {
        id: 42,
        title: 'Old Title',
        category: 'Lunch',
        ingredients: 'Eggs',
        description: 'Old instructions',
        tags: [],
        rating: 3,
        timerMinutes: 10
      }
    }

    renderForm()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockSetEditing).toHaveBeenCalledWith(null)
  })
})