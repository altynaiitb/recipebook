import React, { useState } from 'react'
import { useRecipes } from '../context/RecipeContext'

// ============================================
// LAB 4: Updated to use Context API
// Uses useRecipes() hook for deleteRecipe and toggleLike
// Only receives recipe object and onOpen via props
// ============================================

export default function RecipeCard({ recipe, onOpen, compact = false }) {
  // Get actions from Context
  const { deleteRecipe, toggleLike } = useRecipes()

  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`card ${isHovered ? 'hover' : ''} ${recipe.removing ? 'removing' : ''} ${compact ? 'compact' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-header">
        <h3>{recipe.title}</h3>
        <div className="rating">
          {Array.from({ length: recipe.rating }).map((_, i) => (
            <span key={i}>★</span>
          ))}
        </div>
      </div>

      <div className="card-body">
        <div className="meta">
          <span className="tag">{recipe.category}</span>
        </div>
        <p className="ing">{recipe.ingredients}</p>
      </div>

      <div className="card-actions">
        <button
          className={`btn like ${recipe.liked ? 'liked' : ''}`}
          onClick={() => toggleLike(recipe.id)}
          title={recipe.liked ? 'Remove from favorites' : 'Add to favorites'}
        >
          {recipe.liked ? '♥' : '♡'}
        </button>
        <button className="btn" onClick={() => onOpen(recipe)}>
          View
        </button>
        {!compact && (
          <button className="btn danger" onClick={() => deleteRecipe(recipe.id)}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
