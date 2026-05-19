import React, { useRef, useLayoutEffect, useEffect, useCallback } from 'react'
import { useRecipes, CATEGORIES, TAGS } from '../context/RecipeContext'
import { useForm } from '../hooks/useForm'

const INITIAL_VALUES = {
  title:        '',
  category:     CATEGORIES[0],
  tags:         [],
  rating:       4,
  timerMinutes: 5
}

const VALIDATION_RULES = {
  title: (v) => {
    if (!v.trim()) return 'Title is required.'
    if (v.trim().length < 3) return 'Title must be at least 3 characters.'
    return null
  },
  timerMinutes: (v) => {
    if (Number(v) < 1) return 'Timer must be at least 1 minute.'
    return null
  }
}

export default React.memo(function RecipeForm({ onClose }) {
  const { addRecipe, updateRecipe, editingRecipe, setEditingRecipe } = useRecipes()

  const isEditing = Boolean(editingRecipe)

  // ── useForm for controlled fields ─────────────────────────────────────
  const {
    values,
    errors,
    touched,
    handleChange,
    touch,
    validateAll,
    reset,
    setValues
  } = useForm(INITIAL_VALUES, VALIDATION_RULES)

  // ── useRef for large text areas (Hybrid pattern) ──────────────────────
  const ingredientsRef = useRef(null)
  const descriptionRef = useRef(null)

  // ── Uncontrolled field errors (managed locally) ───────────────────────
  const [uncontrolledErrors, setUncontrolledErrors] = React.useState({})
  const [uncontrolledTouched, setUncontrolledTouched] = React.useState({})

  // ── Sync when entering / leaving edit mode ────────────────────────────
  useEffect(() => {
    if (editingRecipe) {
      setValues({
        title:        editingRecipe.title        || '',
        category:     editingRecipe.category     || CATEGORIES[0],
        tags:         editingRecipe.tags         || [],
        rating:       editingRecipe.rating       ?? 4,
        timerMinutes: editingRecipe.timerMinutes ?? 5
      })
      if (ingredientsRef.current) ingredientsRef.current.value = editingRecipe.ingredients || ''
      if (descriptionRef.current) descriptionRef.current.value = editingRecipe.description || ''
    } else {
      reset()
      if (ingredientsRef.current) ingredientsRef.current.value = ''
      if (descriptionRef.current) descriptionRef.current.value = ''
    }
    setUncontrolledErrors({})
    setUncontrolledTouched({})
  }, [editingRecipe, setValues, reset])

  // ── Auto-resize description textarea ─────────────────────────────────
  useLayoutEffect(() => {
    const el = descriptionRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  })

  // ── Uncontrolled field validation ─────────────────────────────────────
  const validateUncontrolled = useCallback((field) => {
    const val = field === 'ingredients'
      ? ingredientsRef.current?.value || ''
      : descriptionRef.current?.value || ''
    const err = !val.trim()
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
      : null
    setUncontrolledErrors(prev => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
    return err
  }, [])

  const handleBlurUncontrolled = useCallback((field) => {
    setUncontrolledTouched(prev => ({ ...prev, [field]: true }))
    validateUncontrolled(field)
  }, [validateUncontrolled])

  // ── Tag toggle ────────────────────────────────────────────────────────
  const handleTagToggle = useCallback((tag) => {
    const current = values.tags || []
    const newTags = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag]
    handleChange('tags', newTags)
  }, [values.tags, handleChange])

  // ── Compute overall validity ──────────────────────────────────────────
  const ingVal  = ingredientsRef.current?.value || ''
  const descVal = descriptionRef.current?.value || ''
  const hasControlledErrors   = Object.keys(errors).length > 0
  const hasUncontrolledErrors = !ingVal.trim() || !descVal.trim()
  const isValid = !hasControlledErrors && !hasUncontrolledErrors

  // ── Submit ────────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault()

    const controlledValid = validateAll()
    const ingErr  = validateUncontrolled('ingredients')
    const descErr = validateUncontrolled('description')
    setUncontrolledTouched({ ingredients: true, description: true })

    if (!controlledValid || ingErr || descErr) return

    const formData = {
      ...values,
      ingredients: ingredientsRef.current?.value || '',
      description: descriptionRef.current?.value || ''
    }

    if (isEditing) {
      updateRecipe({ ...editingRecipe, ...formData })
    } else {
      addRecipe(formData)
    }

    // Reset form
    reset()
    if (ingredientsRef.current) ingredientsRef.current.value = ''
    if (descriptionRef.current) descriptionRef.current.value = ''
    setUncontrolledErrors({})
    setUncontrolledTouched({})

    if (onClose) onClose()
  }

  function handleCancel() {
    setEditingRecipe(null)
    reset()
    if (ingredientsRef.current) ingredientsRef.current.value = ''
    if (descriptionRef.current) descriptionRef.current.value = ''
    setUncontrolledErrors({})
    setUncontrolledTouched({})
    if (onClose) onClose()
  }

  return (
    <form
      className={`recipe-form ${isEditing ? 'editing' : ''}`}
      onSubmit={handleSubmit}
      noValidate
    >
      {/* ─── Title (Controlled via useForm) ─── */}
      <div className="form-row">
        <div className="field-wrap">
          <input
            data-testid="input-title"
            className={`field title ${touched.title && errors.title ? 'field-error' : ''}`}
            placeholder="Title (min 3 chars)"
            value={values.title}
            onChange={e => {
              handleChange('title', e.target.value)
              touch('title')
            }}
            onBlur={() => touch('title')}
          />
          {touched.title && errors.title && (
            <span className="field-error-msg" role="alert">{errors.title}</span>
          )}
        </div>

        {/* ─── Category (Controlled via useForm) ─── */}
        <select
          data-testid="select-category"
          className="field category"
          value={values.category}
          onChange={e => handleChange('category', e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ─── Tags (Controlled via useForm) ─── */}
      <div className="form-block">
        <label className="block-label">Tags</label>
        <div className="tags-group">
          {TAGS.map(tag => (
            <label
              key={tag}
              className={`tag-checkbox ${(values.tags || []).includes(tag) ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={(values.tags || []).includes(tag)}
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
          className={`ingredients ${uncontrolledTouched.ingredients && uncontrolledErrors.ingredients ? 'field-error' : ''}`}
          placeholder="Ingredients (comma separated)"
          defaultValue=""
          onBlur={() => handleBlurUncontrolled('ingredients')}
        />
        {uncontrolledTouched.ingredients && uncontrolledErrors.ingredients && (
          <span className="field-error-msg" role="alert">{uncontrolledErrors.ingredients}</span>
        )}
      </div>

      {/* ─── Description / Instructions (Uncontrolled via useRef) ─── */}
      <div className="form-block">
        <label className="block-label">Instructions / Description</label>
        <textarea
          ref={descriptionRef}
          data-testid="input-description"
          className={`description ${uncontrolledTouched.description && uncontrolledErrors.description ? 'field-error' : ''}`}
          placeholder="Describe the preparation steps..."
          defaultValue=""
          onBlur={() => handleBlurUncontrolled('description')}
        />
        {uncontrolledTouched.description && uncontrolledErrors.description && (
          <span className="field-error-msg" role="alert">{uncontrolledErrors.description}</span>
        )}
      </div>

      {/* ─── Cook Time (Controlled via useForm) ─── */}
      <div className="form-block">
        <label className="block-label">Cook Time (minutes)</label>
        <input
          data-testid="input-timer"
          type="number"
          className={`field ${touched.timerMinutes && errors.timerMinutes ? 'field-error' : ''}`}
          min="1"
          max="600"
          value={values.timerMinutes}
          onChange={e => {
            handleChange('timerMinutes', Number(e.target.value))
            touch('timerMinutes')
          }}
          onBlur={() => touch('timerMinutes')}
        />
        {touched.timerMinutes && errors.timerMinutes && (
          <span className="field-error-msg" role="alert">{errors.timerMinutes}</span>
        )}
      </div>

      {/* ─── Rating (Controlled via useForm) ─── */}
      <div className="form-row range-row">
        <div className="range-wrap">
          <label className="block-label">Rating</label>
          <input
            className="range"
            type="range"
            min="1"
            max="5"
            value={values.rating}
            onChange={e => handleChange('rating', Number(e.target.value))}
          />
        </div>
        <div className="range-value">{values.rating}</div>
      </div>

      {/* ─── Actions ─── */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" className="btn" onClick={handleCancel}>
          Cancel
        </button>
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
