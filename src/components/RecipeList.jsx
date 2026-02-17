import React from 'react'
import RecipeCard from './RecipeCard'

// ============================================
// LAB 4: RecipeList Component
// Receives filtered recipes from parent page
// RecipeCard uses Context for actions
// ============================================

export default function RecipeList({ recipes, onOpen, showFavorites }) {
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
    <div className="recipe-list">
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}
