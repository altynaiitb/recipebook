import React, { useState, useMemo } from 'react'
import { useRecipes } from '../context/RecipeContext'
import RecipeForm from '../components/RecipeForm'
import RecipeList from '../components/RecipeList'
import Filters from '../components/Filters'
import CookingTimer from '../components/CookingTimer'
import Modal from '../components/Modal'

// ============================================
// LAB 4: Recipes Page Component
// Main page with recipe list, filters, form, and timer
// Uses Context for recipe data (no prop drilling)
// ============================================

export default function RecipesPage() {
  const { recipes, isLoading, stats } = useRecipes()

  // Local filter/search state (page-specific, not global)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState('alpha')
  const [showFavorites, setShowFavorites] = useState(false)
  const [modalRecipe, setModalRecipe] = useState(null)

  // ============================================
  // FILTERING & SORTING (Memoized)
  // ============================================
  const sortedRecipes = useMemo(() => {
    const filtered = recipes
      .filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
      .filter(r => category === 'All' || r.category === category)
      .filter(r => !showFavorites || r.liked)

    return [...filtered].sort((a, b) => {
      if (sortBy === 'alpha') return a.title.localeCompare(b.title)
      if (sortBy === 'rating') return b.rating - a.rating
      return 0
    })
  }, [recipes, search, category, showFavorites, sortBy])

  function openModal(recipe) {
    setModalRecipe(recipe)
  }

  function closeModal() {
    setModalRecipe(null)
  }

  return (
    <div className="page recipes-page">
      <header className="page-header">
        <h1>All Recipes</h1>
        <div className="counters">
          <div className="counter">Showing: {sortedRecipes.length} of {stats.total}</div>
          <div className="counter favorites-counter">❤️ Favorites: {stats.favorites}</div>
        </div>
      </header>

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
