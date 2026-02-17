import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../context/RecipeContext'
import RecipeCard from '../components/RecipeCard'
import Modal from '../components/Modal'

// ============================================
// LAB 4: Profile Page Component
// Shows user info and liked recipes list
// Uses Context for recipe data
// ============================================

export default function ProfilePage() {
  const { likedRecipes, stats, isLoading } = useRecipes()
  const [modalRecipe, setModalRecipe] = useState(null)

  function openModal(recipe) {
    setModalRecipe(recipe)
  }

  function closeModal() {
    setModalRecipe(null)
  }

  return (
    <div className="page profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-emoji">👨‍🍳</span>
        </div>
        <div className="profile-info">
          <h1>My Profile</h1>
          <p className="profile-subtitle">Home Chef & Recipe Collector</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-text">Recipes</span>
        </div>
        <div className="profile-stat highlight">
          <span className="stat-number">{stats.favorites}</span>
          <span className="stat-text">Favorites</span>
        </div>
        <div className="profile-stat">
          <span className="stat-number">{stats.averageRating}</span>
          <span className="stat-text">Avg Rating</span>
        </div>
      </div>

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
            <p>You haven't added any favorites yet!</p>
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

          <div className={`achievement ${stats.favorites >= 3 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">❤️</span>
            <span className="achievement-name">Food Lover</span>
            <span className="achievement-desc">Like 3 recipes</span>
          </div>

          <div className={`achievement ${stats.byCategory.breakfast >= 1 && stats.byCategory.lunch >= 1 && stats.byCategory.dinner >= 1 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">🌈</span>
            <span className="achievement-name">Variety Chef</span>
            <span className="achievement-desc">Have all meal categories</span>
          </div>
        </div>
      </div>

      {modalRecipe && <Modal recipe={modalRecipe} onClose={closeModal} />}
    </div>
  )
}
