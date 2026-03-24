import React, { useState, useMemo, useCallback } from 'react'
import { useRecipes, TAGS } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'
import { useFilter }    from '../hooks/useFilter'
import { useModal }     from '../hooks/useModal'
import RecipeForm  from '../components/RecipeForm'
import RecipeList  from '../components/RecipeList'
import Filters     from '../components/Filters'
import CookingTimer from '../components/CookingTimer'
import Modal       from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'

// ============================================
// LAB 6 REQUIREMENTS SATISFIED HERE:
// Задача 3: useFilter — фильтрация рецептов (поиск, категория, теги)
// Задача 4: useModal  — управление модалками (просмотр, подтверждение удаления)
// Задача 8: удаление через API с подтверждением
// (Lab 5 требования сохранены: useMemo для сортировки, раздельные контексты)
// ============================================

export default function RecipesPage() {
  const { recipes, isLoading, stats, deleteRecipe } = useRecipes()
  const { favoritesCount, favoriteIds } = useFavorites()

  const [sortBy, setSortBy]               = useState('alpha')
  const [showFavorites, setShowFavorites] = useState(false)

  // ── LAB 6 Задача 3: useFilter — кастомный хук фильтрации ──────────────
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

  // Дополнительный фильтр по избранному (не входит в useFilter,
  // поскольку избранное хранится в отдельном контексте по ID)
  const afterFavoriteFilter = useMemo(() => {
    return showFavorites
      ? filteredRecipes.filter(r => favoriteIds.has(r.id))
      : filteredRecipes
  }, [filteredRecipes, showFavorites, favoriteIds])

  // Сортировка финального списка
  const sortedRecipes = useMemo(() => {
    return [...afterFavoriteFilter].sort((a, b) => {
      if (sortBy === 'alpha')  return a.title.localeCompare(b.title)
      if (sortBy === 'rating') return b.rating - a.rating
      return 0
    })
  }, [afterFavoriteFilter, sortBy])

  // ── LAB 6 Задача 4: useModal — просмотр деталей рецепта ───────────────
  const viewModal   = useModal()
  // ── LAB 6 Задача 4: useModal — подтверждение удаления ─────────────────
  const deleteModal = useModal()

  const openView    = useCallback((recipe) => viewModal.open(recipe), [viewModal])
  const closeView   = useCallback(() => viewModal.close(), [viewModal])

  // Задача 8: удаление с подтверждением
  const requestDelete = useCallback((recipe) => deleteModal.open(recipe), [deleteModal])

  const confirmDelete = useCallback(() => {
    if (deleteModal.data) {
      deleteRecipe(deleteModal.data.id)
    }
    deleteModal.close()
  }, [deleteModal, deleteRecipe])

  // Тег-фильтры — переключение через updateFilter
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
          <div className="counter">Showing: {sortedRecipes.length} of {stats.total}</div>
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
          <RecipeForm />
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
              recipes={sortedRecipes}
              onOpen={openView}
              onDelete={requestDelete}
              showFavorites={showFavorites}
            />
          )}
        </section>
      </main>

      {/* LAB 6 Задача 4: useModal — просмотр деталей */}
      {viewModal.isOpen && viewModal.data && (
        <Modal recipe={viewModal.data} onClose={closeView} />
      )}

      {/* LAB 6 Задача 4 + 8: useModal — подтверждение удаления */}
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
