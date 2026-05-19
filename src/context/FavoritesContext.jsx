import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())

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

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider')
  return ctx
}

export default FavoritesContext
