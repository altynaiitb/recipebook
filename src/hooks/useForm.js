// ============================================
// LAB 6 — Задача 1: Custom Hook useForm
// Управляет состоянием формы с несколькими полями.
// Возвращает:
//   values       — текущее состояние формы
//   handleChange — функция изменения отдельного поля
//   reset        — сброс формы к начальному значению
//   setValues    — полная замена состояния (режим редактирования)
// ============================================
import { useState, useCallback, useRef } from 'react'

/**
 * @param {Object} initialValues — начальные значения полей формы
 * @returns {{ values, handleChange, reset, setValues }}
 */
export function useForm(initialValues) {
  // Храним ссылку на начальные значения, чтобы reset всегда
  // возвращал именно то, что было передано при первом вызове
  const initialRef = useRef(initialValues)

  const [values, setValuesState] = useState(initialValues)

  // Изменить одно поле формы
  const handleChange = useCallback((field, value) => {
    setValuesState(prev => ({ ...prev, [field]: value }))
  }, [])

  // Сбросить форму к начальным значениям
  const reset = useCallback(() => {
    setValuesState(initialRef.current)
  }, [])

  // Полностью заменить значения (напр. при переходе в режим редактирования)
  const setValues = useCallback((newValues) => {
    setValuesState(newValues)
  }, [])

  return { values, handleChange, reset, setValues }
}
