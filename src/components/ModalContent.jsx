import React from 'react'

// ============================================
// LAB 7 Task 5: Lazy-loaded Modal content
// This component is dynamically imported by Modal.jsx
// using React.lazy + Suspense.
// ============================================

export default function ModalContent({ recipe }) {
  const parts = recipe.ingredients ? recipe.ingredients.split(',').map(s => s.trim()) : []

  return (
    <div className="modal-grid">
      <div className="modal-media">
        <div className="media-placeholder">🍽️</div>
      </div>
      <div className="modal-content">
        <h2>{recipe.title}</h2>
        <div className="meta">{recipe.category} • Rating: {recipe.rating}</div>
        <h4>Instructions</h4>
        <p className="full-description">{recipe.description}</p>
        <h4>Ingredients</h4>
        <ul>
          {parts.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
    </div>
  )
}
