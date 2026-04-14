import React, { useState, useMemo, useCallback } from 'react'
import { useRecipes, TAGS } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'
import { useFilter }    from '../hooks/useFilter'
import { useModal }     from '../hooks/useModal'
import RecipeForm  from '../components/RecipeForm'
import RecipeList  from '../components/RecipeList'
import RecipeCard  from '../components/RecipeCard'
import Filters     from '../components/Filters'
import CookingTimer from '../components/CookingTimer'
import Modal       from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import withAuth    from '../components/withAuth'

// ============================================
// LAB 7 REQUIREMENTS:
// Task 1: RecipeList uses render-props (children as function)
// Task 2: RecipeForm wrapped with withAuth HOC
// ============================================

// Task 2: Wrap RecipeForm with auth guard
const ProtectedRecipeForm = withAuth(RecipeForm)

export default function RecipesPage() {
  const { recipes, isLoading, stats, deleteRecipe } = useRecipes()
  const { favoritesCount, favoriteIds } = useFavorites()

  const [sortBy, setSortBy]               = useState('alpha')
  const [showFavorites, setShowFavorites] = useState(false)

  // ── useFilter — custom filter hook ──
  const {
    filtered: filteredRecipes,
    filters,
    updateFilter,
    resetFilters
  } = useFilter(recipes, {
    searchField:   'title',
    categoryField: 'category',
    tagsField:     'tags'
  })

  // Favorites filter (separate context, applied on top)
  const afterFavoriteFilter = useMemo(() => {
    return showFavorites
      ? filteredRecipes.filter(r => favoriteIds.has(r.id))
      : filteredRecipes
  }, [filteredRecipes, showFavorites, favoriteIds])

  // ── Modals ──
  const viewModal   = useModal()
  const deleteModal = useModal()

  const openView    = useCallback((recipe) => viewModal.open(recipe), [viewModal])
  const closeView   = useCallback(() => viewModal.close(), [viewModal])

  const requestDelete = useCallback((recipe) => deleteModal.open(recipe), [deleteModal])

  const confirmDelete = useCallback(() => {
    if (deleteModal.data) {
      deleteRecipe(deleteModal.data.id)
    }
    deleteModal.close()
  }, [deleteModal, deleteRecipe])

  // Tag filters
  const handleTagFilter = useCallback((tag) => {
    const current = filters.tags || []
    const next = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag]
    updateFilter('tags', next)
  }, [filters.tags, updateFilter])

  return (
    <div className="page recipes-page">
      <header className="page-header">
        <h1>All Recipes</h1>
        <div className="counters">
          <div className="counter">Showing: {afterFavoriteFilter.length} of {stats.total}</div>
          <div className="counter favorites-counter">❤️ Favorites: {favoritesCount}</div>
        </div>
      </header>

      {/* Tag filter bar */}
      <div className="tag-filter-bar">
        {TAGS.map(tag => (
          <button
            key={tag}
            className={`btn tag-filter-btn ${(filters.tags || []).includes(tag) ? 'active' : ''}`}
            onClick={() => handleTagFilter(tag)}
          >
            {tag}
          </button>
        ))}
        {(filters.tags || []).length > 0 && (
          <button className="btn" onClick={() => updateFilter('tags', [])}>
            Clear Tags
          </button>
        )}
      </div>

      <main className="recipes-layout">
        <section className="left">
          {/* Task 2: Protected with withAuth */}
          <ProtectedRecipeForm />
          <CookingTimer />
          <Filters
            search={filters.search}
            setSearch={v => updateFilter('search', v)}
            category={filters.category}
            setCategory={v => updateFilter('category', v)}
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
            /* Task 1: Render Props — children as a function */
            <RecipeList
              recipes={afterFavoriteFilter}
              sortBy={sortBy}
              showFavorites={showFavorites}
            >
              {(processedRecipes) =>
                processedRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onOpen={openView}
                    onDelete={requestDelete}
                  />
                ))
              }
            </RecipeList>
          )}
        </section>
      </main>

      {/* View modal (Lazy loaded content) */}
      {viewModal.isOpen && viewModal.data && (
        <Modal recipe={viewModal.data} onClose={closeView} />
      )}

      {/* Delete confirmation modal */}
      {deleteModal.isOpen && (
        <ConfirmModal
          title="Delete Recipe"
          message={`Are you sure you want to delete "${deleteModal.data?.title}"?`}
          onConfirm={confirmDelete}
          onCancel={deleteModal.close}
        />
      )}
    </div>
  )
}
