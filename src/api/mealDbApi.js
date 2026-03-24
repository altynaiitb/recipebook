// ============================================
// LAB 6 — Задача 5: Внешний API — TheMealDB
// Бесплатный публичный API рецептов (без ключа).
// Документация: https://www.themealdb.com/api.php
// ============================================

const BASE = 'https://www.themealdb.com/api/json/v1/1'

// ── URL-builders ───────────────────────────────────────────────────────────

/** Поиск рецептов по названию */
export function searchMealsUrl(query = '') {
  return `${BASE}/search.php?s=${encodeURIComponent(query)}`
}

/** Все рецепты в категории */
export function mealsByCategoryUrl(category) {
  return `${BASE}/filter.php?c=${encodeURIComponent(category)}`
}

/** Список всех категорий */
export const categoriesUrl = `${BASE}/categories.php`

/** Детали рецепта по id */
export function mealDetailUrl(id) {
  return `${BASE}/lookup.php?i=${id}`
}

// ── Data transformers ──────────────────────────────────────────────────────

/**
 * Преобразует объект блюда из TheMealDB в формат нашего приложения.
 * TheMealDB возвращает ингредиенты в полях strIngredient1..20.
 */
export function transformMeal(meal) {
  // Собираем ингредиенты из 20 отдельных полей
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const name   = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (name && name.trim()) {
      ingredients.push(measure ? `${measure.trim()} ${name.trim()}` : name.trim())
    }
  }

  return {
    id:          meal.idMeal,
    title:       meal.strMeal,
    category:    meal.strCategory,
    area:        meal.strArea,
    tags:        meal.strTags ? meal.strTags.split(',').map(t => t.trim()).filter(Boolean) : [],
    ingredients: ingredients.join(', '),
    description: meal.strInstructions || '',
    thumbnail:   meal.strMealThumb,
    youtubeUrl:  meal.strYoutube,
    rating:      4,   // TheMealDB не предоставляет рейтинги
    source:      'themealdb'
  }
}

/**
 * Преобразует краткий объект (из фильтра по категории) — без инструкций.
 */
export function transformMealSummary(meal) {
  return {
    id:        meal.idMeal,
    title:     meal.strMeal,
    thumbnail: meal.strMealThumb,
    source:    'themealdb'
  }
}
