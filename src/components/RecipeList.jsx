import React from 'react'
import RecipeCard from './RecipeCard'

// ============================================
// LAB 6: RecipeList принимает onDelete —
// пробрасывает его в RecipeCard для подтверждения удаления через useModal.
// (Lab 5: ключ — recipe.id, не индекс массива)
// ============================================

export default function RecipeList({ recipes, onOpen, onDelete, showFavorites }) {
  if (recipes.length === 0) {
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

  return (
    <div className="recipe-list" data-testid="recipe-list">
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
