import React, { useEffect, useState } from 'react'
import RecipeForm from './components/RecipeForm'
import Filters from './components/Filters'
import RecipeList from './components/RecipeList'
import Modal from './components/Modal'

const LOCAL_KEY = 'recipe_book_recipes_v1'

const mockData = [
  {
    id: 1,
    title: 'Morning Pancakes',
    category: 'Breakfast',
    ingredients: 'Flour, Milk, Eggs, Sugar',
    rating: 4,
    liked: false,
    description: '1. Mix dry and wet ingredients. 2. Pour batter on a hot pan. 3. Flip when bubbles appear.'
  },
  {
    id: 2,
    title: 'Classic Caesar',
    category: 'Lunch',
    ingredients: 'Romaine lettuce, Croutons, Caesar dressing, Parmesan',
    rating: 5,
    liked: true,
    description: '1. Grill the chicken. 2. Toss the romaine lettuce with dressing. 3. Add croutons and parmesan.'
  },
  { id: 3, title: 'Spaghetti', category: 'Dinner', ingredients: 'Pasta, Tomato sauce, Basil', rating: 4, liked: false, description: 'Cook pasta until al dente and mix with a rich tomato basil sauce.' }
]

export default function App() {
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sortBy, setSortBy] = useState('alpha')
  const [modalRecipe, setModalRecipe] = useState(null)
  const [showFavorites, setShowFavorites] = useState(false)

  useEffect(() => {
    // Simulate API load with 1.8 second delay
    setTimeout(() => {
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) {
        try {
          setRecipes(JSON.parse(saved))
        } catch (e) {
          console.warn('Failed to parse saved recipes', e)
          setRecipes(mockData)
        }
      } else {
        // Use mock data if nothing in localStorage
        setRecipes(mockData)
      }
      setIsLoading(false)
    }, 1800)
  }, [])

  useEffect(() => {
    // save to localStorage on change
    if (!isLoading) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(recipes))
    }
  }, [recipes, isLoading])

  function addRecipe(r) {
    setRecipes(prev => [{ ...r, id: Date.now(), liked: false }, ...prev])
  }

  function deleteRecipe(id) {
    // mark as removing to allow CSS fade-out, then remove after animation
    setRecipes(prev => prev.map(r => (r.id === id ? { ...r, removing: true } : r)))
    setTimeout(() => {
      setRecipes(prev => prev.filter(r => r.id !== id))
    }, 320)
  }

  function toggleLike(id) {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, liked: !r.liked } : r))
  }

  function openModal(r) {
    setModalRecipe(r)
  }

  function closeModal() {
    setModalRecipe(null)
  }

  const filtered = recipes
    .filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    .filter(r => category === 'All' ? true : r.category === category)
    .filter(r => showFavorites ? r.liked : true)

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alpha') return a.title.localeCompare(b.title)
    if (sortBy === 'rating') return b.rating - a.rating
    return 0
  })

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Recipe Book</h1>
        <div className="counters">
          <div className="counter">Recipes: {recipes.length}</div>
          <div className="counter favorites-counter">❤️ Favorites: {recipes.filter(r => r.liked).length}</div>
        </div>
      </header>

      <main>
        <section className="left">
          <RecipeForm onAdd={addRecipe} />
          <Filters
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showFavorites={showFavorites}
            setShowFavorites={setShowFavorites}
          />
        </section>

        <section className="right">
          {isLoading ? (
            <div className="loading">
              <div className="spinner" aria-hidden></div>
              <div className="loading-text">Loading recipes…</div>
            </div>
          ) : (
            <RecipeList recipes={sorted} onDelete={deleteRecipe} onLike={toggleLike} onOpen={openModal} showFavorites={showFavorites} />
          )}
        </section>
      </main>

      {modalRecipe && <Modal recipe={modalRecipe} onClose={closeModal} />}
    </div>
  )
}
