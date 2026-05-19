import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilter } from './useFilter'

const RECIPES = [
  { id: 1, title: 'Pasta Carbonara', category: 'Dinner',    rating: 5, tags: ['Meat', 'Traditional'] },
  { id: 2, title: 'Omelette',        category: 'Breakfast', rating: 4, tags: ['Quick', 'Healthy'] },
  { id: 3, title: 'Lentil Soup',     category: 'Lunch',     rating: 4, tags: ['Vegan', 'Healthy'] },
  { id: 4, title: 'Beef Steak',      category: 'Dinner',    rating: 5, tags: ['Meat'] },
  { id: 5, title: 'Banana Smoothie', category: 'Breakfast', rating: 4, tags: ['Vegan', 'Quick'] },
]

describe('useFilter', () => {

  it('returns all items when no filters are applied', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    expect(result.current.filtered).toHaveLength(RECIPES.length)
  })

  it('exposes filters, updateFilter, resetFilters', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    expect(result.current.filters).toBeDefined()
    expect(typeof result.current.updateFilter).toBe('function')
    expect(typeof result.current.resetFilters).toBe('function')
  })

  it('filters by search string (case-insensitive)', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => { result.current.updateFilter('search', 'pasta') })
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].title).toBe('Pasta Carbonara')
  })

  it('search is case-insensitive (uppercase)', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => { result.current.updateFilter('search', 'OMELETTE') })
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe(2)
  })

  it('filters by category', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => { result.current.updateFilter('category', 'Breakfast') })
    const titles = result.current.filtered.map(r => r.title)
    expect(titles).toContain('Omelette')
    expect(titles).toContain('Banana Smoothie')
    expect(titles).not.toContain('Pasta Carbonara')
  })

  it('category "All" returns all items', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => { result.current.updateFilter('category', 'Dinner') })
    act(() => { result.current.updateFilter('category', 'All') })
    expect(result.current.filtered).toHaveLength(RECIPES.length)
  })

  it('filters by a single tag', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => { result.current.updateFilter('tags', ['Vegan']) })
    const ids = result.current.filtered.map(r => r.id)
    expect(ids).toContain(3) // Lentil Soup
    expect(ids).toContain(5) // Banana Smoothie
    expect(ids).not.toContain(1) // Pasta
  })

  it('filters by multiple tags (all-of logic)', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => { result.current.updateFilter('tags', ['Vegan', 'Quick']) })
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].id).toBe(5)
  })

  it('combines search + category filters', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => {
      result.current.updateFilter('category', 'Dinner')
      result.current.updateFilter('search', 'steak')
    })
    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].title).toBe('Beef Steak')
  })

  it('resetFilters reverts all filters to defaults', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => {
      result.current.updateFilter('search', 'pasta')
      result.current.updateFilter('category', 'Dinner')
      result.current.updateFilter('tags', ['Meat'])
    })
    act(() => { result.current.resetFilters() })
    expect(result.current.filtered).toHaveLength(RECIPES.length)
    expect(result.current.filters.search).toBe('')
    expect(result.current.filters.category).toBe('All')
    expect(result.current.filters.tags).toEqual([])
  })

  it('returns empty array when no recipes match any filter', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => { result.current.updateFilter('search', 'zzz-no-match-xyz') })
    expect(result.current.filtered).toHaveLength(0)
  })

  it('updateFilter updates only the targeted key', () => {
    const { result } = renderHook(() => useFilter(RECIPES))
    act(() => { result.current.updateFilter('category', 'Lunch') })
    expect(result.current.filters.category).toBe('Lunch')
    expect(result.current.filters.search).toBe('')   // unchanged
    expect(result.current.filters.tags).toEqual([])  // unchanged
  })

  it('works with empty items array', () => {
    const { result } = renderHook(() => useFilter([]))
    expect(result.current.filtered).toHaveLength(0)
  })
})
