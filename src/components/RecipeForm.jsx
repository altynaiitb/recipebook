import React, { useState, useRef, useLayoutEffect } from 'react'

const categories = ['Breakfast', 'Lunch', 'Dinner']

export default function RecipeForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [ingredients, setIngredients] = useState('')
  const [description, setDescription] = useState('')
  const [rating, setRating] = useState(4)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(false)
  const descRef = useRef(null)

  function submit(e) {
    e.preventDefault()
    if (!title.trim() || !ingredients.trim() || !description.trim()) {
      setError('Please provide a title, ingredients and description.')
      return
    }
    onAdd({ title: title.trim(), category, ingredients: ingredients.trim(), rating, description: description.trim() })
    setTitle('')
    setIngredients('')
    setDescription('')
    setRating(4)
    setError('')
  }

  useLayoutEffect(() => {
    const el = descRef.current
    if (!el) return
    el.style.height = 'auto'
    // add a couple pixels to avoid tiny clip
    el.style.height = `${el.scrollHeight}px`
  }, [description])

  return (
    <form
      className={`recipe-form ${isActive ? 'active' : ''}`}
      onSubmit={submit}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      <h2>Add Recipe</h2>
      {error && <div className="error">{error}</div>}

      <div className="form-row">
        <input className="field title" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <select className="field category" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-block">
        <label className="block-label">Ingredients</label>
        <textarea className="ingredients" placeholder="Ingredients (comma separated)" value={ingredients} onChange={e => setIngredients(e.target.value)} />
      </div>

      <div className="form-block">
        <label className="block-label">Instructions / Description</label>
        <textarea ref={descRef} className="description" placeholder="Describe the preparation steps..." value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div className="form-row range-row">
        <div className="range-wrap">
          <label className="block-label">Rating</label>
          <input className="range" type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} />
        </div>
        <div className="range-value">{rating}</div>
      </div>

      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <button type="submit" className="btn primary">Add</button>
      </div>
    </form>
  )
}
