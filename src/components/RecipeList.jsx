import React from 'react'
import RecipeCard from './RecipeCard'

export default function RecipeList({ recipes, onDelete, onLike, onOpen, showFavorites }) {
  if (recipes.length === 0) {
    const message = showFavorites ? "You haven't added any favorites yet!" : "No recipes found."
    return <div className="empty">{message}</div>
  }
  return (
    <div className="recipe-list">
      {recipes.map(r => (
        <RecipeCard key={r.id} recipe={r} onDelete={onDelete} onLike={onLike} onOpen={onOpen} />
      ))}
    </div>
  )
}
