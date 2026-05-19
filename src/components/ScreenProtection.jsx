import React, { useEffect, useRef } from 'react'
import { useRecipes } from '../context/RecipeContext'

export default function ScreenProtection() {
  const { isAuthenticated } = useRecipes()
  const blurTimerRef = useRef(null)

  useEffect(() => {
    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        navigator.clipboard?.writeText(
          '🔒 Content protected by Recipe Book Security System'
        ).catch(() => {})
        const root = document.querySelector('.app-root')
        root?.classList.add('screenshot-blur')
        clearTimeout(blurTimerRef.current)
        blurTimerRef.current = setTimeout(() => {
          root?.classList.remove('screenshot-blur')
        }, 2500)
      }
    }

    const handleContextMenu = (e) => {
      e.preventDefault()
      return false
    }

    const handleCopy = (e) => {
      const selection = window.getSelection()?.toString()
      if (selection && e.clipboardData) {
        e.clipboardData.setData(
          'text/plain',
          `${selection}\n\n— 🔒 Recipe Book | Protected content. Unauthorized reproduction prohibited.`
        )
        e.preventDefault()
      }
    }

    window.addEventListener('keyup', handleKeyUp)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)

    return () => {
      window.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      clearTimeout(blurTimerRef.current)
    }
  }, [])

  if (!isAuthenticated) return null

  return (
    <div className="watermark-overlay" aria-hidden="true" role="presentation">
      {Array.from({ length: 15 }).map((_, i) => (
        <span key={i} className="watermark-item">
          Chef User · 192.168.1.x
        </span>
      ))}
    </div>
  )
}
