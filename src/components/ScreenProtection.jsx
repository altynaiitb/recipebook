import React, { useEffect, useRef } from 'react'
import { useRecipes } from '../context/RecipeContext'

// ============================================
// LAB 8 SECURITY: Screenshot Prevention + Watermark
//
// 1. PrintScreen key → temporary blur + clears clipboard
// 2. Right-click (contextmenu) → prevented globally
// 3. Copy event → appended security notice to clipboard
// 4. @media print → hides all content (see styles.css)
// 5. Watermark overlay → visible only when authenticated
// ============================================

export default function ScreenProtection() {
  const { isAuthenticated } = useRecipes()
  const blurTimerRef = useRef(null)

  useEffect(() => {
    // ── PrintScreen: blur + clear clipboard ──────────────────────────
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

    // ── Right-click: prevent context menu ────────────────────────────
    const handleContextMenu = (e) => {
      e.preventDefault()
      return false
    }

    // ── Copy: append security watermark to copied text ────────────────
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
  }, []) // mount once — no deps needed

  // Watermark shown only when fully authenticated
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
