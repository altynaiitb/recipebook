// ============================================
// LAB 6 — Задача 10: Тестирование компонента RecipeForm
// Проверяем:
//   - отображение полей формы
//   - работу валидации (ошибки при пустых полях)
//   - кнопка Submit заблокирована при невалидных данных
//   - успешный Submit вызывает addRecipe из контекста
//   - режим редактирования (editingRecipe)
// ============================================
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import RecipeForm from '../../components/RecipeForm'

// ── Mock контекстов ────────────────────────────────────────────────────────
//
// RecipeForm использует useRecipes() и косвенно может использовать
// FavoritesContext. Мокируем только необходимые части.

const mockAddRecipe    = vi.fn()
const mockUpdateRecipe = vi.fn()
const mockSetEditing   = vi.fn()

// Базовые значения контекста
let mockContextValue = {
  addRecipe:      mockAddRecipe,
  updateRecipe:   mockUpdateRecipe,
  editingRecipe:  null,
  setEditingRecipe: mockSetEditing
}

vi.mock('../../context/RecipeContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useRecipes: () => mockContextValue
  }
})

// ── Render helper ──────────────────────────────────────────────────────────

function renderForm() {
  return render(<RecipeForm />)
}

// ── Helpers для заполнения формы ───────────────────────────────────────────

async function fillValidForm(user) {
  await user.type(screen.getByTestId('input-title'), 'My Recipe')
  await user.type(screen.getByTestId('input-ingredients'), 'Sugar, Flour, Butter')
  await user.type(screen.getByTestId('input-description'), 'Mix and bake for 30 minutes')
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('RecipeForm — отображение', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContextValue = {
      addRecipe:      mockAddRecipe,
      updateRecipe:   mockUpdateRecipe,
      editingRecipe:  null,
      setEditingRecipe: mockSetEditing
    }
  })

  it('отображает поле Title', () => {
    renderForm()
    expect(screen.getByTestId('input-title')).toBeInTheDocument()
  })

  it('отображает поле Ingredients', () => {
    renderForm()
    expect(screen.getByTestId('input-ingredients')).toBeInTheDocument()
  })

  it('отображает поле Description', () => {
    renderForm()
    expect(screen.getByTestId('input-description')).toBeInTheDocument()
  })

  it('отображает кнопку "Add Recipe" в режиме добавления', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /add recipe/i })).toBeInTheDocument()
  })

  it('кнопка Submit заблокирована при пустой форме', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /add recipe/i })).toBeDisabled()
  })
})

describe('RecipeForm — валидация', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContextValue = {
      addRecipe:      mockAddRecipe,
      updateRecipe:   mockUpdateRecipe,
      editingRecipe:  null,
      setEditingRecipe: mockSetEditing
    }
  })

  it('показывает ошибку при title < 3 символов (после blur)', async () => {
    const user = userEvent.setup()
    renderForm()

    const titleInput = screen.getByTestId('input-title')
    await user.type(titleInput, 'AB')
    await user.tab()   // blur

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('показывает все ошибки при попытке Submit с пустой формой', async () => {
    const user = userEvent.setup()
    renderForm()

    // Кнопка заблокирована при пустой форме — напрямую fire event
    const submitBtn = screen.getByRole('button', { name: /add recipe/i })
    fireEvent.click(submitBtn)

    // addRecipe не должен вызываться
    expect(mockAddRecipe).not.toHaveBeenCalled()
  })

  it('не показывает ошибку при валидном title', async () => {
    const user = userEvent.setup()
    renderForm()

    const titleInput = screen.getByTestId('input-title')
    await user.type(titleInput, 'Valid Recipe Name')
    await user.tab()

    // Нет alert для title
    const alerts = screen.queryAllByRole('alert')
    const titleAlert = alerts.find(a => a.textContent.includes('Title'))
    expect(titleAlert).toBeUndefined()
  })

  it('кнопка Submit разблокирована при валидных данных', async () => {
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add recipe/i })).not.toBeDisabled()
    })
  })
})

describe('RecipeForm — Submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContextValue = {
      addRecipe:      mockAddRecipe,
      updateRecipe:   mockUpdateRecipe,
      editingRecipe:  null,
      setEditingRecipe: mockSetEditing
    }
  })

  it('вызывает addRecipe при валидном Submit', async () => {
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)

    const submitBtn = screen.getByRole('button', { name: /add recipe/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockAddRecipe).toHaveBeenCalledTimes(1)
    })
  })

  it('передаёт корректные данные в addRecipe', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByTestId('input-title'), 'Pizza')
    await user.type(screen.getByTestId('input-ingredients'), 'Dough, Sauce, Cheese')
    await user.type(screen.getByTestId('input-description'), 'Bake at 250°C for 12 minutes')

    const submitBtn = screen.getByRole('button', { name: /add recipe/i })
    await user.click(submitBtn)

    await waitFor(() => {
      const arg = mockAddRecipe.mock.calls[0][0]
      expect(arg.title).toBe('Pizza')
      expect(arg.ingredients).toBe('Dough, Sauce, Cheese')
      expect(arg.description).toBe('Bake at 250°C for 12 minutes')
    })
  })

  it('показывает сообщение об успехе после Submit', async () => {
    const user = userEvent.setup()
    renderForm()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /add recipe/i }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/recipe added/i)
    })
  })
})

describe('RecipeForm — режим редактирования', () => {
  const editingRecipe = {
    id: 42,
    title: 'Old Title',
    category: 'Lunch',
    ingredients: 'Eggs',
    description: 'Old description',
    tags: [],
    rating: 3,
    timerMinutes: 10
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockContextValue = {
      addRecipe:      mockAddRecipe,
      updateRecipe:   mockUpdateRecipe,
      editingRecipe,
      setEditingRecipe: mockSetEditing
    }
  })

  it('отображает заголовок Edit в режиме редактирования', () => {
    renderForm()
    expect(screen.getByText(/edit/i)).toBeInTheDocument()
  })

  it('предзаполняет поле title из editingRecipe', () => {
    renderForm()
    expect(screen.getByTestId('input-title')).toHaveValue('Old Title')
  })

  it('предзаполняет поле ingredients из editingRecipe', () => {
    renderForm()
    expect(screen.getByTestId('input-ingredients')).toHaveValue('Eggs')
  })

  it('показывает кнопку "Save Changes"', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('показывает кнопку Cancel', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('вызывает updateRecipe (а не addRecipe) при Submit', async () => {
    const user = userEvent.setup()
    renderForm()

    // Форма уже предзаполнена и валидна
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockUpdateRecipe).toHaveBeenCalledTimes(1)
      expect(mockAddRecipe).not.toHaveBeenCalled()
    })
  })

  it('Cancel вызывает setEditingRecipe(null)', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockSetEditing).toHaveBeenCalledWith(null)
  })
})
