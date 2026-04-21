import React, { useMemo } from 'react'

export default function RecipeList({
  recipes,
  sortBy = 'alpha',
  filterCategory = 'All',
  showFavorites,
  children
}) {
  const filtered = useMemo(() => {
    if (!filterCategory || filterCategory === 'All') return recipes
    return recipes.filter(r => r.category === filterCategory)
  }, [recipes, filterCategory])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'alpha') return (a.title || '').localeCompare(b.title || '')
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0
    })
  }, [filtered, sortBy])

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
