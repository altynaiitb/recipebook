import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../context/RecipeContext'
import { useFavorites } from '../context/FavoritesContext'
import { DEMO_MODE } from '../lib/supabase'
import RecipeCard from '../components/RecipeCard'
import Modal from '../components/Modal'
import MFAEnroll from '../components/MFAEnroll'

// ============================================
// LAB 8 SECURITY: ProfilePage — added Security Dashboard
// Shows Last Login, MFA status, screenshot protection status.
// ============================================

export default function ProfilePage() {
  const { recipes, stats, isLoading, isAuthenticated, lastLogin, currentUser } = useRecipes()
  const { favoriteIds, favoritesCount } = useFavorites()

  const [modalRecipe, setModalRecipe] = useState(null)

  const likedRecipes = recipes.filter(r => favoriteIds.has(r.id))

  function openModal(recipe)  { setModalRecipe(recipe) }
  function closeModal()       { setModalRecipe(null)   }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium', timeStyle: 'short'
    }).format(date)
  }

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-emoji">👨‍🍳</span>
        </div>
        <div className="profile-info">
          <h1>{currentUser?.user_metadata?.username || 'My Profile'}</h1>
          <p className="profile-subtitle">
            {currentUser?.email || (DEMO_MODE ? 'demo@recipebook.app' : 'Home Chef & Recipe Collector')}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-text">Recipes</span>
        </div>
        <div className="profile-stat highlight">
          <span className="stat-number">{favoritesCount}</span>
          <span className="stat-text">Favorites</span>
        </div>
        <div className="profile-stat">
          <span className="stat-number">{stats.averageRating}</span>
          <span className="stat-text">Avg Rating</span>
        </div>
      </div>

      {/* ── LAB 8 SECURITY: Security Dashboard ── */}
      <div className="security-dashboard">
        <h2 className="security-dashboard-title">
          🔐 Security Status
        </h2>
        <div className="security-grid">
          <div className="security-card">
            <div className="security-card-icon">🕐</div>
            <div className="security-card-body">
              <span className="security-label">Last Login</span>
              <span className="security-value">{formatDate(lastLogin)}</span>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-icon">
              {isAuthenticated ? '✅' : '⚠️'}
            </div>
            <div className="security-card-body">
              <span className="security-label">MFA Status</span>
              <span className={`security-value ${isAuthenticated ? 'sec-ok' : 'sec-warn'}`}>
                {isAuthenticated ? 'Verified' : 'Not Active'}
              </span>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-icon">🛡️</div>
            <div className="security-card-body">
              <span className="security-label">Screenshot Protection</span>
              <span className="security-value sec-ok">Active</span>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-icon">🟢</div>
            <div className="security-card-body">
              <span className="security-label">Session</span>
              <span className="security-value sec-ok">
                {isAuthenticated ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="security-card">
            <div className="security-card-icon">{DEMO_MODE ? '🧪' : '🔑'}</div>
            <div className="security-card-body">
              <span className="security-label">Auth Mode</span>
              <span className="security-value" style={{ color: DEMO_MODE ? '#d97706' : '#059669' }}>
                {DEMO_MODE ? 'Demo' : 'Supabase JWT'}
              </span>
            </div>
          </div>
        </div>

        {/* 2FA Enrollment — enabled in both demo and production */}
        <MFAEnroll />
      </div>


      {/* ── Favorite Recipes ── */}
      <div className="profile-favorites">
        <h2>❤️ My Favorite Recipes</h2>

        {isLoading ? (
          <div className="loading">
            <div className="spinner" aria-hidden></div>
            <div className="loading-text">Loading favorites…</div>
          </div>
        ) : likedRecipes.length === 0 ? (
          <div className="empty-favorites">
            <div className="empty-icon">💔</div>
            <p>You haven&apos;t added any favorites yet!</p>
            <p className="empty-hint">
              Go to the <Link to="/recipes" className="link">Recipes page</Link> and
              click the ♡ button to add recipes to your favorites.
            </p>
          </div>
        ) : (
          <div className="favorites-grid">
            {likedRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onOpen={openModal}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Achievements ── */}
      <div className="profile-achievements">
        <h2>🏆 Achievements</h2>
        <div className="achievements-grid">
          <div className={`achievement ${stats.total >= 1 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">📝</span>
            <span className="achievement-name">First Recipe</span>
            <span className="achievement-desc">Add your first recipe</span>
          </div>

          <div className={`achievement ${stats.total >= 5 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">📚</span>
            <span className="achievement-name">Recipe Collector</span>
            <span className="achievement-desc">Collect 5 recipes</span>
          </div>

          <div className={`achievement ${favoritesCount >= 3 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">❤️</span>
            <span className="achievement-name">Food Lover</span>
            <span className="achievement-desc">Like 3 recipes</span>
          </div>

          <div className={`achievement ${stats.byCategory.breakfast >= 1 && stats.byCategory.lunch >= 1 && stats.byCategory.dinner >= 1 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">🌈</span>
            <span className="achievement-name">Variety Chef</span>
            <span className="achievement-desc">Have all meal categories</span>
          </div>

          {/* LAB 8 SECURITY: MFA achievement */}
          <div className={`achievement ${isAuthenticated ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">🔐</span>
            <span className="achievement-name">Security Pro</span>
            <span className="achievement-desc">Verified with 2FA</span>
          </div>
        </div>
      </div>

      {modalRecipe && <Modal recipe={modalRecipe} onClose={closeModal} />}
    </div>
  )
}
