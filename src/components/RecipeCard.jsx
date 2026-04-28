import React, { useState, useCallback, useRef, createContext, useContext, Suspense, lazy } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRecipes } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'

const RecipeCardContext = createContext(null)

function useCardContext() {
  const ctx = useContext(RecipeCardContext)
  if (!ctx) throw new Error('RecipeCard sub-components must be used within <RecipeCard>')
  return ctx
}

function RecipeCardHeader() {
  const { recipe } = useCardContext()
  return (
    <div className="card-header">
      <h3>{recipe.title}</h3>
      <div className="rating">
        {Array.from({ length: recipe.rating || 0 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 400 }}
          >★</motion.span>
        ))}
      </div>
    </div>
  )
}

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
      <AnimatePresence>
        {showDetails && recipe.description && (
          <motion.p
            className="card-description"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 0.8, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ fontSize: '0.85rem', marginTop: '0.5rem', overflow: 'hidden' }}
          >
            {recipe.description}
          </motion.p>
        )}
      </AnimatePresence>
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

function RecipeCardFooter() {
  const { recipe, liked, toggleFav, onOpen, onDelete, compact, handleEdit } = useCardContext()
  return (
    <div className="card-actions">
      <motion.button
        className={`btn like ${liked ? 'liked' : ''}`}
        onClick={toggleFav}
        title={liked ? 'Remove from favorites' : 'Add to favorites'}
        whileTap={{ scale: 1.5 }}
        animate={liked ? { scale: [1, 1.4, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {liked ? '♥' : '♡'}
      </motion.button>
      <button className="btn" onClick={() => onOpen(recipe)}>View</button>
      {!compact && (
        <>
          <button className="btn" onClick={() => handleEdit(recipe)}>✏️ Edit</button>
          <button className="btn danger" onClick={() => onDelete ? onDelete(recipe) : null}>Delete</button>
        </>
      )}
    </div>
  )
}

import { AnimatePresence } from 'framer-motion'

const LazyHeader = lazy(() => Promise.resolve({ default: RecipeCardHeader }))
const LazyBody   = lazy(() => Promise.resolve({ default: RecipeCardBody }))
const LazyFooter = lazy(() => Promise.resolve({ default: RecipeCardFooter }))

const RecipeCard = React.memo(function RecipeCard({ recipe, onOpen, onDelete, compact = false, index = 0 }) {
  const { deleteRecipe, handleEdit } = useRecipes()
  const { isFavorite, toggleFavorite } = useFavorites()

  const liked = isFavorite(recipe.id)
  const [showDetails, setShowDetails] = useState(false)

  const cardRef = useRef(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const xSpring = useSpring(rotateX, { stiffness: 250, damping: 25 })
  const ySpring = useSpring(rotateY, { stiffness: 250, damping: 25 })
  const glowX   = useTransform(ySpring, [-12, 12], ['0%', '100%'])
  const glowY   = useTransform(xSpring, [-12, 12], ['0%', '100%'])

  const handleMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width  - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    rotateX.set(y * -12)
    rotateY.set(x *  12)
  }, [rotateX, rotateY])

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
  }, [rotateX, rotateY])

  const toggleDetails = useCallback(() => setShowDetails(p => !p), [])
  const toggleFav     = useCallback(() => toggleFavorite(recipe.id), [toggleFavorite, recipe.id])

  const contextValue = {
    recipe, liked, showDetails, toggleDetails, toggleFav,
    onOpen: onOpen || (() => {}),
    onDelete: onDelete || ((r) => deleteRecipe(r.id)),
    compact, handleEdit,
    isHovered: false,
  }

  return (
    <RecipeCardContext.Provider value={contextValue}>
      <motion.div
        ref={cardRef}
        className={`card ${recipe.removing ? 'removing' : ''} ${compact ? 'compact' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        whileHover={{ z: 10 }}
        transition={{ duration: 0.38, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        style={{
          rotateX: xSpring,
          rotateY: ySpring,
          transformPerspective: 900,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        layout
      >
        {/* Dynamic glow follows cursor */}
        <motion.div
          className="card-glow"
          style={{
            background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(239,107,86,0.18) 0%, transparent 65%)`,
          }}
        />
        <Suspense fallback={<div style={{ padding: '0.5rem', opacity: 0.4 }}>…</div>}>
          <LazyHeader />
          <LazyBody />
          <LazyFooter />
        </Suspense>
      </motion.div>
    </RecipeCardContext.Provider>
  )
})

RecipeCard.Header = RecipeCardHeader
RecipeCard.Body   = RecipeCardBody
RecipeCard.Footer = RecipeCardFooter

export { RecipeCardContext, useCardContext }
export default RecipeCard
