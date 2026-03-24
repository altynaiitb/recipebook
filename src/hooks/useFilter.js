// ============================================
// LAB 6 — Задача 3: Custom Hook useFilter
// Фильтрация массива элементов по категории, тегам и поисковой строке.
// Принимает массив и начальные параметры фильтрации.
// Возвращает отфильтрованный массив и управляющие функции.
// ============================================
import { useState, useMemo, useCallback } from 'react'

/**
 * @param {Array}  items                     — исходный массив для фильтрации
 * @param {Object} config
 * @param {string} config.searchField        — поле объекта для текстового поиска
 * @param {string} config.categoryField      — поле объекта для фильтра категории
 * @param {string} config.tagsField          — поле объекта для фильтра тегов (массив)
 * @param {Object} [config.initialFilters]   — начальные значения фильтров
 *
 * @returns {{
 *   filtered:      Array,
 *   filters:       { search: string, category: string, tags: string[] },
 *   updateFilter:  (key: string, value: any) => void,
 *   resetFilters:  () => void
 * }}
 */
export function useFilter(items, config = {}) {
  const {
    searchField = 'title',
    categoryField = 'category',
    tagsField = 'tags',
    initialFilters = {}
  } = config

  const defaultFilters = {
    search: '',
    category: 'All',
    tags: [],
    ...initialFilters
  }

  const [filters, setFilters] = useState(defaultFilters)

  // Обновить один параметр фильтра
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Сбросить все фильтры к начальным значениям
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Фильтрация пересчитывается только при изменении items или filters
  const filtered = useMemo(() => {
    return items.filter(item => {
      // ── Текстовый поиск ──────────────────────────────────────
      if (filters.search) {
        const fieldValue = (item[searchField] || '').toLowerCase()
        if (!fieldValue.includes(filters.search.toLowerCase())) return false
      }

      // ── Фильтр по категории ───────────────────────────────────
      if (filters.category && filters.category !== 'All') {
        if (item[categoryField] !== filters.category) return false
      }

      // ── Фильтр по тегам (элемент должен содержать ВСЕ теги) ──
      if (filters.tags && filters.tags.length > 0) {
        const itemTags = item[tagsField] || []
        if (!filters.tags.every(tag => itemTags.includes(tag))) return false
      }

      return true
    })
  }, [items, filters, searchField, categoryField, tagsField])

  return { filtered, filters, updateFilter, resetFilters }
}
