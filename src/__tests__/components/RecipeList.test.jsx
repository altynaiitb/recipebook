// ============================================
// LAB 6 — Задача 11: Тестирование компонента RecipeList
// Проверяем:
//   - корректное отображение карточек рецептов
//   - empty state при пустом массиве
//   - рендер после добавления элемента
//   - рендер после удаления элемента
//   - вызов колбэков onOpen и onDelete
// ============================================
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import RecipeList from '../../components/RecipeList'

// ── Мокируем RecipeCard, чтобы изолировать тест списка ────────────────────
//
// RecipeCard использует два контекста (useRecipes, useFavorites).
// Нам важно только то, что RecipeList правильно РЕНДЕРИТ карточки
// и пробрасывает пропсы — внутренняя логика карточки не важна.

vi.mock('../../components/RecipeCard', () => ({
  default: vi.fn(({ recipe, onOpen, onDelete }) => (
    <div data-testid={`card-${recipe.id}`}>
      <span>{recipe.title}</span>
      <button onClick={() => onOpen(recipe)}>Open</button>
      {onDelete && (
        <button onClick={() => onDelete(recipe)}>Delete</button>
      )}
    </div>
  ))
}))

// ── Fixtures ───────────────────────────────────────────────────────────────

const RECIPES = [
  { id: 1, title: 'Pasta', category: 'Dinner',    rating: 5, tags: [], ingredients: 'Spaghetti' },
  { id: 2, title: 'Salad', category: 'Lunch',     rating: 4, tags: [], ingredients: 'Lettuce' },
  { id: 3, title: 'Cake',  category: 'Dessert',   rating: 5, tags: [], ingredients: 'Flour' }
]

// ── Tests ──────────────────────────────────────────────────────────────────

describe('RecipeList — отображение', () => {
  it('рендерит карточку для каждого рецепта', () => {
    render(<RecipeList recipes={RECIPES} onOpen={vi.fn()} />)
    expect(screen.getByTestId('card-1')).toBeInTheDocument()
    expect(screen.getByTestId('card-2')).toBeInTheDocument()
    expect(screen.getByTestId('card-3')).toBeInTheDocument()
  })

  it('отображает правильные названия рецептов', () => {
    render(<RecipeList recipes={RECIPES} onOpen={vi.fn()} />)
    expect(screen.getByText('Pasta')).toBeInTheDocument()
    expect(screen.getByText('Salad')).toBeInTheDocument()
    expect(screen.getByText('Cake')).toBeInTheDocument()
  })

  it('содержит обёртку с data-testid="recipe-list"', () => {
    render(<RecipeList recipes={RECIPES} onOpen={vi.fn()} />)
    expect(screen.getByTestId('recipe-list')).toBeInTheDocument()
  })

  it('рендерит ровно столько карточек, сколько рецептов', () => {
    render(<RecipeList recipes={RECIPES} onOpen={vi.fn()} />)
    // Каждая карточка содержит кнопку Open
    expect(screen.getAllByRole('button', { name: /open/i })).toHaveLength(3)
  })
})

describe('RecipeList — empty state', () => {
  it('показывает сообщение при пустом массиве', () => {
    render(<RecipeList recipes={[]} onOpen={vi.fn()} showFavorites={false} />)
    expect(screen.getByText(/no recipes found/i)).toBeInTheDocument()
  })

  it('показывает сообщение об избранном при showFavorites=true', () => {
    render(<RecipeList recipes={[]} onOpen={vi.fn()} showFavorites={true} />)
    expect(screen.getByText(/favorites/i)).toBeInTheDocument()
  })

  it('не рендерит wrapper при пустом массиве', () => {
    render(<RecipeList recipes={[]} onOpen={vi.fn()} />)
    expect(screen.queryByTestId('recipe-list')).not.toBeInTheDocument()
  })
})

describe('RecipeList — динамическое обновление', () => {
  it('рендерит новую карточку после добавления рецепта', () => {
    const { rerender } = render(<RecipeList recipes={RECIPES} onOpen={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: /open/i })).toHaveLength(3)

    const newRecipe = { id: 4, title: 'Soup', category: 'Dinner', rating: 4, tags: [], ingredients: 'Water' }
    rerender(<RecipeList recipes={[...RECIPES, newRecipe]} onOpen={vi.fn()} />)

    expect(screen.getByTestId('card-4')).toBeInTheDocument()
    expect(screen.getByText('Soup')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /open/i })).toHaveLength(4)
  })

  it('убирает карточку после удаления рецепта', () => {
    const { rerender } = render(<RecipeList recipes={RECIPES} onOpen={vi.fn()} />)
    expect(screen.getByTestId('card-2')).toBeInTheDocument()

    // Удаляем второй рецепт
    rerender(<RecipeList recipes={RECIPES.filter(r => r.id !== 2)} onOpen={vi.fn()} />)

    expect(screen.queryByTestId('card-2')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /open/i })).toHaveLength(2)
  })

  it('переходит в empty state после удаления всех рецептов', () => {
    const { rerender } = render(<RecipeList recipes={RECIPES} onOpen={vi.fn()} />)
    rerender(<RecipeList recipes={[]} onOpen={vi.fn()} />)

    expect(screen.getByText(/no recipes found/i)).toBeInTheDocument()
    expect(screen.queryByTestId('recipe-list')).not.toBeInTheDocument()
  })
})

describe('RecipeList — callback props', () => {
  it('вызывает onOpen с правильным рецептом при клике Open', () => {
    const onOpen = vi.fn()
    render(<RecipeList recipes={RECIPES} onOpen={onOpen} />)

    fireEvent.click(screen.getAllByRole('button', { name: /open/i })[0])
    expect(onOpen).toHaveBeenCalledWith(RECIPES[0])
  })

  it('вызывает onDelete с правильным рецептом при клике Delete', () => {
    const onDelete = vi.fn()
    render(<RecipeList recipes={RECIPES} onOpen={vi.fn()} onDelete={onDelete} />)

    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[1])
    expect(onDelete).toHaveBeenCalledWith(RECIPES[1])
  })

  it('не рендерит кнопки Delete, если onDelete не передан', () => {
    render(<RecipeList recipes={RECIPES} onOpen={vi.fn()} />)
    expect(screen.queryAllByRole('button', { name: /delete/i })).toHaveLength(0)
  })
})
