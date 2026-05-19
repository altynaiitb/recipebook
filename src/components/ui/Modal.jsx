import React, { Suspense, lazy } from 'react'

const LazyModalContent = lazy(() => import('./ModalContent'))

export default function Modal({ recipe, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        <Suspense fallback={
          <div className="loading" style={{ padding: '2rem' }}>
            <div className="spinner" aria-hidden></div>
            <div className="loading-text">Loading details…</div>
          </div>
        }>
          <LazyModalContent recipe={recipe} />
        </Suspense>
      </div>
    </div>
  )
}
