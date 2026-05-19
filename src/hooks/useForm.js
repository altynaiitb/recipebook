import { useState, useCallback, useRef } from 'react'

// ============================================
// LAB 8: Enhanced useForm hook
// Adds: validationRules, touched, errors, touch(), validateAll()
// Backward-compatible: works without validationRules
// ============================================

/**
 * @param {object} initialValues - initial form field values
 * @param {object} [validationRules] - { fieldName: (value, allValues) => errorString | null }
 */
export function useForm(initialValues, validationRules = {}) {
  const initialRef = useRef(initialValues)
  const rulesRef   = useRef(validationRules)

  const [values,  setValuesState] = useState(initialValues)
  const [touched, setTouched]     = useState({})
  const [errors,  setErrors]      = useState({})

  // ── Run a single field's rule ──────────────────────────────────────────
  const runRule = useCallback((field, value, allValues) => {
    const rule = rulesRef.current[field]
    if (!rule) return null
    return rule(value, allValues) || null
  }, [])

  // ── handleChange: update value + immediately validate that field ────────
  const handleChange = useCallback((field, value) => {
    setValuesState(prev => {
      const next = { ...prev, [field]: value }
      // Real-time validation for touched fields (or always, so errors update)
      const err = runRule(field, value, next)
      setErrors(prevErr => {
        const nextErr = { ...prevErr }
        if (err) nextErr[field] = err
        else delete nextErr[field]
        return nextErr
      })
      return next
    })
  }, [runRule])

  // ── touch: mark a field as interacted + run its validation ─────────────
  const touch = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setValuesState(prev => {
      const err = runRule(field, prev[field], prev)
      setErrors(prevErr => {
        const nextErr = { ...prevErr }
        if (err) nextErr[field] = err
        else delete nextErr[field]
        return nextErr
      })
      return prev
    })
  }, [runRule])

  // ── validateAll: touch all fields and return isValid ──────────────────
  const validateAll = useCallback(() => {
    let allTouched = {}
    let allErrors  = {}

    setValuesState(prev => {
      Object.keys(rulesRef.current).forEach(field => {
        allTouched[field] = true
        const err = runRule(field, prev[field], prev)
        if (err) allErrors[field] = err
      })
      setTouched(t => ({ ...t, ...allTouched }))
      setErrors(allErrors)
      return prev
    })

    // Return whether currently no errors exist after validation
    return Object.keys(allErrors).length === 0
  }, [runRule])

  // ── reset: back to initialValues ───────────────────────────────────────
  const reset = useCallback(() => {
    setValuesState(initialRef.current)
    setTouched({})
    setErrors({})
  }, [])

  // ── setValues: replace entire form state (e.g. when editing) ──────────
  const setValues = useCallback((newValues) => {
    setValuesState(newValues)
    setTouched({})
    setErrors({})
  }, [])

  return { values, errors, touched, handleChange, touch, validateAll, reset, setValues }
}
