import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  apiGetRecipes, apiAddRecipe, apiUpdateRecipe, apiDeleteRecipe,
  apiSignIn, apiSignUp, apiSignOut, apiGetSession, apiOnAuthChange,
  apiVerifyMFA, apiChallengeMFA
} from '../api/supabaseApi'
import { DEMO_MODE } from '../lib/supabase'
import { useNotifications } from './NotificationContext'

// ============================================
// RecipeContext — отвечает ТОЛЬКО за:
//   - список рецептов (CRUD)
//   - аутентификацию (auth stage, MFA)
// Уведомления → NotificationContext
// Таймер       → TimerContext
// ============================================

const RecipeContext = createContext(null)

export const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert']
export const TAGS       = ['Vegan', 'Fast Food', 'Spicy', 'Traditional', 'Healthy', 'Meat', 'Quick']
export const AUTH_STAGE = {
  UNAUTHENTICATED: 'unauthenticated',
  PENDING_MFA:     'pending_mfa',
  AUTHENTICATED:   'authenticated',
}

export function RecipeProvider({ children }) {
  // ── Рецепты ───────────────────────────────────────────────────────
  const [recipes,   setRecipes]   = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError,  setApiError]  = useState(null)

  // ── Аутентификация ────────────────────────────────────────────────
  const [authStage,   setAuthStage]   = useState(DEMO_MODE ? AUTH_STAGE.AUTHENTICATED : AUTH_STAGE.UNAUTHENTICATED)
  const [currentUser, setCurrentUser] = useState(null)
  const [lastLogin,   setLastLogin]   = useState(DEMO_MODE ? new Date() : null)
  const [mfaFactorId, setMfaFactorId] = useState(null)

  const isAuthenticated = authStage === AUTH_STAGE.AUTHENTICATED
  const isPendingMFA    = authStage === AUTH_STAGE.PENDING_MFA

  // ── Уведомления через NotificationContext ─────────────────────────
  const { addNotification } = useNotifications()

  // ── Восстановление JWT-сессии при монтировании (только production) ─
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

  // ── Загрузка рецептов ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setApiError(null)
    apiGetRecipes()
      .then(data  => { if (!cancelled) setRecipes(data) })
      .catch(err  => {
        if (!cancelled) {
          setApiError(err.message)
          addNotification(`⚠️ ${err.message}`, 'error')
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [addNotification])

  // ── Auth-действия ─────────────────────────────────────────────────
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
    setCurrentUser(null)
    setLastLogin(null)
    setMfaFactorId(null)
    setAuthStage(AUTH_STAGE.UNAUTHENTICATED)
  }, [])

  // Совместимость с demo-режимом: login() → PENDING_MFA
  const login = useCallback(() => setAuthStage(AUTH_STAGE.PENDING_MFA), [])

  const completeMFA = useCallback(() => {
    setAuthStage(AUTH_STAGE.AUTHENTICATED)
    setLastLogin(new Date())
  }, [])

  // ── Редактирование ────────────────────────────────────────────────
  const [editingRecipe, setEditingRecipe] = useState(null)
  const handleEdit = useCallback(r => setEditingRecipe(r), [])

  // ── CRUD ──────────────────────────────────────────────────────────
  const delTimers = useRef(new Map())

  useEffect(() => {
    const t = delTimers.current
    return () => { t.forEach(clearTimeout); t.clear() }
  }, [])

  const addRecipe = useCallback(async r => {
    try {
      const created = await apiAddRecipe({ ...r, tags: r.tags || [] })
      setRecipes(prev => [created, ...prev])
      addNotification(`✅ "${created.title}" added!`, 'success')
      return created
    } catch (err) {
      console.error('addRecipe:', err)
      addNotification(`❌ ${err.message}`, 'error')
      return null
    }
  }, [addNotification])

  const updateRecipe = useCallback(async updated => {
    try {
      const saved = await apiUpdateRecipe(updated.id, updated)
      setRecipes(prev => prev.map(r => r.id === saved.id ? saved : r))
      setEditingRecipe(null)
      addNotification(`✏️ "${saved.title}" updated!`, 'success')
    } catch (err) {
      console.error('updateRecipe:', err)
      addNotification(`❌ ${err.message}`, 'error')
    }
  }, [addNotification])

  const deleteRecipe = useCallback(async id => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, removing: true } : r))
    const t = setTimeout(async () => {
      try {
        await apiDeleteRecipe(id)
        setRecipes(prev => {
          const d = prev.find(r => r.id === id)
          if (d) addNotification(`🗑️ "${d.title}" deleted.`, 'success')
          return prev.filter(r => r.id !== id)
        })
      } catch (err) {
        console.error('deleteRecipe:', err)
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, removing: false } : r))
        addNotification(`❌ ${err.message}`, 'error')
      }
      delTimers.current.delete(id)
    }, 320)
    delTimers.current.set(id, t)
  }, [addNotification])

  // ── Статистика ────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: recipes.length,
    byCategory: {
      breakfast: recipes.filter(r => r.category === 'Breakfast').length,
      lunch:     recipes.filter(r => r.category === 'Lunch').length,
      dinner:    recipes.filter(r => r.category === 'Dinner').length,
    },
    averageRating: recipes.length > 0
      ? (recipes.reduce((s, r) => s + (r.rating || 0), 0) / recipes.length).toFixed(1)
      : 0,
  }), [recipes])

  const value = {
    // Рецепты
    recipes, isLoading, apiError,
    addRecipe, updateRecipe, deleteRecipe,
    handleEdit, editingRecipe, setEditingRecipe,
    stats,
    // Аутентификация
    isAuthenticated, isPendingMFA,
    currentUser, lastLogin, mfaFactorId,
    login, logout, signIn, signUp, completeMFA,
    // Мета
    DEMO_MODE,
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
