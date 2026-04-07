import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import RecipeList from './RecipeList'
import { RecipeProvider } from '../context/RecipeContext'
import { FavoritesProvider } from '../context/FavoritesContext'

const recipesMock = [
  { id: 1, title: 'Pizza' },
  { id: 2, title: 'Pasta' },
]

describe('RecipeList', () => {
  const renderWithProviders = (ui) => {
    return render(
      <RecipeProvider>
        <FavoritesProvider>
          {ui}
        </FavoritesProvider>
      </RecipeProvider>
    )
  }

  it('renders empty state when no recipes', () => {
    renderWithProviders(<RecipeList recipes={[]} showFavorites={false} />)
    expect(screen.getByText('No recipes found.')).toBeInTheDocument()
  })

  it('renders empty favorites state', () => {
    renderWithProviders(<RecipeList recipes={[]} showFavorites={true} />)
    expect(screen.getByText("You haven't added any favorites yet!")).toBeInTheDocument()
  })

  it('renders recipe cards and handles actions', () => {
      const onOpenMock = vi.fn()
      const onDeleteMock = vi.fn()

      renderWithProviders(
        <RecipeList
          recipes={recipesMock}
          onOpen={onOpenMock}
          onDelete={onDeleteMock}
        />
      )

      const list = document.querySelector('.recipe-list')

      expect(list).toBeInTheDocument()
      expect(list.children.length).toBe(2)
      expect(screen.getByText('Pizza')).toBeInTheDocument()
      expect(screen.getByText('Pasta')).toBeInTheDocument()
    })
})