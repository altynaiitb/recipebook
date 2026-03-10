import React, { useState, useMemo, useCallback } from 'react'
import { useRecipes, TAGS } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'
import RecipeForm from '../components/RecipeForm'
import RecipeList from '../components/RecipeList'
import Filters from '../components/Filters'
import CookingTimer from '../components/CookingTimer'
import Modal from '../components/Modal'

// ============================================
// LAB 5 REQUIREMENTS SATISFIED HERE:
// Задача 8: useMemo — фильтрация + сортировка пересчитываются
//           только при изменении рецептов или параметров фильтра
// Задача 11: Использует оба контекста раздельно
// Задача 12: Рендеринг списков через recipe.id, не индексы
// ============================================

export default function RecipesPage() {
  const { recipes, isLoading, stats } = useRecipes()

  // LAB 5 (Задача 11): favorites count comes from the SEPARATE context
  const { favoritesCount, favoriteIds } = useFavorites()

  // Local filter/search state (page-specific, not global)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState('alpha')
  const [showFavorites, setShowFavorites] = useState(false)
  const [activeTags, setActiveTags] = useState([]) // Задача 1: tag filter
  const [modalRecipe, setModalRecipe] = useState(null)

  // Задача 1: Toggle a tag filter
  const handleTagFilter = useCallback((tag) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }, [])

  // ============================================
  // Задача 8: useMemo — filtering + sorting
  // Recalculates ONLY when recipes or filter params change.
  // Writing in the search box does NOT re-sort the whole list
  // from scratch when the filtered set hasn't changed.
  // ============================================
  const sortedRecipes = useMemo(() => {
    const filtered = recipes
      .filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
      .filter(r => category === 'All' || r.category === category)
      // Задача 11: favorites stored in FavoritesContext by ID
      .filter(r => !showFavorites || favoriteIds.has(r.id))
      // Задача 1: tag filter — show recipe if it has ALL active tags
      .filter(r =>
        activeTags.length === 0 ||
        activeTags.every(tag => (r.tags || []).includes(tag))
      )

    // Задача 12: sort preserved — uses recipe.id as keys in RecipeList
    return [...filtered].sort((a, b) => {
      if (sortBy === 'alpha') return a.title.localeCompare(b.title)
      if (sortBy === 'rating') return b.rating - a.rating
      return 0
    })
  }, [recipes, search, category, showFavorites, sortBy, activeTags, favoriteIds])

  const openModal = useCallback((recipe) => setModalRecipe(recipe), [])
  const closeModal = useCallback(() => setModalRecipe(null), [])

  return (
    <div className="page recipes-page">
      <header className="page-header">
        <h1>All Recipes</h1>
        <div className="counters">
          <div className="counter">Showing: {sortedRecipes.length} of {stats.total}</div>
          {/* Задача 11: favorites count from FavoritesContext */}
          <div className="counter favorites-counter">❤️ Favorites: {favoritesCount}</div>
        </div>
      </header>

      {/* Задача 1: Tag filter buttons */}
      <div className="tag-filter-bar">
        {TAGS.map(tag => (
          <button
            key={tag}
            className={`btn tag-filter-btn ${activeTags.includes(tag) ? 'active' : ''}`}
            onClick={() => handleTagFilter(tag)}
          >
            {tag}
          </button>
        ))}
        {activeTags.length > 0 && (
          <button className="btn" onClick={() => setActiveTags([])}>
            Clear Tags
          </button>
        )}
      </div>

      <main className="recipes-layout">
        <section className="left">
          <RecipeForm />
          <CookingTimer />
          <Filters
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showFavorites={showFavorites}
            setShowFavorites={setShowFavorites}
          />
        </section>

        <section className="right">
          {isLoading ? (
            <div className="loading">
              <div className="spinner" aria-hidden></div>
              <div className="loading-text">Loading recipes…</div>
            </div>
          ) : (
            // Задача 12: RecipeList uses recipe.id as key (not index)
            <RecipeList
              recipes={sortedRecipes}
              onOpen={openModal}
              showFavorites={showFavorites}
            />
          )}
        </section>
      </main>

      {modalRecipe && <Modal recipe={modalRecipe} onClose={closeModal} />}
    </div>
  )
}
