import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Components
import NavBar from './components/NavBar'

// Pages
import HomePage from './pages/HomePage'
import RecipesPage from './pages/RecipesPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

// ============================================
// LAB 4 REQUIREMENT: React Router Setup
// App component now serves as the main layout
// with navigation and route definitions
// ============================================

export default function App() {
  return (
    <div className="app-root">
      {/* Navigation - visible on all pages */}
      <NavBar />

      {/* Route Definitions */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}
