import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { apiGetRecipes, apiAddRecipe, apiUpdateRecipe, apiDeleteRecipe } from '../api/mockApi'

// ============================================
// LAB 6 REQUIREMENTS SATISFIED IN THIS FILE:
// Задача 7: addRecipe / updateRecipe — обращаются к mock API
// Задача 8: deleteRecipe — обращается к mock API,
//           после успешного ответа обновляет глобальное состояние
//
// (Lab 5 требования сохранены: useCallback, useMemo, Timer)
// ============================================

const RecipeContext = createContext(null)

const ALARM_SOUND_PATH = '/alarm.mp3'

export const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert']
export const TAGS       = ['Vegan', 'Fast Food', 'Spicy', 'Traditional', 'Healthy', 'Meat', 'Quick']

export const TIMER_STATE = {
  IDLE:     'idle',
  RUNNING:  'running',
  PAUSED:   'paused',
  FINISHED: 'finished'
}

export function RecipeProvider({ children }) {
  const [recipes, setRecipes]         = useState([])
  const [isLoading, setIsLoading]     = useState(true)
  const [apiError, setApiError]       = useState(null)

  // LAB 7 Task 2: Authentication state for withAuth HOC
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const login  = useCallback(() => setIsAuthenticated(true), [])
  const logout = useCallback(() => setIsAuthenticated(false), [])

  // Edit mode (Lab 5 Задача 3)
  const [editingRecipe, setEditingRecipe] = useState(null)

  // Global Timer state
  const [timerSeconds,       setTimerSeconds]       = useState(0)
  const [timerState,         setTimerState]          = useState(TIMER_STATE.IDLE)
  const [timerInitialMinutes, setTimerInitialMinutes] = useState(5)
  const [isAlarmPlaying,     setIsAlarmPlaying]      = useState(false)

  const deleteTimersRef = useRef(new Map())
  const alarmAudioRef   = useRef(null)

  // ── Alarm sound ────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (timerState === TIMER_STATE.FINISHED) playAlarm()
    else stopAlarm()
  }, [timerState])

  // ── LAB 6 Задача 5+6: Загрузка рецептов через mock API ────────────────
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setApiError(null)

    apiGetRecipes()
      .then(data => {
        if (!cancelled) setRecipes(data)
      })
      .catch(err => {
        if (!cancelled) setApiError(err.message || 'Failed to load recipes')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const timers = deleteTimersRef.current
    return () => { timers.forEach(id => clearTimeout(id)); timers.clear() }
  }, [])

  // Global Timer interval
  useEffect(() => {
    if (timerState !== TIMER_STATE.RUNNING) return
    const id = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) { setTimerState(TIMER_STATE.FINISHED); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerState])

  // ── Alarm helpers ──────────────────────────────────────────────────────
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
    if (audio && !audio.paused) {
      try { audio.pause(); audio.currentTime = 0 } catch { }
    }
    setIsAlarmPlaying(false)
  }

  // ── Timer controls ─────────────────────────────────────────────────────
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

  // ── LAB 6 Задача 7: addRecipe через API ────────────────────────────────
  const addRecipe = useCallback(async (r) => {
    try {
      const created = await apiAddRecipe({ ...r, tags: r.tags || [] })
      setRecipes(prev => [created, ...prev])
    } catch (err) {
      console.error('addRecipe error:', err)
    }
  }, [])

  // ── LAB 6 Задача 7: updateRecipe через API ─────────────────────────────
  const updateRecipe = useCallback(async (updated) => {
    try {
      const saved = await apiUpdateRecipe(updated.id, updated)
      setRecipes(prev => prev.map(r => r.id === saved.id ? saved : r))
      setEditingRecipe(null)
    } catch (err) {
      console.error('updateRecipe error:', err)
    }
  }, [])

  // ── LAB 6 Задача 8: deleteRecipe через API ────────────────────────────
  const deleteRecipe = useCallback(async (id) => {
    // Оптимистичное обновление: сначала показываем анимацию удаления
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, removing: true } : r))

    const timerId = setTimeout(async () => {
      try {
        await apiDeleteRecipe(id)
        // После успешного ответа от API — удаляем из состояния
        setRecipes(prev => prev.filter(r => r.id !== id))
      } catch (err) {
        // При ошибке — откатываем анимацию
        console.error('deleteRecipe error:', err)
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, removing: false } : r))
      }
      deleteTimersRef.current.delete(id)
    }, 320)

    deleteTimersRef.current.set(id, timerId)
  }, [])

  const handleEdit = useCallback((recipe) => {
    setEditingRecipe(recipe)
  }, [])

  // ── useMemo: вычисляемая статистика (Lab 5 Задача 8) ──────────────────
  const stats = useMemo(() => ({
    total: recipes.length,
    byCategory: {
      breakfast: recipes.filter(r => r.category === 'Breakfast').length,
      lunch:     recipes.filter(r => r.category === 'Lunch').length,
      dinner:    recipes.filter(r => r.category === 'Dinner').length
    },
    averageRating: recipes.length > 0
      ? (recipes.reduce((sum, r) => sum + (r.rating || 0), 0) / recipes.length).toFixed(1)
      : 0
  }), [recipes])

  const value = {
    // Recipe state & actions
    recipes,
    isLoading,
    apiError,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    handleEdit,
    editingRecipe,
    setEditingRecipe,
    stats,

    // LAB 7 Task 2: Auth state
    isAuthenticated,
    login,
    logout,

    // Timer state
    timerSeconds,
    timerState,
    timerInitialMinutes,
    isTimerRunning:  timerState === TIMER_STATE.RUNNING,
    isTimerPaused:   timerState === TIMER_STATE.PAUSED,
    isTimerFinished: timerState === TIMER_STATE.FINISHED,
    isTimerIdle:     timerState === TIMER_STATE.IDLE,
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
