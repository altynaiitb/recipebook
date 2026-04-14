import React, { useState, useCallback, createContext, useContext, Suspense, lazy } from 'react'
import { useRecipes } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'

// ============================================
// LAB 7 Task 3: Compound Component Pattern
// RecipeCard is split into Header, Body, Footer sub-components
// sharing state via a local RecipeCardContext.
//
// LAB 7 Task 5: Lazy Loading
// Sub-components are lazy-loaded via React.lazy + Suspense.
// ============================================

// ── Local Context ───────────────────────────────────────────
const RecipeCardContext = createContext(null)

function useCardContext() {
  const ctx = useContext(RecipeCardContext)
  if (!ctx) throw new Error('RecipeCard sub-components must be used within <RecipeCard>')
  return ctx
}

// ── Sub-component: Header ────────────────────────────────────
function RecipeCardHeader() {
  const { recipe } = useCardContext()
  return (
    <div className="card-header">
      <h3>{recipe.title}</h3>
      <div className="rating">
        {Array.from({ length: recipe.rating || 0 }).map((_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
    </div>
  )
}

// ── Sub-component: Body ──────────────────────────────────────
function RecipeCardBody() {
  const { recipe, showDetails, toggleDetails } = useCardContext()
  return (
    <div className="card-body">
      <div className="meta">
        <span className="tag">{recipe.category}</span>
        {(recipe.tags || []).map(tag => (
          <span key={tag} className="tag tag-badge">{tag}</span>
        ))}
      </div>
      <p className="ing">{recipe.ingredients}</p>
      {showDetails && recipe.description && (
        <p className="card-description" style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: '0.85rem' }}>
          {recipe.description}
        </p>
      )}
      <button
        className="btn"
        onClick={toggleDetails}
        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>
    </div>
  )
}

// ── Sub-component: Footer ────────────────────────────────────
function RecipeCardFooter() {
  const { recipe, liked, toggleFav, onOpen, onDelete, compact, handleEdit } = useCardContext()
  return (
    <div className="card-actions">
      <button
        className={`btn like ${liked ? 'liked' : ''}`}
        onClick={toggleFav}
        title={liked ? 'Remove from favorites' : 'Add to favorites'}
      >
        {liked ? '♥' : '♡'}
      </button>

      <button className="btn" onClick={() => onOpen(recipe)}>View</button>

      {!compact && (
        <>
          <button className="btn" onClick={() => handleEdit(recipe)}>
            ✏️ Edit
          </button>
          <button
            className="btn danger"
            onClick={() => onDelete ? onDelete(recipe) : null}
          >
            Delete
          </button>
        </>
      )}
    </div>
  )
}

// ── Lazy-wrapped sub-components ──────────────────────────────
// We wrap each in a lazy factory for the Suspense boundary
const LazyHeader = lazy(() => Promise.resolve({ default: RecipeCardHeader }))
const LazyBody = lazy(() => Promise.resolve({ default: RecipeCardBody }))
const LazyFooter = lazy(() => Promise.resolve({ default: RecipeCardFooter }))

// ── Main Compound Component ─────────────────────────────────
const RecipeCard = React.memo(function RecipeCard({ recipe, onOpen, onDelete, compact = false }) {
  const { deleteRecipe, handleEdit } = useRecipes()
  const { isFavorite, toggleFavorite } = useFavorites()

  const liked = isFavorite(recipe.id)

  const [isHovered, setIsHovered] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])
  const toggleDetails = useCallback(() => setShowDetails(p => !p), [])
  const toggleFav = useCallback(() => toggleFavorite(recipe.id), [toggleFavorite, recipe.id])

  const contextValue = {
    recipe,
    isHovered,
    liked,
    showDetails,
    toggleDetails,
    toggleFav,
    onOpen: onOpen || (() => { }),
    onDelete: onDelete || ((r) => deleteRecipe(r.id)),
    compact,
    handleEdit
  }

  const fallback = <div style={{ padding: '0.5rem', opacity: 0.4 }}>…</div>

  return (
    <RecipeCardContext.Provider value={contextValue}>
      <div
        className={`card ${isHovered ? 'hover' : ''} ${recipe.removing ? 'removing' : ''} ${compact ? 'compact' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Suspense fallback={fallback}>
          <LazyHeader />
          <LazyBody />
          <LazyFooter />
        </Suspense>
      </div>
    </RecipeCardContext.Provider>
  )
})

// Attach sub-components as static properties (Compound Component API)
RecipeCard.Header = RecipeCardHeader
RecipeCard.Body = RecipeCardBody
RecipeCard.Footer = RecipeCardFooter

export { RecipeCardContext, useCardContext }
export default RecipeCard
