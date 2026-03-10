import React from 'react'
import { NavLink } from 'react-router-dom'
import { useRecipes } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'

// ============================================
// LAB 4 REQUIREMENT: Navigation Component
// Uses NavLink for active state highlighting
// Shows recipe stats from Context
// ============================================

export default function NavBar() {
  const { stats } = useRecipes()
  // LAB 5 (Задача 11): favorites count from the split FavoritesContext
  const { favoritesCount } = useFavorites()

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-icon">🍳</span>
        <span className="brand-text">Recipe Book</span>
      </div>

      <ul className="nav-links">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/recipes"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="nav-icon">📖</span>
            <span className="nav-text">Recipes</span>
            <span className="nav-badge">{stats.total}</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/profile"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
            {favoritesCount > 0 && (
              <span className="nav-badge favorite">{favoritesCount}</span>
            )}
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
