import React, { useRef, useLayoutEffect, useEffect, useCallback, useState } from 'react'
import { useRecipes, CATEGORIES, TAGS } from '../context/RecipeContext'

// ============================================
// LAB 7 Task 4: Hybrid Forms
// Controlled: title, category (via useState)
// Uncontrolled: ingredients, description (via useRef)
// Tags, rating, timerMinutes remain controlled.
// ============================================

const EMPTY_CONTROLLED = {
  title: '',
  category: CATEGORIES[0],
  tags: [],
  rating: 4,
  timerMinutes: 5
}

export default React.memo(function RecipeForm() {
  const { addRecipe, updateRecipe, editingRecipe, setEditingRecipe } = useRecipes()

  const isEditing = Boolean(editingRecipe)

  // ── Controlled state (title, category, tags, rating, timer) ──
  const [controlled, setControlled] = useState(EMPTY_CONTROLLED)

  // ── Uncontrolled refs (ingredients, description / instructions) ──
  const ingredientsRef = useRef(null)
  const descriptionRef = useRef(null)

  const [touched, setTouched]   = useState({})
  const [errors, setErrors]     = useState({})
  const [success, setSuccess]   = useState(false)
  const [isActive, setIsActive] = useState(false)
  const successTimer = useRef(null)

  // ── Sync when entering edit mode ──
  useEffect(() => {
    if (editingRecipe) {
      setControlled({
        title:        editingRecipe.title        || '',
        category:     editingRecipe.category     || CATEGORIES[0],
        tags:         editingRecipe.tags         || [],
        rating:       editingRecipe.rating       ?? 4,
        timerMinutes: editingRecipe.timerMinutes ?? 5
      })
      // Sync uncontrolled refs
      if (ingredientsRef.current) ingredientsRef.current.value = editingRecipe.ingredients || ''
      if (descriptionRef.current) descriptionRef.current.value = editingRecipe.description || ''
    } else {
      setControlled(EMPTY_CONTROLLED)
      if (ingredientsRef.current) ingredientsRef.current.value = ''
      if (descriptionRef.current) descriptionRef.current.value = ''
    }
    setTouched({})
    setErrors({})
    setSuccess(false)
  }, [editingRecipe])

  // ── Auto-resize description textarea ──
  useLayoutEffect(() => {
    const el = descriptionRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  })

  // ── Validation helper ──
  const validate = useCallback((opts = {}) => {
    const title = opts.title ?? controlled.title
    const ingredients = opts.ingredients ?? (ingredientsRef.current?.value || '')
    const description = opts.description ?? (descriptionRef.current?.value || '')
    const timerMinutes = opts.timerMinutes ?? controlled.timerMinutes

    const errs = {}
    if (!title.trim()) errs.title = 'Title is required.'
    else if (title.trim().length < 3) errs.title = 'Title must be at least 3 characters.'
    if (!ingredients.trim()) errs.ingredients = 'Ingredients are required.'
    if (!description.trim()) errs.description = 'Description is required.'
    if (Number(timerMinutes) < 1) errs.timerMinutes = 'Timer must be at least 1 minute.'
    return errs
  }, [controlled.title, controlled.timerMinutes])

  // ── Helpers ──
  const touch = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const handleControlledChange = useCallback((field, value) => {
    setControlled(prev => ({ ...prev, [field]: value }))
    // Validate after state update
    setTimeout(() => {
      setErrors(prev => {
        const errs = { ...prev }
        if (field === 'title') {
          if (!value.trim()) errs.title = 'Title is required.'
          else if (value.trim().length < 3) errs.title = 'Title must be at least 3 characters.'
          else delete errs.title
        }
        return errs
      })
    }, 0)
  }, [])

  const handleBlurUncontrolled = useCallback((field) => {
    touch(field)
    const val = field === 'ingredients'
      ? ingredientsRef.current?.value || ''
      : descriptionRef.current?.value || ''
    setErrors(prev => {
      const next = { ...prev }
      if (!val.trim()) next[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
      else delete next[field]
      return next
    })
  }, [touch])

  const handleTagToggle = useCallback((tag) => {
    setControlled(prev => {
      const current = prev.tags || []
      const newTags = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag]
      return { ...prev, tags: newTags }
    })
  }, [])

  // ── Compute isValid for button state ──
  const currentErrors = validate()
  const isValid = Object.keys(currentErrors).length === 0

  // ── Submit ──
  function submit(e) {
    e.preventDefault()

    const ingredients = ingredientsRef.current?.value || ''
    const description = descriptionRef.current?.value || ''

    // Touch all fields
    setTouched({ title: true, ingredients: true, description: true, timerMinutes: true })

    const errs = validate({ ingredients, description })
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const formData = {
      ...controlled,
      ingredients,
      description
    }

    if (isEditing) {
      updateRecipe({ ...editingRecipe, ...formData })
    } else {
      addRecipe({ ...formData })
    }

    // Reset
    setControlled(EMPTY_CONTROLLED)
    if (ingredientsRef.current) ingredientsRef.current.value = ''
    if (descriptionRef.current) descriptionRef.current.value = ''
    setTouched({})
    setErrors({})
    clearTimeout(successTimer.current)
    setSuccess(true)
    successTimer.current = setTimeout(() => setSuccess(false), 2500)
  }

  function handleCancel() {
    setEditingRecipe(null)
    setControlled(EMPTY_CONTROLLED)
    if (ingredientsRef.current) ingredientsRef.current.value = ''
    if (descriptionRef.current) descriptionRef.current.value = ''
    setTouched({})
    setErrors({})
  }

  return (
    <form
      className={`recipe-form ${isActive ? 'active' : ''} ${isEditing ? 'editing' : ''}`}
      onSubmit={submit}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
    >
      <h2>{isEditing ? `✏️ Edit: ${editingRecipe.title}` : 'Add Recipe'}</h2>

      {success && (
        <div className="success" role="status">
          {isEditing ? 'Recipe updated!' : 'Recipe added!'}
        </div>
      )}

      {/* ─── Title (Controlled) ─── */}
      <div className="form-row">
        <div className="field-wrap">
          <input
            data-testid="input-title"
            className={`field title ${touched.title && currentErrors.title ? 'field-error' : ''}`}
            placeholder="Title (min 3 chars)"
            value={controlled.title}
            onChange={e => {
              handleControlledChange('title', e.target.value)
              touch('title')
            }}
            onBlur={() => touch('title')}
          />
          {touched.title && currentErrors.title && (
            <span className="field-error-msg" role="alert">{currentErrors.title}</span>
          )}
        </div>

        {/* ─── Category (Controlled) ─── */}
        <select
          data-testid="select-category"
          className="field category"
          value={controlled.category}
          onChange={e => handleControlledChange('category', e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ─── Tags (Controlled) ─── */}
      <div className="form-block">
        <label className="block-label">Tags</label>
        <div className="tags-group">
          {TAGS.map(tag => (
            <label
              key={tag}
              className={`tag-checkbox ${controlled.tags.includes(tag) ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={controlled.tags.includes(tag)}
                onChange={() => handleTagToggle(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      {/* ─── Ingredients (Uncontrolled via useRef) ─── */}
      <div className="form-block">
        <label className="block-label">Ingredients</label>
        <textarea
          ref={ingredientsRef}
          data-testid="input-ingredients"
          className={`ingredients ${touched.ingredients && errors.ingredients ? 'field-error' : ''}`}
          placeholder="Ingredients (comma separated)"
          defaultValue=""
          onBlur={() => handleBlurUncontrolled('ingredients')}
        />
        {touched.ingredients && errors.ingredients && (
          <span className="field-error-msg" role="alert">{errors.ingredients}</span>
        )}
      </div>

      {/* ─── Description / Instructions (Uncontrolled via useRef) ─── */}
      <div className="form-block">
        <label className="block-label">Instructions / Description</label>
        <textarea
          ref={descriptionRef}
          data-testid="input-description"
          className={`description ${touched.description && errors.description ? 'field-error' : ''}`}
          placeholder="Describe the preparation steps..."
          defaultValue=""
          onBlur={() => handleBlurUncontrolled('description')}
        />
        {touched.description && errors.description && (
          <span className="field-error-msg" role="alert">{errors.description}</span>
        )}
      </div>

      {/* ─── Cook Time (Controlled) ─── */}
      <div className="form-block">
        <label className="block-label">Cook Time (minutes)</label>
        <input
          data-testid="input-timer"
          type="number"
          className={`field ${touched.timerMinutes && currentErrors.timerMinutes ? 'field-error' : ''}`}
          min="1"
          max="600"
          value={controlled.timerMinutes}
          onChange={e => {
            handleControlledChange('timerMinutes', Number(e.target.value))
            touch('timerMinutes')
          }}
          onBlur={() => touch('timerMinutes')}
        />
        {touched.timerMinutes && currentErrors.timerMinutes && (
          <span className="field-error-msg" role="alert">{currentErrors.timerMinutes}</span>
        )}
      </div>

      {/* ─── Rating (Controlled) ─── */}
      <div className="form-row range-row">
        <div className="range-wrap">
          <label className="block-label">Rating</label>
          <input
            className="range"
            type="range"
            min="1"
            max="5"
            value={controlled.rating}
            onChange={e => handleControlledChange('rating', Number(e.target.value))}
          />
        </div>
        <div className="range-value">{controlled.rating}</div>
      </div>

      {/* ─── Actions ─── */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {isEditing && (
          <button type="button" className="btn" onClick={handleCancel}>
            Cancel
          </button>
        )}
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
