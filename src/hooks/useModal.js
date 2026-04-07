import { useState, useCallback } from 'react'

export function useModal(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)

  const [data, setData] = useState(null)

  const open = useCallback((modalData = null) => {
    setData(modalData)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setData(null)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return { isOpen, data, open, close, toggle }
}
