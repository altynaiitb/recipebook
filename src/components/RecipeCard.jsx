import React, { useState, useCallback } from 'react'
import { useRecipes } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'

// ============================================
// LAB 5 REQUIREMENT:
// Задача 7: React.memo — RecipeCard won't re-render
//   when a different card's state changes or when
//   the user types in the search box.
// Задача 12: key prop passed by parent uses recipe.id
//   (not array indices) — verified in RecipeList.jsx.
// Задача 11: Favorites come from FavoritesContext.
//   Toggling a heart ONLY re-renders cards that changed.
// ============================================

// LAB 6 Задача 4+8: onDelete — открывает ConfirmModal из RecipesPage через useModal
const RecipeCard = React.memo(function RecipeCard({ recipe, onOpen, onDelete, compact = false }) {
  // Recipe actions from RecipeContext
  const { deleteRecipe, handleEdit } = useRecipes()

  // LAB 5 (Задача 11): favorites from the separated FavoritesContext
  const { isFavorite, toggleFavorite } = useFavorites()

  const liked = isFavorite(recipe.id)

  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])

  return (
    <div
      className={`card ${isHovered ? 'hover' : ''} ${recipe.removing ? 'removing' : ''} ${compact ? 'compact' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-header">
        <h3>{recipe.title}</h3>
        <div className="rating">
          {Array.from({ length: recipe.rating }).map((_, i) => (
            // Задача 12: using index is ok here since it's purely decorative stars
            <span key={i}>★</span>
          ))}
        </div>
      </div>

      <div className="card-body">
        <div className="meta">
          <span className="tag">{recipe.category}</span>
          {/* Show tags if present */}
          {(recipe.tags || []).map(tag => (
            <span key={tag} className="tag tag-badge">{tag}</span>
          ))}
        </div>
        <p className="ing">{recipe.ingredients}</p>
      </div>

      <div className="card-actions">
        {/* Задача 11: Toggle favorite via FavoritesContext */}
        <button
          className={`btn like ${liked ? 'liked' : ''}`}
          onClick={() => toggleFavorite(recipe.id)}
          title={liked ? 'Remove from favorites' : 'Add to favorites'}
        >
          {liked ? '♥' : '♡'}
        </button>

        <button className="btn" onClick={() => onOpen(recipe)}>View</button>

        {!compact && (
          <>
            {/* Задача 3: Edit button opens form in edit mode */}
            <button className="btn" onClick={() => handleEdit(recipe)}>
              ✏️ Edit
            </button>
            {/* LAB 6 Задача 8: удаление с подтверждением через useModal */}
            <button
              className="btn danger"
              onClick={() => onDelete ? onDelete(recipe) : deleteRecipe(recipe.id)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
})

export default RecipeCard
