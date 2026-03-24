import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react'
import { useRecipes, CATEGORIES, TAGS } from '../context/RecipeContext'

// ============================================
// LAB 5 REQUIREMENTS SATISFIED IN THIS FILE:
// Задача 1: Управляемые поля (useState для всех полей)
// Задача 1: select для категорий, checkboxes для тегов
// Задача 2: Валидация в реальном времени (title < 3 / timer < 1)
// Задача 2: Кнопка Submit заблокирована при ошибках
// Задача 3: Режим редактирования — предзаполняется из editingRecipe
// ============================================

const EMPTY_FORM = {
  title: '',
  category: CATEGORIES[0],
  ingredients: '',
  description: '',
  tags: [],
  rating: 4,
  timerMinutes: 5
}

function getInitialForm(recipe) {
  if (!recipe) return EMPTY_FORM
  return {
    title: recipe.title || '',
    category: recipe.category || CATEGORIES[0],
    ingredients: recipe.ingredients || '',
    description: recipe.description || '',
    tags: recipe.tags || [],
    rating: recipe.rating ?? 4,
    timerMinutes: recipe.timerMinutes ?? 5
  }
}

// ============================================
// LAB 5: Задача 7 — React.memo
// RecipeForm won't re-render when the favorites
// list changes (because FavoritesContext is separate).
// ============================================
export default React.memo(function RecipeForm() {
  const { addRecipe, updateRecipe, editingRecipe, setEditingRecipe } = useRecipes()

  const isEditing = Boolean(editingRecipe)

  // ============================================
  // Задача 1: All fields are controlled (useState)
  // ============================================
  const [form, setForm] = useState(() => getInitialForm(editingRecipe))
  const [touched, setTouched] = useState({})   // track which fields were touched
  const [success, setSuccess] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const descRef = useRef(null)
  const successTimer = useRef(null)

  // ============================================
  // Задача 3: Pre-fill form when editingRecipe changes
  // ============================================
  useEffect(() => {
    setForm(getInitialForm(editingRecipe))
    setTouched({})
    setSuccess(false)
  }, [editingRecipe])

  // Auto-expand textarea
  useLayoutEffect(() => {
    const el = descRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [form.description])

  // ============================================
  // Задача 2: Real-time validation rules
  // ============================================
  const errors = {}
  if (form.title.trim().length > 0 && form.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.'
  }
  if (!form.title.trim()) {
    errors.title = 'Title is required.'
  }
  if (!form.ingredients.trim()) {
    errors.ingredients = 'Ingredients are required.'
  }
  if (!form.description.trim()) {
    errors.description = 'Description is required.'
  }
  if (form.timerMinutes < 1) {
    errors.timerMinutes = 'Timer must be at least 1 minute.'
  }

  const isValid = Object.keys(errors).length === 0

  // Generic field change handler
  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  // Задача 1: Checkbox toggle for tags
  const handleTagToggle = useCallback((tag) => {
    setForm(prev => {
      const has = prev.tags.includes(tag)
      return {
        ...prev,
        tags: has ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
      }
    })
  }, [])

  function submit(e) {
    e.preventDefault()
    // Mark all fields as touched to show all errors
    setTouched({ title: true, ingredients: true, description: true, timerMinutes: true })
    if (!isValid) return

    if (isEditing) {
      // Задача 3: Update existing recipe
      updateRecipe({ ...editingRecipe, ...form })
    } else {
      addRecipe({ ...form })
    }

    setForm(EMPTY_FORM)
    setTouched({})
    clearTimeout(successTimer.current)
    setSuccess(true)
    successTimer.current = setTimeout(() => setSuccess(false), 2500)
  }

  function handleCancel() {
    setEditingRecipe(null)
    setForm(EMPTY_FORM)
    setTouched({})
  }

  return (
    <form
      className={`recipe-form ${isActive ? 'active' : ''} ${isEditing ? 'editing' : ''}`}
      onSubmit={submit}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      {/* Задача 3: Dynamic heading based on mode */}
      <h2>{isEditing ? `✏️ Edit: ${editingRecipe.title}` : 'Add Recipe'}</h2>

      {success && (
        <div className="success">
          {isEditing ? 'Recipe updated!' : 'Recipe added!'}
        </div>
      )}

      {/* ─── Title ─── */}
      <div className="form-row">
        <div className="field-wrap">
          <input
            className={`field title ${touched.title && errors.title ? 'field-error' : ''}`}
            placeholder="Title (min 3 chars)"
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
          />
          {/* Задача 2: Inline error message */}
          {touched.title && errors.title && (
            <span className="field-error-msg">{errors.title}</span>
          )}
        </div>

        {/* Задача 1: Category select */}
        <select
          className="field category"
          value={form.category}
          onChange={e => handleChange('category', e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ─── Tags (Задача 1: Checkboxes) ─── */}
      <div className="form-block">
        <label className="block-label">Tags</label>
        <div className="tags-group">
          {TAGS.map(tag => (
            <label key={tag} className={`tag-checkbox ${form.tags.includes(tag) ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={form.tags.includes(tag)}
                onChange={() => handleTagToggle(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      {/* ─── Ingredients ─── */}
      <div className="form-block">
        <label className="block-label">Ingredients</label>
        <textarea
          className={`ingredients ${touched.ingredients && errors.ingredients ? 'field-error' : ''}`}
          placeholder="Ingredients (comma separated)"
          value={form.ingredients}
          onChange={e => handleChange('ingredients', e.target.value)}
          onBlur={() => setTouched(prev => ({ ...prev, ingredients: true }))}
        />
        {touched.ingredients && errors.ingredients && (
          <span className="field-error-msg">{errors.ingredients}</span>
        )}
      </div>

      {/* ─── Description ─── */}
      <div className="form-block">
        <label className="block-label">Instructions / Description</label>
        <textarea
          ref={descRef}
          className={`description ${touched.description && errors.description ? 'field-error' : ''}`}
          placeholder="Describe the preparation steps..."
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
        />
        {touched.description && errors.description && (
          <span className="field-error-msg">{errors.description}</span>
        )}
      </div>

      {/* ─── Timer (Задача 2: validated ≥ 1 minute) ─── */}
      <div className="form-block">
        <label className="block-label">Cook Time (minutes)</label>
        <input
          type="number"
          className={`field ${touched.timerMinutes && errors.timerMinutes ? 'field-error' : ''}`}
          min="1"
          max="600"
          value={form.timerMinutes}
          onChange={e => handleChange('timerMinutes', Number(e.target.value))}
          onBlur={() => setTouched(prev => ({ ...prev, timerMinutes: true }))}
        />
        {touched.timerMinutes && errors.timerMinutes && (
          <span className="field-error-msg">{errors.timerMinutes}</span>
        )}
      </div>

      {/* ─── Rating ─── */}
      <div className="form-row range-row">
        <div className="range-wrap">
          <label className="block-label">Rating</label>
          <input
            className="range"
            type="range"
            min="1"
            max="5"
            value={form.rating}
            onChange={e => handleChange('rating', Number(e.target.value))}
          />
        </div>
        <div className="range-value">{form.rating}</div>
      </div>

      {/* ─── Actions ─── */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {isEditing && (
          <button type="button" className="btn" onClick={handleCancel}>
            Cancel
          </button>
        )}
        {/* Задача 2: Submit disabled when validation fails */}
        <button
          type="submit"
          className="btn primary"
          disabled={!isValid}
          title={!isValid ? 'Fix validation errors to continue' : ''}
        >
          {isEditing ? 'Save Changes' : 'Add Recipe'}
        </button>
      </div>
    </form>
  )
})
