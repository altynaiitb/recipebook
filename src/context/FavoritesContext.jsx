import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

// ============================================
// LAB 5 REQUIREMENT (Задача 11): Split Context API
// FavoritesProvider manages ONLY the favorites list.
// Separated so that toggling a favorite does NOT
// cause RecipeForm or other recipe components to re-render.
// ============================================

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  // Store favorites as a Set of recipe IDs for O(1) lookup
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())

  // ============================================
  // LAB 5 REQUIREMENT (Задача 9): useCallback
  // Stable references prevent unnecessary re-renders
  // of components that receive these as props.
  // ============================================
  const toggleFavorite = useCallback((id) => {
    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const isFavorite = useCallback((id) => favoriteIds.has(id), [favoriteIds])

  const favoritesCount = useMemo(() => favoriteIds.size, [favoriteIds])

  const value = {
    favoriteIds,
    toggleFavorite,
    isFavorite,
    favoritesCount
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

// Custom hook — throws if used outside FavoritesProvider
export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider')
  return ctx
}

export default FavoritesContext
