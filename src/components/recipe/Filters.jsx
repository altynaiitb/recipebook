import React from 'react'

const categories = ['All', 'Breakfast', 'Lunch', 'Dinner']

export default function Filters({ search, setSearch, category, setCategory, sortBy, setSortBy, showFavorites, setShowFavorites }) {
  return (
    <div className="filters">
      <h2>Filters</h2>
      <input placeholder="Search by title..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="row">
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="alpha">Sort: A → Z</option>
          <option value="rating">Sort: Rating</option>
        </select>
      </div>
      <button 
        className={`btn favorites-btn ${showFavorites ? 'active' : ''}`}
        onClick={() => setShowFavorites(!showFavorites)}
      >
        ❤️ {showFavorites ? 'All Recipes' : 'Favorites Only'}
      </button>
    </div>
  )
}
