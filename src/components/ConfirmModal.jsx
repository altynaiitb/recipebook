// ============================================
// LAB 6 — Задача 4 + 8: ConfirmModal
// Модальное окно подтверждения удаления.
// Управляется через хук useModal из RecipesPage.
// ============================================
import React, { useEffect } from 'react'

export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  // Закрывать по Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <h2 id="confirm-title" style={{ marginTop: 0 }}>{title}</h2>
        <p style={{ color: '#374151', margin: '0 0 1.5rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}
