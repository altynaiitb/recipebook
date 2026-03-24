import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'

// ============================================
// LAB 5: Lazy loading + React.lazy/Suspense
// LAB 6: Добавлена страница /explore (ApiRecipesPage)
// ============================================
const HomePage       = lazy(() => import('./pages/HomePage'))
const RecipesPage    = lazy(() => import('./pages/RecipesPage'))
const ProfilePage    = lazy(() => import('./pages/ProfilePage'))
const ApiRecipesPage = lazy(() => import('./pages/ApiRecipesPage'))
const NotFoundPage   = lazy(() => import('./pages/NotFoundPage'))

const Fallback = (
  <div className="loading" style={{ marginTop: '4rem' }}>
    <div className="spinner" aria-hidden></div>
    <div className="loading-text">Loading page…</div>
  </div>
)

export default function App() {
  return (
    <div className="app-root">
      <NavBar />
      <Suspense fallback={Fallback}>
        <Routes>
          <Route path="/"         element={<HomePage />} />
          <Route path="/recipes"  element={<RecipesPage />} />
          <Route path="/explore"  element={<ApiRecipesPage />} />
          <Route path="/profile"  element={<ProfilePage />} />
          <Route path="*"         element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}
