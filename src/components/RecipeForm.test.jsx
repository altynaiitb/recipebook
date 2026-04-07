import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import RecipeForm from './RecipeForm'
import { RecipeProvider } from '../context/RecipeContext'

// Создаем моки функций контекста
const mockAddRecipe    = vi.fn()
const mockUpdateRecipe = vi.fn()
const mockSetEditing   = vi.fn()

let mockContextValue = {
  addRecipe:      mockAddRecipe,
  updateRecipe:   mockUpdateRecipe,
  editingRecipe:  null,
  setEditingRecipe: mockSetEditing
}

// ИСПРАВЛЕНО: Убран дублирующийся async и исправлен путь
vi.mock('../context/RecipeContext', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useRecipes: () => mockContextValue
  }
})

// Хелпер для рендера с провайдером
function renderForm() {
  return render(
    <RecipeProvider>
      <RecipeForm />
    </RecipeProvider>
  )
}

// Хелпер для заполнения формы
async function fillValidForm(user) {
  await user.type(screen.getByTestId('input-title'), 'My Recipe')
  await user.type(screen.getByTestId('input-ingredients'), 'Sugar, Flour, Butter')
  await user.type(screen.getByTestId('input-description'), 'Mix and bake for 30 minutes')
}

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
  })

  it('показывает ошибку при title < 3 символов (после blur)', async () => {
    const user = userEvent.setup()
    renderForm()

    const titleInput = screen.getByTestId('input-title')
    await user.type(titleInput, 'AB')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('не дает вызвать addRecipe при попытке Submit с пустой формой', async () => {
    renderForm()
    const submitBtn = screen.getByRole('button', { name: /add recipe/i })
    fireEvent.click(submitBtn)
    expect(mockAddRecipe).not.toHaveBeenCalled()
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

  it('предзаполняет поля из editingRecipe', () => {
    renderForm()
    expect(screen.getByTestId('input-title')).toHaveValue('Old Title')
    expect(screen.getByTestId('input-ingredients')).toHaveValue('Eggs')
  })

  it('вызывает updateRecipe при сохранении изменений', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(mockUpdateRecipe).toHaveBeenCalledTimes(1)
    })
  })

  it('Cancel вызывает setEditingRecipe(null)', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockSetEditing).toHaveBeenCalledWith(null)
  })
})