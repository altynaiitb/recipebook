import React, { useRef, useLayoutEffect, useEffect, useCallback, useState } from 'react'
import { useRecipes, CATEGORIES, TAGS } from '../context/RecipeContext'
import { useForm } from '../hooks/useForm'

// ============================================
// LAB 6 REQUIREMENTS SATISFIED IN THIS FILE:
// Задача 1 (Lab 6): useForm — кастомный хук управляет состоянием формы
// Задача 9 (Lab 6): Тесты для useForm написаны в __tests__/hooks/useForm.test.js
// Задача 10 (Lab 6): Тесты компонента — __tests__/components/RecipeForm.test.jsx
//
// (Требования Lab 5 сохранены: React.memo, real-time validation, edit mode)
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

function buildFormFromRecipe(recipe) {
  if (!recipe) return EMPTY_FORM
  return {
    title:        recipe.title        || '',
    category:     recipe.category     || CATEGORIES[0],
    ingredients:  recipe.ingredients  || '',
    description:  recipe.description  || '',
    tags:         recipe.tags         || [],
    rating:       recipe.rating       ?? 4,
    timerMinutes: recipe.timerMinutes ?? 5
  }
}

// ============================================
// LAB 5: React.memo — форма не перерендеривается
//         при изменении списка избранного
// ============================================
export default React.memo(function RecipeForm() {
  const { addRecipe, updateRecipe, editingRecipe, setEditingRecipe } = useRecipes()

  const isEditing = Boolean(editingRecipe)

  // ============================================
  // LAB 6 Задача 1: useForm — кастомный хук формы
  // values, handleChange, reset, setValues
  // ============================================
  const { values: form, handleChange, reset, setValues } = useForm(EMPTY_FORM)

  const [touched, setTouched]   = useState({})
  const [success, setSuccess]   = useState(false)
  const [isActive, setIsActive] = useState(false)
  const descRef        = useRef(null)
  const successTimer   = useRef(null)

  // ============================================
  // Задача 3 (Lab 5): Предзаполнение при переходе в режим редактирования
  // ============================================
  useEffect(() => {
    setValues(buildFormFromRecipe(editingRecipe))
    setTouched({})
    setSuccess(false)
  }, [editingRecipe, setValues])

  // Авто-расширение textarea описания (Lab 5 — useLayoutEffect)
  useLayoutEffect(() => {
    const el = descRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [form.description])

  // ── Валидация в реальном времени (Lab 5 Задача 2) ──────────────────────
  const errors = {}
  if (!form.title.trim())                               errors.title = 'Title is required.'
  else if (form.title.trim().length < 3)                errors.title = 'Title must be at least 3 characters.'
  if (!form.ingredients.trim())                         errors.ingredients = 'Ingredients are required.'
  if (!form.description.trim())                         errors.description = 'Description is required.'
  if (Number(form.timerMinutes) < 1)                    errors.timerMinutes = 'Timer must be at least 1 minute.'

  const isValid = Object.keys(errors).length === 0

  const touch = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  // handleChange уже обновляет values через useForm
  // Дополнительно помечаем поле как «тронутое» для отображения ошибок
  const handleFieldChange = useCallback((field, value) => {
    handleChange(field, value)
    touch(field)
  }, [handleChange, touch])

  // Чекбоксы тегов
  const handleTagToggle = useCallback((tag) => {
    const current = form.tags || []
    const newTags = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag]
    handleChange('tags', newTags)
  }, [form.tags, handleChange])

  function submit(e) {
    e.preventDefault()
    setTouched({ title: true, ingredients: true, description: true, timerMinutes: true })
    if (!isValid) return

    if (isEditing) {
      updateRecipe({ ...editingRecipe, ...form })
    } else {
      addRecipe({ ...form })
    }

    reset()
    setTouched({})
    clearTimeout(successTimer.current)
    setSuccess(true)
    successTimer.current = setTimeout(() => setSuccess(false), 2500)
  }

  function handleCancel() {
    setEditingRecipe(null)
    reset()
    setTouched({})
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

      {/* ─── Title ─── */}
      <div className="form-row">
        <div className="field-wrap">
          <input
            data-testid="input-title"
            className={`field title ${touched.title && errors.title ? 'field-error' : ''}`}
            placeholder="Title (min 3 chars)"
            value={form.title}
            onChange={e => handleFieldChange('title', e.target.value)}
            onBlur={() => touch('title')}
          />
          {touched.title && errors.title && (
            <span className="field-error-msg" role="alert">{errors.title}</span>
          )}
        </div>

        <select
          data-testid="select-category"
          className="field category"
          value={form.category}
          onChange={e => handleChange('category', e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ─── Tags ─── */}
      <div className="form-block">
        <label className="block-label">Tags</label>
        <div className="tags-group">
          {TAGS.map(tag => (
            <label
              key={tag}
              className={`tag-checkbox ${form.tags.includes(tag) ? 'checked' : ''}`}
            >
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
          data-testid="input-ingredients"
          className={`ingredients ${touched.ingredients && errors.ingredients ? 'field-error' : ''}`}
          placeholder="Ingredients (comma separated)"
          value={form.ingredients}
          onChange={e => handleFieldChange('ingredients', e.target.value)}
          onBlur={() => touch('ingredients')}
        />
        {touched.ingredients && errors.ingredients && (
          <span className="field-error-msg" role="alert">{errors.ingredients}</span>
        )}
      </div>

      {/* ─── Description ─── */}
      <div className="form-block">
        <label className="block-label">Instructions / Description</label>
        <textarea
          ref={descRef}
          data-testid="input-description"
          className={`description ${touched.description && errors.description ? 'field-error' : ''}`}
          placeholder="Describe the preparation steps..."
          value={form.description}
          onChange={e => handleFieldChange('description', e.target.value)}
          onBlur={() => touch('description')}
        />
        {touched.description && errors.description && (
          <span className="field-error-msg" role="alert">{errors.description}</span>
        )}
      </div>

      {/* ─── Cook Time ─── */}
      <div className="form-block">
        <label className="block-label">Cook Time (minutes)</label>
        <input
          data-testid="input-timer"
          type="number"
          className={`field ${touched.timerMinutes && errors.timerMinutes ? 'field-error' : ''}`}
          min="1"
          max="600"
          value={form.timerMinutes}
          onChange={e => handleFieldChange('timerMinutes', Number(e.target.value))}
          onBlur={() => touch('timerMinutes')}
        />
        {touched.timerMinutes && errors.timerMinutes && (
          <span className="field-error-msg" role="alert">{errors.timerMinutes}</span>
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
