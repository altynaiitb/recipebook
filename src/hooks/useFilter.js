import { useState, useMemo, useCallback } from 'react'

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

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const filtered = useMemo(() => {
    return items.filter(item => {

      if (filters.search) {
        const fieldValue = (item[searchField] || '').toLowerCase()
        if (!fieldValue.includes(filters.search.toLowerCase())) return false
      }

      if (filters.category && filters.category !== 'All') {
        if (item[categoryField] !== filters.category) return false
      }

      if (filters.tags && filters.tags.length > 0) {
        const itemTags = item[tagsField] || []
        if (!filters.tags.every(tag => itemTags.includes(tag))) return false
      }

      return true
    })
  }, [items, filters, searchField, categoryField, tagsField])

  return { filtered, filters, updateFilter, resetFilters }
}
