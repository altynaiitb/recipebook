import React, { useMemo } from 'react'

// ============================================
// LAB 7 Task 1: Render Props Pattern
// RecipeList is a data/logic wrapper that manages
// filtering and sorting, then calls children(processedRecipes)
// so the parent controls how items are rendered.
// ============================================

export default function RecipeList({
  recipes,
  sortBy = 'alpha',
  filterCategory = 'All',
  showFavorites,
  children
}) {
  // Filter by category (if filterCategory provided)
  const filtered = useMemo(() => {
    if (!filterCategory || filterCategory === 'All') return recipes
    return recipes.filter(r => r.category === filterCategory)
  }, [recipes, filterCategory])

  // Sort the filtered results
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'alpha') return (a.title || '').localeCompare(b.title || '')
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0
    })
  }, [filtered, sortBy])

  // Empty state
  if (sorted.length === 0) {
    const message = showFavorites
      ? "You haven't added any favorites yet!"
      : "No recipes found."

    return (
      <div className="empty">
        <div className="empty-icon">🍽️</div>
        <p>{message}</p>
      </div>
    )
  }

  // Render Props: call children as a function
  if (typeof children === 'function') {
    return (
      <div className="recipe-list">
        {children(sorted)}
      </div>
    )
  }

  // Fallback: if children is not a function, just render them
  return (
    <div className="recipe-list">
      {children}
    </div>
  )
}
