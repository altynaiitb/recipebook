import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar            from './components/NavBar'
import NotificationToast from './components/NotificationToast'
import MFAForm           from './components/MFAForm'
import ScreenProtection  from './components/ScreenProtection'
import { useRecipes }    from './context/RecipeContext'

// LAB 8: Lazy-loaded pages
const HomePage       = lazy(() => import('./pages/HomePage'))
const RecipesPage    = lazy(() => import('./pages/RecipesPage'))
const ProfilePage    = lazy(() => import('./pages/ProfilePage'))
const ApiRecipesPage = lazy(() => import('./pages/ApiRecipesPage'))
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'))
const LoginPage      = lazy(() => import('./pages/LoginPage'))
const SignUpPage      = lazy(() => import('./pages/SignUpPage'))

const Fallback = (
  <div className="loading" style={{ marginTop: '4rem' }}>
    <div className="spinner" aria-hidden></div>
    <div className="loading-text">Loading…</div>
  </div>
)

// Protected route: redirects to /login when unauthenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useRecipes()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <div className="app-root">
      <NavBar />
      <ScreenProtection />
      <NotificationToast />
      <MFAForm />

      <Suspense fallback={Fallback}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Protected routes — redirect to /login if not authenticated */}
          <Route path="/"        element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><ApiRecipesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*"        element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}
