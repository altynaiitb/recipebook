import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  apiGetRecipes, apiAddRecipe, apiUpdateRecipe, apiDeleteRecipe,
  apiSignIn, apiSignUp, apiSignOut, apiGetSession, apiOnAuthChange,
  apiVerifyMFA, apiChallengeMFA
} from '../api/supabaseApi'
import { DEMO_MODE } from '../lib/supabase'

const RecipeContext = createContext(null)

const ALARM_SOUND_PATH = '/alarm.mp3'
export const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert']
export const TAGS       = ['Vegan', 'Fast Food', 'Spicy', 'Traditional', 'Healthy', 'Meat', 'Quick']
export const TIMER_STATE = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused', FINISHED: 'finished' }
export const AUTH_STAGE  = { UNAUTHENTICATED: 'unauthenticated', PENDING_MFA: 'pending_mfa', AUTHENTICATED: 'authenticated' }

let _notifId = 0
function makeNotif(msg, type = 'success') { return { id: ++_notifId, message: msg, type } }

export function RecipeProvider({ children }) {
  // ── Recipes ───────────────────────────────────────────────────────
  const [recipes,   setRecipes]   = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError,  setApiError]  = useState(null)

  // ── Auth ──────────────────────────────────────────────────────────
  // In DEMO_MODE: starts authenticated (as before)
  // In PRODUCTION: starts unauthenticated, session restored from JWT
  const [authStage,   setAuthStage]   = useState(DEMO_MODE ? AUTH_STAGE.AUTHENTICATED : AUTH_STAGE.UNAUTHENTICATED)
  const [currentUser, setCurrentUser] = useState(null)
  const [lastLogin,   setLastLogin]   = useState(DEMO_MODE ? new Date() : null)
  const [mfaFactorId, setMfaFactorId] = useState(null) // stored during pending_mfa

  const isAuthenticated      = authStage === AUTH_STAGE.AUTHENTICATED
  const isPendingMFA         = authStage === AUTH_STAGE.PENDING_MFA
  const isFullyAuthenticated = isAuthenticated

  // ── Notifications ─────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([])
  const notifTimers = useRef(new Map())

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const t = notifTimers.current.get(id)
    if (t) { clearTimeout(t); notifTimers.current.delete(id) }
  }, [])

  const addNotification = useCallback((message, type = 'success') => {
    const n = makeNotif(message, type)
    setNotifications(prev => [...prev, n])
    const t = setTimeout(() => {
      setNotifications(prev => prev.filter(x => x.id !== n.id))
      notifTimers.current.delete(n.id)
    }, 3500)
    notifTimers.current.set(n.id, t)
  }, [])

  useEffect(() => {
    const m = notifTimers.current
    return () => { m.forEach(clearTimeout); m.clear() }
  }, [])

  // ── Restore JWT session on mount (production only) ────────────────
  useEffect(() => {
    if (DEMO_MODE) return
    apiGetSession().then(session => {
      if (session?.user) {
        setCurrentUser(session.user)
        setLastLogin(new Date(session.user.last_sign_in_at ?? Date.now()))
        setAuthStage(AUTH_STAGE.AUTHENTICATED)
      }
    })

    const unsub = apiOnAuthChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user)
        setLastLogin(new Date(session.user.last_sign_in_at ?? Date.now()))
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setLastLogin(null)
        setAuthStage(AUTH_STAGE.UNAUTHENTICATED)
      }
    })
    return unsub
  }, [])

  // ── Load recipes ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setIsLoading(true); setApiError(null)
    apiGetRecipes()
      .then(data   => { if (!cancelled) setRecipes(data) })
      .catch(err   => { if (!cancelled) { setApiError(err.message); addNotification(`⚠️ ${err.message}`, 'error') } })
      .finally(()  => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [addNotification])

  // ── Auth actions ──────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    try {
      const result = await apiSignIn(email, password)
      setCurrentUser(result.user)
      if (result.needsMFA) {
        setMfaFactorId(result.factorId)
        setAuthStage(AUTH_STAGE.PENDING_MFA)
      } else {
        setLastLogin(new Date())
        setAuthStage(AUTH_STAGE.AUTHENTICATED)
      }
    } catch (err) {
      addNotification(`❌ Sign-in failed: ${err.message}`, 'error')
      throw err
    }
  }, [addNotification])

  const signUp = useCallback(async (email, password, username) => {
    try {
      await apiSignUp(email, password, username)
      addNotification('✅ Account created! Check your email to confirm.', 'success')
    } catch (err) {
      addNotification(`❌ Sign-up failed: ${err.message}`, 'error')
      throw err
    }
  }, [addNotification])

  const logout = useCallback(async () => {
    await apiSignOut().catch(() => {})
    setCurrentUser(null); setLastLogin(null); setMfaFactorId(null)
    setAuthStage(AUTH_STAGE.UNAUTHENTICATED)
  }, [])

  // Legacy demo compat: login() = go to pending_mfa state
  const login = useCallback(() => setAuthStage(AUTH_STAGE.PENDING_MFA), [])

  const completeMFA = useCallback(() => {
    setAuthStage(AUTH_STAGE.AUTHENTICATED)
    setLastLogin(new Date())
  }, [])

  // ── Editing ───────────────────────────────────────────────────────
  const [editingRecipe, setEditingRecipe] = useState(null)
  const handleEdit = useCallback(r => setEditingRecipe(r), [])

  // ── Timer ─────────────────────────────────────────────────────────
  const [timerSeconds,        setTimerSeconds]       = useState(0)
  const [timerState,          setTimerState]          = useState(TIMER_STATE.IDLE)
  const [timerInitialMinutes, setTimerInitialMinutes] = useState(5)
  const [isAlarmPlaying,      setIsAlarmPlaying]      = useState(false)
  const alarmRef   = useRef(null)
  const delTimers  = useRef(new Map())

  useEffect(() => {
    try {
      const a = new Audio(ALARM_SOUND_PATH); a.loop = true; a.preload = 'auto'
      a.addEventListener('error', () => { alarmRef.current = null })
      a.addEventListener('canplaythrough', () => { alarmRef.current = a })
      a.load(); alarmRef.current = a
    } catch { alarmRef.current = null }
    return () => { if (alarmRef.current) { alarmRef.current.pause(); alarmRef.current = null } }
  }, [])

  useEffect(() => { if (timerState === TIMER_STATE.FINISHED) playAlarm(); else stopAlarm() }, [timerState])
  useEffect(() => {
    const t = delTimers.current
    return () => { t.forEach(clearTimeout); t.clear() }
  }, [])
  useEffect(() => {
    if (timerState !== TIMER_STATE.RUNNING) return
    const id = setInterval(() => setTimerSeconds(p => { if (p <= 1) { setTimerState(TIMER_STATE.FINISHED); return 0 } return p - 1 }), 1000)
    return () => clearInterval(id)
  }, [timerState])

  function playAlarm() { const a = alarmRef.current; if (!a) return; try { a.currentTime = 0; const p = a.play(); if (p) p.then(() => setIsAlarmPlaying(true)).catch(() => {}) } catch {} }
  function stopAlarm()  { const a = alarmRef.current; if (a && !a.paused) { try { a.pause(); a.currentTime = 0 } catch {} } setIsAlarmPlaying(false) }

  const startGlobalTimer  = useCallback(m => { const mins = Math.max(1, Math.min(120, m || timerInitialMinutes)); setTimerInitialMinutes(mins); setTimerSeconds(mins * 60); setTimerState(TIMER_STATE.RUNNING) }, [timerInitialMinutes])
  const pauseGlobalTimer  = useCallback(() => { if (timerState === TIMER_STATE.RUNNING) setTimerState(TIMER_STATE.PAUSED) }, [timerState])
  const resumeGlobalTimer = useCallback(() => { if (timerState === TIMER_STATE.PAUSED && timerSeconds > 0) setTimerState(TIMER_STATE.RUNNING) }, [timerState, timerSeconds])
  const resetGlobalTimer  = useCallback(() => { stopAlarm(); setTimerState(TIMER_STATE.IDLE); setTimerSeconds(0) }, [])
  const setTimerInputMinutes = useCallback(m => setTimerInitialMinutes(Math.max(1, Math.min(120, m))), [])
  const stopAlarmCb = useCallback(() => stopAlarm(), [])

  // ── CRUD ──────────────────────────────────────────────────────────
  const addRecipe = useCallback(async r => {
    try {
      const created = await apiAddRecipe({ ...r, tags: r.tags || [] })
      setRecipes(prev => [created, ...prev])
      addNotification(`✅ "${created.title}" added!`, 'success')
    } catch (err) { console.error('addRecipe:', err); addNotification(`❌ ${err.message}`, 'error') }
  }, [addNotification])

  const updateRecipe = useCallback(async updated => {
    try {
      const saved = await apiUpdateRecipe(updated.id, updated)
      setRecipes(prev => prev.map(r => r.id === saved.id ? saved : r))
      setEditingRecipe(null)
      addNotification(`✏️ "${saved.title}" updated!`, 'success')
    } catch (err) { console.error('updateRecipe:', err); addNotification(`❌ ${err.message}`, 'error') }
  }, [addNotification])

  const deleteRecipe = useCallback(async id => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, removing: true } : r))
    const t = setTimeout(async () => {
      try {
        await apiDeleteRecipe(id)
        setRecipes(prev => { const d = prev.find(r => r.id === id); if (d) addNotification(`🗑️ "${d.title}" deleted.`, 'success'); return prev.filter(r => r.id !== id) })
      } catch (err) { console.error('deleteRecipe:', err); setRecipes(prev => prev.map(r => r.id === id ? { ...r, removing: false } : r)); addNotification(`❌ ${err.message}`, 'error') }
      delTimers.current.delete(id)
    }, 320)
    delTimers.current.set(id, t)
  }, [addNotification])

  const stats = useMemo(() => ({
    total: recipes.length,
    byCategory: {
      breakfast: recipes.filter(r => r.category === 'Breakfast').length,
      lunch:     recipes.filter(r => r.category === 'Lunch').length,
      dinner:    recipes.filter(r => r.category === 'Dinner').length
    },
    averageRating: recipes.length > 0
      ? (recipes.reduce((s, r) => s + (r.rating || 0), 0) / recipes.length).toFixed(1) : 0
  }), [recipes])

  const value = {
    recipes, isLoading, apiError, addRecipe, updateRecipe, deleteRecipe,
    handleEdit, editingRecipe, setEditingRecipe, stats,
    // Auth
    isAuthenticated, isFullyAuthenticated, isPendingMFA, currentUser, lastLogin, mfaFactorId,
    login, logout, signIn, signUp, completeMFA,
    // Notifications
    notifications, addNotification, dismissNotification,
    // Timer
    timerSeconds, timerState, timerInitialMinutes, isAlarmPlaying,
    isTimerRunning: timerState === TIMER_STATE.RUNNING,
    isTimerPaused:  timerState === TIMER_STATE.PAUSED,
    isTimerFinished:timerState === TIMER_STATE.FINISHED,
    isTimerIdle:    timerState === TIMER_STATE.IDLE,
    startGlobalTimer, pauseGlobalTimer, resumeGlobalTimer,
    resetGlobalTimer, setTimerInputMinutes, stopAlarm: stopAlarmCb,
    TIMER_STATE, DEMO_MODE
  }

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>
}

export function useRecipes() {
  const ctx = useContext(RecipeContext)
  if (!ctx) throw new Error('useRecipes must be used within a RecipeProvider')
  return ctx
}

export default RecipeContext
