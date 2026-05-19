import React, { useEffect, useCallback } from 'react'
import { useNotifications } from '../context/NotificationContext'

export default function NotificationToast() {
  const { notifications, dismissNotification } = useNotifications()

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
