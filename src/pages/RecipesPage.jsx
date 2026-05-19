import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useRecipes, TAGS } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'
import { useFilter }    from '../hooks/useFilter'
import { useModal }     from '../hooks/useModal'
import RecipeForm   from '../components/recipe/RecipeForm'
import RecipeList   from '../components/recipe/RecipeList'
import RecipeCard   from '../components/recipe/RecipeCard'
import Filters      from '../components/recipe/Filters'
import CookingTimer from '../components/recipe/CookingTimer'
import Modal        from '../components/ui/Modal'
import FormModal    from '../components/ui/FormModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import withAuth     from '../components/auth/withAuth'

// ============================================
// LAB 8 REQUIREMENTS:
// - Add Recipe / Edit Recipe opened via useModal in FormModal
// - ProtectedRecipeForm still wrapped with withAuth HOC
// - editingRecipe change auto-opens the form modal
// ============================================

const ProtectedRecipeForm = withAuth(RecipeForm)

export default function RecipesPage() {
  const { recipes, isLoading, stats, deleteRecipe, editingRecipe, setEditingRecipe } = useRecipes()
  const { favoritesCount, favoriteIds } = useFavorites()

  const [sortBy,        setSortBy]        = useState('alpha')
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

  // Favorites filter applied on top
  const afterFavoriteFilter = useMemo(() => {
    return showFavorites
      ? filteredRecipes.filter(r => favoriteIds.has(r.id))
      : filteredRecipes
  }, [filteredRecipes, showFavorites, favoriteIds])

  // ── Modals ──────────────────────────────────────────────────────────────
  const viewModal   = useModal()
  const deleteModal = useModal()
  const formModal   = useModal()   // LAB 8: Add/Edit form modal

  // Auto-open form modal when a recipe is set for editing (from RecipeCard Edit btn)
  useEffect(() => {
    if (editingRecipe) {
      formModal.open()
    }
  }, [editingRecipe])               // intentionally omit formModal to avoid loop

  const handleFormModalClose = useCallback(() => {
    formModal.close()
    setEditingRecipe(null)
  }, [formModal, setEditingRecipe])

  const openView  = useCallback((recipe) => viewModal.open(recipe),    [viewModal])
  const closeView = useCallback(() => viewModal.close(),               [viewModal])

  const requestDelete = useCallback((recipe) => deleteModal.open(recipe), [deleteModal])

  const confirmDelete = useCallback(() => {
    if (deleteModal.data) deleteRecipe(deleteModal.data.id)
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

  // Derive modal title
  const formModalTitle = editingRecipe
    ? `✏️ Edit: ${editingRecipe.title}`
    : '➕ Add New Recipe'

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
          {/* LAB 8: Add Recipe button opens FormModal */}
          <button
            id="add-recipe-btn"
            className="btn primary add-recipe-btn"
            onClick={() => { setEditingRecipe(null); formModal.open() }}
          >
            ➕ Add New Recipe
          </button>

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

      {/* LAB 8: Add/Edit Recipe Form Modal */}
      <FormModal
        isOpen={formModal.isOpen}
        onClose={handleFormModalClose}
        title={formModalTitle}
      >
        <ProtectedRecipeForm onClose={handleFormModalClose} />
      </FormModal>

      {/* View recipe modal */}
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
