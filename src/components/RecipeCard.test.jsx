import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

import RecipeCard from './RecipeCard'
import { RecipeProvider } from '../context/RecipeContext'
import { FavoritesProvider } from '../context/FavoritesContext'

const mockRecipe = {
  id: 1,
  title: 'Test Pizza',
  category: 'Dinner',
  rating: 4,
  tags: ['Meat', 'Quick'],
  ingredients: 'Dough, Sauce, Cheese',
  description: 'A delicious test pizza.',
  removing: false
}

function renderWithProviders(ui) {
  return render(
    <RecipeProvider>
      <FavoritesProvider>
        {ui}
      </FavoritesProvider>
    </RecipeProvider>
  )
}

describe('RecipeCard — Compound Components (Task 8)', () => {

  it('renders RecipeCard.Header with title and stars', async () => {
    const onOpen = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onOpen={onOpen} />)

    expect(await screen.findByText('Test Pizza')).toBeInTheDocument()
    const stars = screen.getAllByText('★')
    expect(stars).toHaveLength(4)
  })

  it('renders RecipeCard.Body with category, tags, and ingredients', async () => {
    const onOpen = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onOpen={onOpen} />)

    expect(await screen.findByText('Dinner')).toBeInTheDocument()
    expect(screen.getByText('Meat')).toBeInTheDocument()
    expect(screen.getByText('Quick')).toBeInTheDocument()
    expect(screen.getByText('Dough, Sauce, Cheese')).toBeInTheDocument()
  })

  it('toggles details when Show Details button is clicked', async () => {
    const onOpen = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onOpen={onOpen} />)

    const toggleBtn = await screen.findByText('Show Details')
    fireEvent.click(toggleBtn)

    expect(screen.getByText('A delicious test pizza.')).toBeInTheDocument()
    expect(screen.getByText('Hide Details')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Hide Details'))
    expect(screen.queryByText('A delicious test pizza.')).not.toBeInTheDocument()
  })

  it('toggles favorite status when heart button is clicked', async () => {
    const onOpen = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onOpen={onOpen} />)

    const heartBtn = await screen.findByTitle('Add to favorites')
    expect(heartBtn).toHaveTextContent('♡')

    fireEvent.click(heartBtn)
    expect(screen.getByTitle('Remove from favorites')).toHaveTextContent('♥')

    fireEvent.click(screen.getByTitle('Remove from favorites'))
    expect(screen.getByTitle('Add to favorites')).toHaveTextContent('♡')
  })

  it('calls onOpen when View button is clicked', async () => {
    const onOpen = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onOpen={onOpen} />)

    fireEvent.click(await screen.findByText('View'))
    expect(onOpen).toHaveBeenCalledWith(mockRecipe)
  })

  it('calls onDelete when Delete button is clicked', async () => {
    const onOpen = vi.fn()
    const onDelete = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onOpen={onOpen} onDelete={onDelete} />)

    fireEvent.click(await screen.findByText('Delete'))
    expect(onDelete).toHaveBeenCalledWith(mockRecipe)
  })

  it('hides Edit and Delete buttons in compact mode', async () => {
    const onOpen = vi.fn()
    renderWithProviders(<RecipeCard recipe={mockRecipe} onOpen={onOpen} compact />)

    await screen.findByText('Test Pizza')

    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
    expect(screen.queryByText(/edit/i)).not.toBeInTheDocument()
  })
})
