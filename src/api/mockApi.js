// ============================================
// LAB 6 — Задача 5, 7, 8: Mock API Service
// Имитирует RESTful API для CRUD-операций с рецептами.
// Хранит данные в localStorage с симуляцией задержки сети.
// Используется для задач по API Integration и Testing.
// ============================================

const STORAGE_KEY = 'mock_api_recipes_v1'
const BASE_DELAY  = 400   // ms — задержка для имитации сети

// ── Вспомогательные функции ────────────────────────────────────────────────

function delay(ms = BASE_DELAY) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Случайно имитируем сетевую ошибку (для демонстрации обработки ошибок)
function maybeThrow(chance = 0) {
  if (Math.random() < chance) {
    throw new Error('Network error: request failed (simulated)')
  }
}

// ── Инициализация хранилища ────────────────────────────────────────────────

const DEFAULT_DATA = [
  { id: 101, title: 'Pasta Carbonara', category: 'Dinner', rating: 5, tags: ['Meat', 'Traditional'], ingredients: 'Spaghetti, Eggs, Pancetta, Parmesan, Black pepper', description: 'Classic Roman pasta.' },
  { id: 102, title: 'Omelette', category: 'Breakfast', rating: 4, tags: ['Quick', 'Healthy'], ingredients: 'Eggs, Butter, Salt, Pepper', description: 'Simple French omelette.' },
  { id: 103, title: 'Lentil Soup', category: 'Lunch', rating: 4, tags: ['Vegan', 'Healthy'], ingredients: 'Red lentils, Onion, Tomatoes, Cumin, Lemon', description: 'Hearty vegan lentil soup.' },
  { id: 104, title: 'Beef Steak', category: 'Dinner', rating: 5, tags: ['Meat'], ingredients: 'Ribeye steak, Butter, Garlic, Rosemary, Salt', description: 'Pan-seared ribeye steak.' },
  { id: 105, title: 'Banana Smoothie', category: 'Breakfast', rating: 4, tags: ['Vegan', 'Quick'], ingredients: 'Banana, Almond milk, Honey, Oats', description: 'Creamy breakfast smoothie.' }
]

function initStore() {
  if (!getStore()) {
    saveStore(DEFAULT_DATA)
  }
}

initStore()

// ── API Methods ────────────────────────────────────────────────────────────

/**
 * GET /recipes — получить все рецепты
 * @param {{ errorChance?: number }} [opts]
 */
export async function apiGetRecipes({ errorChance = 0 } = {}) {
  await delay()
  maybeThrow(errorChance)
  return getStore() || []
}

/**
 * GET /recipes/:id — получить один рецепт по id
 */
export async function apiGetRecipe(id) {
  await delay(200)
  const store = getStore() || []
  const recipe = store.find(r => r.id === id)
  if (!recipe) throw new Error(`Recipe ${id} not found`)
  return recipe
}

/**
 * POST /recipes — добавить новый рецепт
 * Задача 7: добавление через API → обновление глобального состояния
 */
export async function apiAddRecipe(recipeData) {
  await delay()
  const store = getStore() || []
  const newRecipe = { ...recipeData, id: Date.now() }
  const updated = [newRecipe, ...store]
  saveStore(updated)
  return newRecipe
}

/**
 * PUT /recipes/:id — обновить существующий рецепт
 * Задача 7: редактирование через API → обновление глобального состояния
 */
export async function apiUpdateRecipe(id, recipeData) {
  await delay()
  const store = getStore() || []
  const idx = store.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Recipe ${id} not found`)
  const updated = [...store]
  updated[idx] = { ...updated[idx], ...recipeData, id }
  saveStore(updated)
  return updated[idx]
}

/**
 * DELETE /recipes/:id — удалить рецепт
 * Задача 8: удаление через API → обновление глобального состояния
 */
export async function apiDeleteRecipe(id) {
  await delay()
  const store = getStore() || []
  const idx = store.findIndex(r => r.id === id)
  if (idx === -1) throw new Error(`Recipe ${id} not found`)
  const updated = store.filter(r => r.id !== id)
  saveStore(updated)
  return { success: true, id }
}

/**
 * Сброс хранилища к DEFAULT_DATA (используется в тестах)
 */
export function resetMockStore() {
  saveStore(DEFAULT_DATA)
}

/**
 * POST /auth/mfa/verify — проверка 6-значного TOTP кода
 * LAB 8 SECURITY: Mock MFA verification.
 * Demo: '123456' is always valid; any other code fails.
 */
export async function apiVerifyMFA(code) {
  await delay(700)
  if (String(code) === '123456') {
    return { success: true, token: 'mock-totp-token-' + Date.now() }
  }
  return { success: false, message: 'Invalid verification code. Please try again.' }
}
