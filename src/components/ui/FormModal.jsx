import React, { useEffect, useCallback } from 'react'

export default function FormModal({ isOpen, onClose, title, children }) {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('keydown', handleKey)
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKey])

  if (!isOpen) return null

  return (
    <div
      className="form-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Recipe Form'}
    >
      <div
        className="form-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="form-modal-header">
          <h2 className="form-modal-title">{title || 'Recipe'}</h2>
          <button
            className="form-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="form-modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}
