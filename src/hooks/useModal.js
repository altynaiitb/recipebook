// ============================================
// LAB 6 — Задача 4: Custom Hook useModal
// Управляет открытием и закрытием модальных окон.
// Хранит булево состояние и опциональные данные для модалки.
// Используется для:
//   - просмотра деталей рецепта
//   - редактирования рецепта
//   - подтверждения удаления
// ============================================
import { useState, useCallback } from 'react'

/**
 * @param {boolean} [initial=false] — начальное состояние (открыто/закрыто)
 * @returns {{
 *   isOpen:  boolean,
 *   data:    any,
 *   open:    (data?: any) => void,
 *   close:   () => void,
 *   toggle:  () => void
 * }}
 */
export function useModal(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)
  // data хранит объект, переданный при открытии (напр. рецепт для просмотра)
  const [data, setData] = useState(null)

  // Открыть модалку, опционально передав данные
  const open = useCallback((modalData = null) => {
    setData(modalData)
    setIsOpen(true)
  }, [])

  // Закрыть модалку и очистить данные
  const close = useCallback(() => {
    setIsOpen(false)
    setData(null)
  }, [])

  // Переключить состояние (полезно для toggle-кнопок)
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return { isOpen, data, open, close, toggle }
}
