import React, { useState } from 'react'

export default function RecipeCard({ recipe, onDelete, onLike, onOpen }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`card ${isHovered ? 'hover' : ''} ${recipe.removing ? 'removing' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-header">
        <h3>{recipe.title}</h3>
        <div className="rating">{Array.from({ length: recipe.rating }).map((_, i) => '★')}</div>
      </div>
      <div className="card-body">
        <div className="meta"><span className="tag">{recipe.category}</span></div>
        <p className="ing">{recipe.ingredients}</p>
      </div>
      <div className="card-actions">
        <button className={`btn like ${recipe.liked ? 'liked' : ''}`} onClick={() => onLike(recipe.id)}>{recipe.liked ? '♥' : '♡'}</button>
        <button className="btn" onClick={() => onOpen(recipe)}>View</button>
        <button className="btn danger" onClick={() => onDelete(recipe.id)}>Delete</button>
      </div>
    </div>
  )
}
