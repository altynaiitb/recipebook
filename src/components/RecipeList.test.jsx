import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import RecipeList from './RecipeList'

// ============================================
// LAB 7 Task 6: Render Props Test
// Verifies that the render function (children) is called
// with correctly filtered and sorted data.
// ============================================

const recipesMock = [
  { id: 1, title: 'Pizza',   category: 'Dinner',    rating: 4, tags: [] },
  { id: 2, title: 'Pasta',   category: 'Dinner',    rating: 5, tags: [] },
  { id: 3, title: 'Omelette', category: 'Breakfast', rating: 3, tags: [] },
]

describe('RecipeList — Render Props (Task 6)', () => {

  it('renders empty state when no recipes match', () => {
    const renderFn = vi.fn(() => null)
    render(
      <RecipeList recipes={[]} showFavorites={false}>
        {renderFn}
      </RecipeList>
    )
    expect(screen.getByText('No recipes found.')).toBeInTheDocument()
    expect(renderFn).not.toHaveBeenCalled()
  })

  it('renders empty favorites state', () => {
    const renderFn = vi.fn(() => null)
    render(
      <RecipeList recipes={[]} showFavorites={true}>
        {renderFn}
      </RecipeList>
    )
    expect(screen.getByText("You haven't added any favorites yet!")).toBeInTheDocument()
    expect(renderFn).not.toHaveBeenCalled()
  })

  it('calls children function with recipes sorted alphabetically by default', () => {
    const renderFn = vi.fn((recipes) =>
      recipes.map(r => <div key={r.id}>{r.title}</div>)
    )

    render(
      <RecipeList recipes={recipesMock} sortBy="alpha">
        {renderFn}
      </RecipeList>
    )

    expect(renderFn).toHaveBeenCalledTimes(1)
    const calledWith = renderFn.mock.calls[0][0]
    expect(calledWith.map(r => r.title)).toEqual(['Omelette', 'Pasta', 'Pizza'])
  })

  it('calls children function with recipes sorted by rating', () => {
    const renderFn = vi.fn((recipes) =>
      recipes.map(r => <div key={r.id}>{r.title}</div>)
    )

    render(
      <RecipeList recipes={recipesMock} sortBy="rating">
        {renderFn}
      </RecipeList>
    )

    expect(renderFn).toHaveBeenCalledTimes(1)
    const calledWith = renderFn.mock.calls[0][0]
    expect(calledWith.map(r => r.title)).toEqual(['Pasta', 'Pizza', 'Omelette'])
  })

  it('filters recipes by category before calling children', () => {
    const renderFn = vi.fn((recipes) =>
      recipes.map(r => <div key={r.id}>{r.title}</div>)
    )

    render(
      <RecipeList recipes={recipesMock} filterCategory="Breakfast" sortBy="alpha">
        {renderFn}
      </RecipeList>
    )

    expect(renderFn).toHaveBeenCalledTimes(1)
    const calledWith = renderFn.mock.calls[0][0]
    expect(calledWith).toHaveLength(1)
    expect(calledWith[0].title).toBe('Omelette')
  })

  it('passes all recipes when category is "All"', () => {
    const renderFn = vi.fn((recipes) =>
      recipes.map(r => <div key={r.id}>{r.title}</div>)
    )

    render(
      <RecipeList recipes={recipesMock} filterCategory="All" sortBy="alpha">
        {renderFn}
      </RecipeList>
    )

    const calledWith = renderFn.mock.calls[0][0]
    expect(calledWith).toHaveLength(3)
  })
})