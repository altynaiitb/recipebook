import React from 'react'
import { Link } from 'react-router-dom'

// ============================================
// LAB 4: 404 Not Found Page Component
// Displays error message with navigation back to home
// ============================================

export default function NotFoundPage() {
  return (
    <div className="page not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <div className="not-found-icon">🍽️</div>
        <h1>Page Not Found</h1>
        <p className="not-found-message">
          Oops! The recipe you're looking for seems to have escaped from the kitchen.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn primary">
            ← Back to Home
          </Link>
          <Link to="/recipes" className="btn">
            Browse Recipes
          </Link>
        </div>
      </div>
    </div>
  )
}


