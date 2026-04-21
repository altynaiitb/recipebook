import React, { useEffect, useCallback } from 'react'
import { useRecipes } from '../context/RecipeContext'

// ============================================
// LAB 8: Global Notification Toast Component
// Reads notifications from RecipeContext global store.
// Renders a fixed-position stack of toasts with
// animated slide-in and auto-dismiss behaviour.
// ============================================

export default function NotificationToast() {
  const { notifications, dismissNotification } = useRecipes()

  // Dismiss on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && notifications.length > 0) {
        dismissNotification(notifications[notifications.length - 1].id)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [notifications, dismissNotification])

  if (notifications.length === 0) return null

  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`toast toast-${notif.type}`}
          role="alert"
          onClick={() => dismissNotification(notif.id)}
          title="Click to dismiss"
        >
          <span className="toast-message">{notif.message}</span>
          <button
            className="toast-close"
            onClick={(e) => { e.stopPropagation(); dismissNotification(notif.id) }}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
