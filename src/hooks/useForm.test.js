import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useForm } from './useForm'

const INITIAL = {
  title: '',
  category: 'Breakfast',
  rating: 4
}

describe('useForm', () => {

  it('возвращает начальные значения', () => {
    const { result } = renderHook(() => useForm(INITIAL))
    expect(result.current.values).toEqual(INITIAL)
  })

  it('возвращает функции handleChange, reset, setValues', () => {
    const { result } = renderHook(() => useForm(INITIAL))
    expect(typeof result.current.handleChange).toBe('function')
    expect(typeof result.current.reset).toBe('function')
    expect(typeof result.current.setValues).toBe('function')
  })


  it('handleChange обновляет одно поле', () => {
    const { result } = renderHook(() => useForm(INITIAL))

    act(() => {
      result.current.handleChange('title', 'Pasta')
    })

    expect(result.current.values.title).toBe('Pasta')
    expect(result.current.values.category).toBe('Breakfast')
    expect(result.current.values.rating).toBe(4)
  })

  it('handleChange обновляет несколько полей последовательно', () => {
    const { result } = renderHook(() => useForm(INITIAL))

    act(() => {
      result.current.handleChange('title', 'Soup')
      result.current.handleChange('category', 'Lunch')
      result.current.handleChange('rating', 5)
    })

    expect(result.current.values).toEqual({
      title: 'Soup',
      category: 'Lunch',
      rating: 5
    })
  })

  it('handleChange не мутирует предыдущее состояние', () => {
    const { result } = renderHook(() => useForm(INITIAL))
    const before = result.current.values

    act(() => {
      result.current.handleChange('title', 'Steak')
    })

    expect(before.title).toBe('')
    expect(result.current.values.title).toBe('Steak')
  })


  it('reset возвращает форму к начальным значениям', () => {
    const { result } = renderHook(() => useForm(INITIAL))

    act(() => {
      result.current.handleChange('title', 'Salad')
      result.current.handleChange('rating', 2)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.values).toEqual(INITIAL)
  })

  it('reset не изменяет initialValues переданные при вызове хука', () => {
    const initial = { name: 'Test', count: 0 }
    const { result } = renderHook(() => useForm(initial))

    act(() => {
      result.current.handleChange('name', 'Modified')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.values.name).toBe('Test')
  })

  it('setValues полностью заменяет состояние формы', () => {
    const { result } = renderHook(() => useForm(INITIAL))
    const newValues = { title: 'Burger', category: 'Dinner', rating: 5 }

    act(() => {
      result.current.setValues(newValues)
    })

    expect(result.current.values).toEqual(newValues)
  })

  it('после setValues reset возвращает к INITIAL, а не к setValues', () => {
    const { result } = renderHook(() => useForm(INITIAL))

    act(() => {
      result.current.setValues({ title: 'Tempura', category: 'Dinner', rating: 3 })
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.values).toEqual(INITIAL)
  })

  it('handleChange имеет стабильную ссылку между рендерами', () => {
    const { result, rerender } = renderHook(() => useForm(INITIAL))
    const firstRef = result.current.handleChange
    rerender()
    expect(result.current.handleChange).toBe(firstRef)
  })

  it('reset имеет стабильную ссылку между рендерами', () => {
    const { result, rerender } = renderHook(() => useForm(INITIAL))
    const firstRef = result.current.reset
    rerender()
    expect(result.current.reset).toBe(firstRef)
  })
})
