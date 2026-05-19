import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import NavBar            from './components/layout/NavBar'
import NotificationToast from './components/ui/NotificationToast'
import MFAForm           from './components/auth/MFAForm'
import ScreenProtection  from './components/layout/ScreenProtection'
import AnimatedPage      from './components/layout/AnimatedPage'
import { useRecipes }    from './context/RecipeContext'

const HomePage       = lazy(() => import('./pages/HomePage'))
const RecipesPage    = lazy(() => import('./pages/RecipesPage'))
const ProfilePage    = lazy(() => import('./pages/ProfilePage'))
const ApiRecipesPage = lazy(() => import('./pages/ApiRecipesPage'))
const AIChefPage     = lazy(() => import('./pages/AIChefPage'))
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'))
const LoginPage      = lazy(() => import('./pages/LoginPage'))
const SignUpPage      = lazy(() => import('./pages/SignUpPage'))

const Fallback = (
  <div className="loading" style={{ marginTop: '4rem' }}>
    <div className="spinner" aria-hidden></div>
    <div className="loading-text">Loading…</div>
  </div>
)

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useRecipes()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function BlobBackground() {
  return (
    <div className="blob-bg" aria-hidden>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <div className="app-root">
      <BlobBackground />
      <NavBar />
      <ScreenProtection />
      <NotificationToast />
      <MFAForm />

      <Suspense fallback={Fallback}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public auth routes */}
            <Route path="/login"  element={<AnimatedPage><LoginPage /></AnimatedPage>} />
            <Route path="/signup" element={<AnimatedPage><SignUpPage /></AnimatedPage>} />

            {/* Protected routes */}
            <Route path="/"        element={<ProtectedRoute><AnimatedPage><HomePage /></AnimatedPage></ProtectedRoute>} />
            <Route path="/recipes" element={<ProtectedRoute><AnimatedPage><RecipesPage /></AnimatedPage></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><AnimatedPage><ApiRecipesPage /></AnimatedPage></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><AnimatedPage><ProfilePage /></AnimatedPage></ProtectedRoute>} />
            <Route path="/ai-chef" element={<ProtectedRoute><AnimatedPage><AIChefPage /></AnimatedPage></ProtectedRoute>} />

            <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  )
}
