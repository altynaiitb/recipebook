import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const NotificationContext = createContext(null)

let _notifId = 0
function makeNotif(msg, type = 'success') {
  return { id: ++_notifId, message: msg, type }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const notifTimers = useRef(new Map())

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    const t = notifTimers.current.get(id)
    if (t) { clearTimeout(t); notifTimers.current.delete(id) }
  }, [])

  const addNotification = useCallback((message, type = 'success') => {
    const n = makeNotif(message, type)
    setNotifications(prev => [...prev, n])
    const t = setTimeout(() => {
      setNotifications(prev => prev.filter(x => x.id !== n.id))
      notifTimers.current.delete(n.id)
    }, 3500)
    notifTimers.current.set(n.id, t)
  }, [])

  useEffect(() => {
    const m = notifTimers.current
    return () => { m.forEach(clearTimeout); m.clear() }
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, dismissNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider')
  return ctx
}
