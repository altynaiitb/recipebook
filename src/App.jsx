import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

// Components
import NavBar from './components/NavBar'

// ============================================
// LAB 5 REQUIREMENT (Задача 10): Lazy Loading
// Pages are loaded on demand, not bundled upfront.
// React.lazy + Suspense — code splitting per route.
// ============================================
const HomePage    = lazy(() => import('./pages/HomePage'))
const RecipesPage = lazy(() => import('./pages/RecipesPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  return (
    <div className="app-root">
      {/* Navigation - visible on all pages */}
      <NavBar />

      {/* Suspense wraps all lazy routes with a fallback spinner */}
      <Suspense
        fallback={
          <div className="loading" style={{ marginTop: '4rem' }}>
            <div className="spinner" aria-hidden></div>
            <div className="loading-text">Loading page…</div>
          </div>
        }
      >
        <Routes>
          <Route path="/"        element={<HomePage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*"        element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}
