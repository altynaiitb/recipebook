import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react'

// ============================================
// LAB 4 REQUIREMENT: Context API for Global State
// This context provides recipe data and actions
// to all components without prop drilling
//
// UPDATED: Timer state is now global to persist
// across page navigation
//
// UPDATED: Added alarm sound notification
// ============================================

const RecipeContext = createContext(null)

const LOCAL_KEY = 'recipe_book_recipes_v1'
const ALARM_SOUND_PATH = '/alarm.mp3'

const mockData = [
  {
    id: 1,
    title: 'Morning Pancakes',
    category: 'Breakfast',
    ingredients: 'Flour, Milk, Eggs, Sugar',
    rating: 4,
    liked: false,
    description: '1. Mix dry and wet ingredients. 2. Pour batter on a hot pan. 3. Flip when bubbles appear.'
  },
  {
    id: 2,
    title: 'Classic Caesar',
    category: 'Lunch',
    ingredients: 'Romaine lettuce, Croutons, Caesar dressing, Parmesan',
    rating: 5,
    liked: true,
    description: '1. Grill the chicken. 2. Toss the romaine lettuce with dressing. 3. Add croutons and parmesan.'
  },
  {
    id: 3,
    title: 'Spaghetti',
    category: 'Dinner',
    ingredients: 'Pasta, Tomato sauce, Basil',
    rating: 4,
    liked: false,
    description: 'Cook pasta until al dente and mix with a rich tomato basil sauce.'
  }
]

// ============================================
// TIMER STATES - Clear distinction between states
// ============================================
const TIMER_STATE = {
  IDLE: 'idle',       // Timer never started or was reset
  RUNNING: 'running', // Timer is actively counting down
  PAUSED: 'paused',   // Timer was paused mid-countdown
  FINISHED: 'finished' // Timer completed (reached zero)
}

export function RecipeProvider({ children }) {
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ============================================
  // GLOBAL TIMER STATE
  // Persists across page navigation because it
  // lives in the Provider, not in individual components
  // ============================================
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerState, setTimerState] = useState(TIMER_STATE.IDLE)
  const [timerInitialMinutes, setTimerInitialMinutes] = useState(5)
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false)

  // Refs
  const deleteTimersRef = useRef(new Map())
  const alarmAudioRef = useRef(null)

  // ============================================
  // ALARM SOUND INITIALIZATION
  // Creates Audio object once, with error handling
  // ============================================
  useEffect(() => {
    try {
      const audio = new Audio(ALARM_SOUND_PATH)
      audio.loop = true // Loop until user stops it
      audio.preload = 'auto'

      // Handle loading errors gracefully
      audio.addEventListener('error', (e) => {
        console.warn('Alarm sound could not be loaded:', e.message || 'File not found')
        alarmAudioRef.current = null
      })

      audio.addEventListener('canplaythrough', () => {
        // Audio is ready to play
        alarmAudioRef.current = audio
      })

      // Try to load the audio
      audio.load()
      alarmAudioRef.current = audio

    } catch (error) {
      console.warn('Audio API not supported or alarm file missing:', error)
      alarmAudioRef.current = null
    }

    // Cleanup on unmount
    return () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause()
        alarmAudioRef.current = null
      }
    }
  }, [])

  // ============================================
  // ALARM SOUND EFFECT
  // Plays when timer state changes to FINISHED
  // ============================================
  useEffect(() => {
    if (timerState === TIMER_STATE.FINISHED) {
      playAlarm()
    } else {
      // Stop alarm if state changes away from FINISHED
      stopAlarm()
    }
  }, [timerState])

  // ============================================
  // ALARM CONTROL FUNCTIONS
  // ============================================
  function playAlarm() {
    const audio = alarmAudioRef.current
    if (!audio) {
      console.warn('Alarm sound not available')
      return
    }

    try {
      audio.currentTime = 0
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsAlarmPlaying(true)
          })
          .catch((error) => {
            // Auto-play was prevented (browser policy)
            console.warn('Alarm autoplay prevented:', error.message)
            setIsAlarmPlaying(false)
          })
      }
    } catch (error) {
      console.warn('Failed to play alarm:', error)
    }
  }

  function stopAlarm() {
    const audio = alarmAudioRef.current
    if (audio && !audio.paused) {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (error) {
        console.warn('Failed to stop alarm:', error)
      }
    }
    setIsAlarmPlaying(false)
  }

  // ============================================
  // LAB 3 REQUIREMENT: useEffect with cleanup
  // Simulates API fetch with setTimeout
  // ============================================
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) {
        try {
          setRecipes(JSON.parse(saved))
        } catch (e) {
          console.warn('Failed to parse saved recipes', e)
          setRecipes(mockData)
        }
      } else {
        setRecipes(mockData)
      }
      setIsLoading(false)
    }, 1200)

    // ✅ CLEANUP FUNCTION
    return () => {
      clearTimeout(loadTimer)
    }
  }, [])

  // LocalStorage persistence effect
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(recipes))
    }
  }, [recipes, isLoading])

  // Cleanup delete timers on unmount
  useEffect(() => {
    const timers = deleteTimersRef.current
    return () => {
      timers.forEach((timerId) => clearTimeout(timerId))
      timers.clear()
    }
  }, [])

  // ============================================
  // GLOBAL TIMER EFFECT
  // LAB 3 REQUIREMENT: useEffect with cleanup (clearInterval)
  //
  // This runs in the Provider, so it persists across
  // page navigation. The timer keeps ticking even when
  // the user navigates to Home or Profile pages.
  // ============================================
  useEffect(() => {
    // Only run interval if timer is in RUNNING state
    if (timerState !== TIMER_STATE.RUNNING) {
      return
    }

    const intervalId = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          // Timer finished - update state
          // This will trigger the alarm effect
          setTimerState(TIMER_STATE.FINISHED)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // ✅ CLEANUP FUNCTION - Critical for Lab requirement!
    // Prevents memory leaks when:
    // 1. Provider unmounts (app closes)
    // 2. timerState changes (paused, finished, reset)
    return () => {
      clearInterval(intervalId)
    }
  }, [timerState])

  // ============================================
  // TIMER CONTROL FUNCTIONS
  // ============================================
  function startGlobalTimer(minutes) {
    const mins = Math.max(1, Math.min(120, minutes || timerInitialMinutes))
    setTimerInitialMinutes(mins)
    setTimerSeconds(mins * 60)
    setTimerState(TIMER_STATE.RUNNING)
  }

  function pauseGlobalTimer() {
    if (timerState === TIMER_STATE.RUNNING) {
      setTimerState(TIMER_STATE.PAUSED)
    }
  }

  function resumeGlobalTimer() {
    if (timerState === TIMER_STATE.PAUSED && timerSeconds > 0) {
      setTimerState(TIMER_STATE.RUNNING)
    }
  }

  function resetGlobalTimer() {
    // Stop alarm when resetting
    stopAlarm()
    setTimerState(TIMER_STATE.IDLE)
    setTimerSeconds(0)
  }

  function setTimerInputMinutes(minutes) {
    setTimerInitialMinutes(Math.max(1, Math.min(120, minutes)))
  }

  // ============================================
  // RECIPE ACTIONS
  // ============================================
  function addRecipe(r) {
    setRecipes(prev => [{ ...r, id: Date.now(), liked: false }, ...prev])
  }

  function deleteRecipe(id) {
    // Mark as removing for CSS animation
    setRecipes(prev => prev.map(r => (r.id === id ? { ...r, removing: true } : r)))

    const timerId = setTimeout(() => {
      setRecipes(prev => prev.filter(r => r.id !== id))
      deleteTimersRef.current.delete(id)
    }, 320)

    deleteTimersRef.current.set(id, timerId)
  }

  function toggleLike(id) {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, liked: !r.liked } : r))
  }

  // ============================================
  // COMPUTED STATS (Memoized)
  // ============================================
  const stats = useMemo(() => ({
    total: recipes.length,
    favorites: recipes.filter(r => r.liked).length,
    byCategory: {
      breakfast: recipes.filter(r => r.category === 'Breakfast').length,
      lunch: recipes.filter(r => r.category === 'Lunch').length,
      dinner: recipes.filter(r => r.category === 'Dinner').length
    },
    averageRating: recipes.length > 0
      ? (recipes.reduce((sum, r) => sum + r.rating, 0) / recipes.length).toFixed(1)
      : 0
  }), [recipes])

  // Get only liked recipes
  const likedRecipes = useMemo(() => {
    return recipes.filter(r => r.liked)
  }, [recipes])

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = {
    // Recipe state and actions
    recipes,
    isLoading,
    addRecipe,
    deleteRecipe,
    toggleLike,
    stats,
    likedRecipes,

    // Timer state (GLOBAL - persists across pages)
    timerSeconds,
    timerState,
    timerInitialMinutes,

    // Timer computed states for easy access
    isTimerRunning: timerState === TIMER_STATE.RUNNING,
    isTimerPaused: timerState === TIMER_STATE.PAUSED,
    isTimerFinished: timerState === TIMER_STATE.FINISHED,
    isTimerIdle: timerState === TIMER_STATE.IDLE,

    // Alarm state
    isAlarmPlaying,

    // Timer actions
    startGlobalTimer,
    pauseGlobalTimer,
    resumeGlobalTimer,
    resetGlobalTimer,
    setTimerInputMinutes,
    stopAlarm,

    // Export TIMER_STATE for reference
    TIMER_STATE
  }

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  )
}

// ============================================
// CUSTOM HOOK for using Recipe Context
// Throws error if used outside Provider
// ============================================
export function useRecipes() {
  const context = useContext(RecipeContext)
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider')
  }
  return context
}

export default RecipeContext
