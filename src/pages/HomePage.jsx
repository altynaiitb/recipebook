import React from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'
import WindowSize from '../components/WindowSize'

// ============================================
// LAB 4: Home Page Component
// Displays welcome message and statistics from Context
// ============================================

export default function HomePage() {
  const { stats, isLoading } = useRecipes()
  // LAB 5 (Задача 11): favorites count from split FavoritesContext
  const { favoritesCount } = useFavorites()

  return (
    <div className="page home-page">
      <div className="home-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="highlight">Recipe Book</span>
          </h1>
          <p className="hero-subtitle">
            Your personal collection of delicious recipes.
            Add, organize, and find your favorite meals in one place.
          </p>
          <Link to="/recipes" className="btn primary hero-btn">
            Browse Recipes →
          </Link>
        </div>
        <div className="hero-visual">
          <div className="hero-emoji">👨‍🍳</div>
        </div>
      </div>

      <div className="home-stats">
        <h2>Your Collection</h2>

        {isLoading ? (
          <div className="loading">
            <div className="spinner" aria-hidden></div>
            <div className="loading-text">Loading stats…</div>
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📖</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Recipes</div>
            </div>

            <div className="stat-card favorite">
              <div className="stat-icon">❤️</div>
              {/* Задача 11: from FavoritesContext */}
              <div className="stat-value">{favoritesCount}</div>
              <div className="stat-label">Favorites</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-value">{stats.averageRating}</div>
              <div className="stat-label">Avg. Rating</div>
            </div>
          </div>
        )}
      </div>

      <div className="home-categories">
        <h2>By Category</h2>

        {!isLoading && (
          <div className="category-grid">
            <div className="category-card breakfast">
              <span className="category-icon">🥞</span>
              <span className="category-name">Breakfast</span>
              <span className="category-count">{stats.byCategory.breakfast}</span>
            </div>

            <div className="category-card lunch">
              <span className="category-icon">🥗</span>
              <span className="category-name">Lunch</span>
              <span className="category-count">{stats.byCategory.lunch}</span>
            </div>

            <div className="category-card dinner">
              <span className="category-icon">🍝</span>
              <span className="category-name">Dinner</span>
              <span className="category-count">{stats.byCategory.dinner}</span>
            </div>
          </div>
        )}
      </div>

      <div className="home-device">
        <h3>Device Info</h3>
        <WindowSize />
      </div>
    </div>
  )
}
