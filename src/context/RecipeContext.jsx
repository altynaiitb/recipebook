import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'

// ============================================
// LAB 5 REQUIREMENT (Задача 11): Context Split
// RecipeProvider manages ONLY recipes & timer.
// Favorites are handled by FavoritesProvider.
//
// LAB 5 REQUIREMENT (Задача 9): useCallback
// All action functions are wrapped in useCallback
// for stable references across renders.
// ============================================

const RecipeContext = createContext(null)

const LOCAL_KEY = 'recipe_book_recipes_v2'
const ALARM_SOUND_PATH = '/alarm.mp3'

// Available categories (shared with RecipeForm)
export const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert']

// Available tags (Задача 1: checkboxes)
export const TAGS = ['Vegan', 'Fast Food', 'Spicy', 'Traditional', 'Healthy', 'Meat', 'Quick']

const mockData = [
  // ── Казахская кухня ──────────────────────────────────────
  {
    id: 1,
    title: 'Beshbarmak',
    category: 'Dinner',
    ingredients: 'Lamb or Beef, Wheat dough, Onions, Broth, Salt, Black pepper',
    tags: ['Traditional', 'Meat'],
    rating: 5,
    description: '1. Boil meat in salted water until tender. 2. Roll out dough thinly and cut into rectangles. 3. Cook dough pieces in the boiling broth. 4. Sauté onions in meat fat. 5. Serve meat over the dough and top with onion sauce.'
  },
  {
    id: 2,
    title: 'Kuyrdak',
    category: 'Dinner',
    ingredients: 'Organ meats (heart, lungs, liver), Onions, Potatoes, Oil, Salt, Pepper',
    tags: ['Traditional', 'Meat'],
    rating: 4,
    description: '1. Cut organ meats into small cubes. 2. Stir-fry in a cauldron over high heat. 3. Add chopped onions and potatoes. 4. Simmer under a lid for 20 minutes. 5. Season with salt and pepper to taste.'
  },
  {
    id: 3,
    title: 'Baursaks',
    category: 'Snack',
    ingredients: 'Flour, Milk, Eggs, Yeast, Sugar, Salt, Vegetable oil',
    tags: ['Traditional', 'Quick'],
    rating: 5,
    description: '1. Mix yeast dough and let it rise for 1 hour. 2. Roll out and cut into squares. 3. Deep fry in hot oil until golden brown. 4. Serve warm as a snack or bread substitute.'
  },
  {
    id: 4,
    title: 'Kazakh Plov',
    category: 'Dinner',
    ingredients: 'Rice, Lamb, Carrots, Onions, Garlic, Vegetable oil, Cumin, Salt',
    tags: ['Traditional', 'Meat'],
    rating: 5,
    description: '1. Brown meat in a cauldron. 2. Add onions and carrots, fry for 10 minutes. 3. Add water and simmer for 30 minutes. 4. Add washed rice and a whole garlic head. 5. Cook covered for 25 minutes.'
  },
  {
    id: 5,
    title: 'Sorpa',
    category: 'Dinner',
    ingredients: 'Lamb on the bone, Carrots, Onions, Potatoes, Dill, Salt, Peppercorns',
    tags: ['Traditional', 'Healthy'],
    rating: 4,
    description: '1. Cover meat with cold water, boil, and skim off the foam. 2. Add whole carrots and onions. 3. Simmer for 1.5 hours on low heat. 4. Add potatoes and cook for another 20 minutes. 5. Serve hot with fresh dill.'
  },
  {
    id: 6,
    title: 'Shelpek',
    category: 'Snack',
    ingredients: 'Flour, Kefir, Baking soda, Salt, Sugar, Vegetable oil',
    tags: ['Traditional', 'Quick'],
    rating: 4,
    description: '1. Mix kefir with soda, add flour, salt, and sugar. 2. Knead into a soft dough. 3. Roll out into thin flatbreads. 4. Fry in a hot pan or deep oil until light gold.'
  },
  // ── Мировые хиты ─────────────────────────────────────────
  {
    id: 7,
    title: 'Morning Pancakes',
    category: 'Breakfast',
    ingredients: 'Flour, Milk, Eggs, Sugar, Butter, Baking powder',
    tags: ['Fast Food', 'Quick'],
    rating: 4,
    description: '1. Mix dry ingredients. 2. Whisk in wet ingredients until just combined. 3. Pour batter on a hot greased pan. 4. Flip when bubbles appear on surface. 5. Serve with maple syrup.'
  },
  {
    id: 8,
    title: 'Classic Caesar Salad',
    category: 'Lunch',
    ingredients: 'Romaine lettuce, Grilled chicken, Croutons, Caesar dressing, Parmesan, Lemon',
    tags: ['Healthy'],
    rating: 5,
    description: '1. Grill chicken breast until cooked through. 2. Tear lettuce into large pieces. 3. Toss with dressing. 4. Top with croutons, sliced chicken and parmesan shavings.'
  },
  {
    id: 9,
    title: 'Spaghetti Bolognese',
    category: 'Dinner',
    ingredients: 'Spaghetti, Ground beef, Tomatoes, Onion, Garlic, Basil, Olive oil, Red wine',
    tags: ['Meat', 'Traditional'],
    rating: 5,
    description: '1. Sauté onion and garlic in olive oil. 2. Brown ground beef. 3. Add tomatoes and wine, simmer 30 min. 4. Cook pasta al dente. 5. Serve with fresh basil and parmesan.'
  },
  {
    id: 10,
    title: 'Sushi Rolls',
    category: 'Dinner',
    ingredients: 'Sushi rice, Nori, Salmon, Cucumber, Avocado, Soy sauce, Wasabi',
    tags: ['Healthy'],
    rating: 5,
    description: '1. Cook and season sushi rice with rice vinegar. 2. Place nori on bamboo mat, spread rice. 3. Add fillings in a line. 4. Roll tightly using the mat. 5. Slice into 6-8 pieces.'
  },
  {
    id: 11,
    title: 'Cheeseburger',
    category: 'Lunch',
    ingredients: 'Ground beef patty, Cheddar, Brioche bun, Lettuce, Tomato, Pickles, Ketchup, Mustard',
    tags: ['Fast Food', 'Meat'],
    rating: 4,
    description: '1. Season beef and form into patties. 2. Grill on high heat 4 min per side. 3. Add cheese in last minute. 4. Toast the bun. 5. Assemble with toppings and sauces.'
  },
  {
    id: 12,
    title: 'Tom Yum Soup',
    category: 'Dinner',
    ingredients: 'Shrimp, Lemongrass, Kaffir lime leaves, Galangal, Mushrooms, Fish sauce, Lime juice, Chili',
    tags: ['Spicy', 'Healthy'],
    rating: 5,
    description: '1. Boil water with lemongrass and galangal. 2. Add mushrooms and shrimp. 3. Season with fish sauce and lime juice. 4. Add chili to taste. 5. Garnish with coriander.'
  },
  {
    id: 13,
    title: 'Avocado Toast',
    category: 'Breakfast',
    ingredients: 'Sourdough bread, Avocado, Lemon juice, Red chili flakes, Sea salt, Poached egg',
    tags: ['Vegan', 'Healthy', 'Quick'],
    rating: 4,
    description: '1. Toast sourdough until golden. 2. Mash avocado with lemon juice and salt. 3. Spread on toast. 4. Poach an egg and place on top. 5. Sprinkle with chili flakes.'
  },
  {
    id: 14,
    title: 'Margherita Pizza',
    category: 'Dinner',
    ingredients: 'Pizza dough, Tomato sauce, Mozzarella, Fresh basil, Olive oil, Salt',
    tags: ['Vegan', 'Traditional'],
    rating: 5,
    description: '1. Stretch dough into 30 cm circle. 2. Spread tomato sauce. 3. Add torn mozzarella. 4. Bake at 250°C for 10-12 minutes. 5. Finish with fresh basil and olive oil.'
  },
  {
    id: 15,
    title: 'Chicken Curry',
    category: 'Dinner',
    ingredients: 'Chicken, Coconut milk, Onion, Tomatoes, Curry paste, Garlic, Ginger, Basmati rice',
    tags: ['Spicy', 'Meat'],
    rating: 5,
    description: '1. Sauté onion, garlic and ginger. 2. Add curry paste and cook 2 minutes. 3. Add chicken and brown. 4. Pour in coconut milk and tomatoes. 5. Simmer 20 min. Serve with rice.'
  },
  {
    id: 16,
    title: 'Greek Salad',
    category: 'Lunch',
    ingredients: 'Cucumber, Tomatoes, Red onion, Kalamata olives, Feta cheese, Olive oil, Oregano',
    tags: ['Vegan', 'Healthy'],
    rating: 4,
    description: '1. Chop cucumber, tomatoes and onion into chunks. 2. Add olives and crumbled feta. 3. Drizzle with olive oil. 4. Season with oregano, salt and pepper. 5. Toss gently and serve.'
  },
  {
    id: 17,
    title: 'Chocolate Lava Cake',
    category: 'Dessert',
    ingredients: 'Dark chocolate, Butter, Eggs, Sugar, Flour, Vanilla extract',
    tags: ['Quick'],
    rating: 5,
    description: '1. Melt chocolate and butter together. 2. Whisk in eggs and sugar. 3. Fold in flour. 4. Pour into buttered ramekins. 5. Bake at 200°C for 12 minutes. Centre should be runny.'
  },
  {
    id: 18,
    title: 'Granola Bowl',
    category: 'Breakfast',
    ingredients: 'Oats, Honey, Almonds, Dried cranberries, Greek yogurt, Banana, Blueberries',
    tags: ['Healthy', 'Vegan'],
    rating: 4,
    description: '1. Bake oats with honey and almonds at 180°C for 20 min. 2. Let cool completely. 3. Spoon yogurt into a bowl. 4. Top with granola and fresh fruit.'
  },
  {
    id: 19,
    title: 'Tacos al Pastor',
    category: 'Lunch',
    ingredients: 'Corn tortillas, Pork shoulder, Pineapple, Onion, Cilantro, Achiote paste, Chipotle, Lime',
    tags: ['Spicy', 'Fast Food', 'Meat'],
    rating: 5,
    description: '1. Marinate pork in achiote and chipotle overnight. 2. Grill on high heat until charred. 3. Slice thinly. 4. Warm tortillas. 5. Fill with pork, pineapple, onion and cilantro.'
  },
  {
    id: 20,
    title: 'Tiramisu',
    category: 'Dessert',
    ingredients: 'Ladyfingers, Mascarpone, Eggs, Sugar, Espresso, Cocoa powder, Dark rum',
    tags: ['Traditional'],
    rating: 5,
    description: '1. Beat egg yolks with sugar until pale. 2. Fold in mascarpone. 3. Dip ladyfingers in espresso+rum. 4. Layer cookies and cream in a dish. 5. Dust with cocoa and refrigerate 4 hours.'
  }
]

// ============================================
// TIMER STATES
// ============================================
export const TIMER_STATE = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  FINISHED: 'finished'
}

export function RecipeProvider({ children }) {
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ============================================
  // LAB 5 REQUIREMENT (Задача 3): Edit Mode
  // editingRecipe — the recipe being edited, or null
  // ============================================
  const [editingRecipe, setEditingRecipe] = useState(null)

  // Global Timer state
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerState, setTimerState] = useState(TIMER_STATE.IDLE)
  const [timerInitialMinutes, setTimerInitialMinutes] = useState(5)
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false)

  const deleteTimersRef = useRef(new Map())
  const alarmAudioRef = useRef(null)

  // ============================================
  // ALARM SOUND INIT
  // ============================================
  useEffect(() => {
    try {
      const audio = new Audio(ALARM_SOUND_PATH)
      audio.loop = true
      audio.preload = 'auto'
      audio.addEventListener('error', () => { alarmAudioRef.current = null })
      audio.addEventListener('canplaythrough', () => { alarmAudioRef.current = audio })
      audio.load()
      alarmAudioRef.current = audio
    } catch {
      alarmAudioRef.current = null
    }
    return () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause()
        alarmAudioRef.current = null
      }
    }
  }, [])

  // Play alarm when timer finishes
  useEffect(() => {
    if (timerState === TIMER_STATE.FINISHED) playAlarm()
    else stopAlarm()
  }, [timerState])

  // ============================================
  // LAB 3 REQUIREMENT: useEffect with cleanup
  // ============================================
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) {
        try { setRecipes(JSON.parse(saved)) }
        catch { setRecipes(mockData) }
      } else {
        setRecipes(mockData)
      }
      setIsLoading(false)
    }, 1200)
    return () => clearTimeout(loadTimer)
  }, [])

  useEffect(() => {
    if (!isLoading) localStorage.setItem(LOCAL_KEY, JSON.stringify(recipes))
  }, [recipes, isLoading])

  useEffect(() => {
    const timers = deleteTimersRef.current
    return () => { timers.forEach(id => clearTimeout(id)); timers.clear() }
  }, [])

  // ============================================
  // GLOBAL TIMER EFFECT (clearInterval cleanup)
  // ============================================
  useEffect(() => {
    if (timerState !== TIMER_STATE.RUNNING) return
    const intervalId = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) { setTimerState(TIMER_STATE.FINISHED); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalId)
  }, [timerState])

  // ============================================
  // ALARM HELPERS
  // ============================================
  function playAlarm() {
    const audio = alarmAudioRef.current
    if (!audio) return
    try {
      audio.currentTime = 0
      const p = audio.play()
      if (p) p.then(() => setIsAlarmPlaying(true)).catch(() => setIsAlarmPlaying(false))
    } catch { }
  }

  function stopAlarm() {
    const audio = alarmAudioRef.current
    if (audio && !audio.paused) { try { audio.pause(); audio.currentTime = 0 } catch { } }
    setIsAlarmPlaying(false)
  }

  // ============================================
  // TIMER CONTROLS
  // ============================================
  const startGlobalTimer = useCallback((minutes) => {
    const mins = Math.max(1, Math.min(120, minutes || timerInitialMinutes))
    setTimerInitialMinutes(mins)
    setTimerSeconds(mins * 60)
    setTimerState(TIMER_STATE.RUNNING)
  }, [timerInitialMinutes])

  const pauseGlobalTimer = useCallback(() => {
    if (timerState === TIMER_STATE.RUNNING) setTimerState(TIMER_STATE.PAUSED)
  }, [timerState])

  const resumeGlobalTimer = useCallback(() => {
    if (timerState === TIMER_STATE.PAUSED && timerSeconds > 0) setTimerState(TIMER_STATE.RUNNING)
  }, [timerState, timerSeconds])

  const resetGlobalTimer = useCallback(() => {
    stopAlarm()
    setTimerState(TIMER_STATE.IDLE)
    setTimerSeconds(0)
  }, [])

  const setTimerInputMinutes = useCallback((minutes) => {
    setTimerInitialMinutes(Math.max(1, Math.min(120, minutes)))
  }, [])

  const stopAlarmCb = useCallback(() => stopAlarm(), [])

  // ============================================
  // LAB 5 REQUIREMENT (Задача 9): useCallback
  // RECIPE ACTIONS — stable references
  // ============================================
  const addRecipe = useCallback((r) => {
    setRecipes(prev => [{ ...r, id: Date.now(), tags: r.tags || [] }, ...prev])
  }, [])

  // ============================================
  // LAB 5 REQUIREMENT (Задача 3): Edit Mode
  // updateRecipe replaces the existing recipe by id
  // ============================================
  const updateRecipe = useCallback((updated) => {
    setRecipes(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
    setEditingRecipe(null)
  }, [])

  const deleteRecipe = useCallback((id) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, removing: true } : r))
    const timerId = setTimeout(() => {
      setRecipes(prev => prev.filter(r => r.id !== id))
      deleteTimersRef.current.delete(id)
    }, 320)
    deleteTimersRef.current.set(id, timerId)
  }, [])

  const handleEdit = useCallback((recipe) => {
    setEditingRecipe(recipe)
  }, [])

  // ============================================
  // LAB 5 REQUIREMENT (Задача 8): useMemo
  // Stats computed only when recipes change
  // ============================================
  const stats = useMemo(() => ({
    total: recipes.length,
    byCategory: {
      breakfast: recipes.filter(r => r.category === 'Breakfast').length,
      lunch: recipes.filter(r => r.category === 'Lunch').length,
      dinner: recipes.filter(r => r.category === 'Dinner').length
    },
    averageRating: recipes.length > 0
      ? (recipes.reduce((sum, r) => sum + r.rating, 0) / recipes.length).toFixed(1)
      : 0
  }), [recipes])

  const value = {
    // Recipe state & actions
    recipes,
    isLoading,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    handleEdit,
    editingRecipe,
    setEditingRecipe,
    stats,

    // Timer state
    timerSeconds,
    timerState,
    timerInitialMinutes,
    isTimerRunning: timerState === TIMER_STATE.RUNNING,
    isTimerPaused: timerState === TIMER_STATE.PAUSED,
    isTimerFinished: timerState === TIMER_STATE.FINISHED,
    isTimerIdle: timerState === TIMER_STATE.IDLE,
    isAlarmPlaying,

    // Timer actions
    startGlobalTimer,
    pauseGlobalTimer,
    resumeGlobalTimer,
    resetGlobalTimer,
    setTimerInputMinutes,
    stopAlarm: stopAlarmCb,

    TIMER_STATE
  }

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  )
}

export function useRecipes() {
  const ctx = useContext(RecipeContext)
  if (!ctx) throw new Error('useRecipes must be used within a RecipeProvider')
  return ctx
}

export default RecipeContext
