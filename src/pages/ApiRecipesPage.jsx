import React, { useState, useMemo } from 'react'
import { useFetch }  from '../hooks/useFetch'
import { useModal }  from '../hooks/useModal'
import { useFilter } from '../hooks/useFilter'
import {
  searchMealsUrl,
  categoriesUrl,
  transformMeal,
  transformMealSummary,
  mealDetailUrl
} from '../api/mealDbApi'

// ============================================
// LAB 6 — Задача 5, 6: Внешний API + пагинация
// Страница загружает рецепты с TheMealDB.
// Демонстрирует:
//   - useFetch: данные, состояние загрузки, ошибки
//   - useFilter: поиск по названию и категории
//   - useModal: просмотр деталей рецепта
//   - Пагинация по 12 карточек
// ============================================

const PAGE_SIZE = 12

export default function ApiRecipesPage() {
  // ── Поиск блюд (по умолчанию — все блюда на букву "a") ───────────────
  const [searchQuery, setSearchQuery] = useState('a')
  const [inputValue,  setInputValue]  = useState('')

  // ── LAB 6 Задача 2: useFetch для получения рецептов ──────────────────
  const mealsUrl = searchMealsUrl(searchQuery)
  const { data: mealsData, loading: mealsLoading, error: mealsError, refetch } = useFetch(mealsUrl)

  // Трансформируем ответ API в массив объектов нашего формата
  const allMeals = useMemo(() => {
    const raw = mealsData?.meals || []
    return raw.map(transformMeal)
  }, [mealsData])

  // ── LAB 6 Задача 3: useFilter — фильтр по категории ──────────────────
  const { filtered: filteredMeals, filters, updateFilter } = useFilter(allMeals, {
    searchField:   'title',
    categoryField: 'category'
  })

  // Уникальные категории из текущего набора данных
  const categories = useMemo(() => {
    const cats = new Set(allMeals.map(m => m.category).filter(Boolean))
    return ['All', ...Array.from(cats).sort()]
  }, [allMeals])

  // ── Пагинация ─────────────────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(filteredMeals.length / PAGE_SIZE)
  const pageMeals  = filteredMeals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // При смене фильтра сбрасываем на первую страницу
  function handleFilter(key, value) {
    updateFilter(key, value)
    setPage(1)
  }

  // ── LAB 6 Задача 4: useModal — детали блюда ───────────────────────────
  const detailModal   = useModal()
  const { data: detailData, loading: detailLoading } = useFetch(
    detailModal.isOpen && detailModal.data ? mealDetailUrl(detailModal.data) : null
  )

  const mealDetail = useMemo(() => {
    const m = detailData?.meals?.[0]
    return m ? transformMeal(m) : null
  }, [detailData])

  // ── Search submit ─────────────────────────────────────────────────────
  function handleSearch(e) {
    e.preventDefault()
    setSearchQuery(inputValue.trim() || 'a')
    setPage(1)
  }

  return (
    <div className="page api-page">
      <header className="page-header">
        <h1>Explore Recipes</h1>
        <p className="api-subtitle">Powered by <strong>TheMealDB</strong> — {filteredMeals.length} recipes found</p>
      </header>

      {/* ── Search form ─────────────────────────────────────────────────── */}
      <form className="api-search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          className="field"
          placeholder="Search by name (e.g. chicken, pasta, cake…)"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          aria-label="Search recipes"
        />
        <button type="submit" className="btn primary">Search</button>
        {/* LAB 6 Задача 6: Кнопка повторного запроса при ошибке */}
        {mealsError && (
          <button type="button" className="btn" onClick={refetch}>Retry</button>
        )}
      </form>

      {/* ── Category filter ─────────────────────────────────────────────── */}
      <div className="api-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`btn tag-filter-btn ${filters.category === cat ? 'active' : ''}`}
            onClick={() => handleFilter('category', cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── LAB 6 Задача 6: Состояние загрузки ──────────────────────────── */}
      {mealsLoading && (
        <div className="loading" aria-live="polite">
          <div className="spinner" aria-hidden></div>
          <div className="loading-text">Fetching recipes from TheMealDB…</div>
        </div>
      )}

      {/* ── LAB 6 Задача 6: Сообщение об ошибке ─────────────────────────── */}
      {mealsError && !mealsLoading && (
        <div className="api-error" role="alert">
          <span>⚠️ {mealsError}</span>
          <button className="btn" onClick={refetch}>Retry</button>
        </div>
      )}

      {/* ── Карточки рецептов ───────────────────────────────────────────── */}
      {!mealsLoading && !mealsError && (
        <>
          {pageMeals.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <p>No recipes found. Try a different search.</p>
            </div>
          ) : (
            <div className="api-grid">
              {pageMeals.map(meal => (
                <div
                  key={meal.id}
                  className="card api-card"
                  onClick={() => detailModal.open(meal.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {meal.thumbnail && (
                    <img
                      src={meal.thumbnail + '/preview'}
                      alt={meal.title}
                      className="api-card-img"
                      loading="lazy"
                    />
                  )}
                  <div className="card-body">
                    <h3 className="api-card-title">{meal.title}</h3>
                    <div className="meta">
                      {meal.category && <span className="tag">{meal.category}</span>}
                      {meal.area && <span className="tag tag-area">{meal.area}</span>}
                    </div>
                    {meal.tags.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {meal.tags.slice(0, 3).map(t => (
                          <span key={t} className="tag tag-badge">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn primary"
                      onClick={e => { e.stopPropagation(); detailModal.open(meal.id) }}
                    >
                      View Recipe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Пагинация ───────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="pagination" aria-label="Pagination">
              <button
                className="btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '...'
                      ? <span key={`dots-${idx}`} className="page-dots">…</span>
                      : <button
                          key={p}
                          className={`btn page-btn ${page === p ? 'active' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                  )
                }
              </div>
              <button
                className="btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── LAB 6 Задача 4: Modal деталей рецепта ────────────────────────── */}
      {detailModal.isOpen && (
        <div className="modal-backdrop" onClick={detailModal.close}>
          <div className="modal api-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={detailModal.close} aria-label="Close">✕</button>

            {detailLoading && (
              <div className="loading" style={{ padding: '3rem' }}>
                <div className="spinner" aria-hidden></div>
                <div className="loading-text">Loading recipe details…</div>
              </div>
            )}

            {!detailLoading && mealDetail && (
              <>
                <div className="api-detail-header">
                  {mealDetail.thumbnail && (
                    <img
                      src={mealDetail.thumbnail}
                      alt={mealDetail.title}
                      className="api-detail-img"
                    />
                  )}
                  <div>
                    <h2 style={{ marginTop: 0 }}>{mealDetail.title}</h2>
                    <div className="meta" style={{ marginBottom: '0.5rem' }}>
                      {mealDetail.category && <span className="tag">{mealDetail.category}</span>}
                      {mealDetail.area    && <span className="tag tag-area">{mealDetail.area}</span>}
                    </div>
                    {mealDetail.youtubeUrl && (
                      <a
                        href={mealDetail.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ display: 'inline-block', marginTop: 8 }}
                      >
                        ▶ Watch on YouTube
                      </a>
                    )}
                  </div>
                </div>

                <h3>Ingredients</h3>
                <ul className="ingredient-list">
                  {mealDetail.ingredients.split(', ').map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>

                <h3>Instructions</h3>
                <p className="instructions">{mealDetail.description}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
