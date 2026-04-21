import React from 'react'
import { NavLink } from 'react-router-dom'
import { useRecipes } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'
import { DEMO_MODE } from '../lib/supabase'

export default function NavBar() {
  const { stats, isAuthenticated, isPendingMFA, currentUser, login, logout } = useRecipes()
  const { favoritesCount } = useFavorites()

  const displayName = currentUser?.user_metadata?.username
    || currentUser?.email?.split('@')[0]
    || (DEMO_MODE ? 'Chef User' : '')

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="brand-icon">🍳</span>
        <span className="brand-text">Recipe Book</span>
        {DEMO_MODE && <span className="demo-chip">DEMO</span>}
      </div>

      <ul className="nav-links">
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/recipes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📖</span>
            <span className="nav-text">Recipes</span>
            <span className="nav-badge">{stats.total}</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/explore" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">🌍</span>
            <span className="nav-text">Explore</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
            {favoritesCount > 0 && <span className="nav-badge favorite">{favoritesCount}</span>}
          </NavLink>
        </li>
      </ul>

      <div className="nav-auth">
        {isAuthenticated && displayName && (
          <span className="nav-username" title={currentUser?.email}>👨‍🍳 {displayName}</span>
        )}

        {isPendingMFA ? (
          <div className="mfa-pending-badge" title="MFA verification required">
            <span className="mfa-badge-dot"></span>
            <span className="mfa-badge-text">MFA Required</span>
          </div>
        ) : (
          <button
            className={`btn auth-toggle-btn ${isAuthenticated ? 'auth-logout' : 'auth-login'}`}
            onClick={isAuthenticated ? logout : login}
            title={isAuthenticated ? 'Log out' : 'Log in'}
          >
            {isAuthenticated ? '🔓 Logout' : '🔒 Login'}
          </button>
        )}
      </div>
    </nav>
  )
}
