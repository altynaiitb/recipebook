import React, { useState, useEffect } from 'react'

// ============================================
// LAB REQUIREMENT: Window event listener with cleanup
// Demonstrates addEventListener with removeEventListener cleanup
// This is a KEY requirement for Laboratory Work #3
// ============================================

export default function WindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  // ============================================
  // CORE LAB REQUIREMENT: useEffect with cleanup
  // - Uses window.addEventListener for resize events
  // - CLEANUP: removeEventListener prevents memory leak
  // - Empty dependency array = runs once on mount
  // ============================================
  useEffect(() => {
    // Handler function to update state with new dimensions
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    // Add event listener when component mounts
    window.addEventListener('resize', handleResize)

    // ✅ CLEANUP FUNCTION - Critical for Lab requirement!
    // This runs when component unmounts
    // Removes the event listener to prevent:
    // 1. Memory leaks
    // 2. Trying to update state on unmounted component
    // 3. Multiple listeners stacking up
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, []) // Empty dependency array = effect runs once on mount

  // Determine device type based on viewport width
  // Matches the CSS media query breakpoints in styles.css
  function getDeviceType() {
    if (windowSize.width <= 640) return 'Mobile'
    if (windowSize.width <= 1000) return 'Tablet'
    return 'Desktop'
  }

  // Get appropriate icon for device type
  function getDeviceIcon() {
    const deviceType = getDeviceType()
    if (deviceType === 'Mobile') return '📱'
    if (deviceType === 'Tablet') return '📟'
    return '🖥️'
  }

  const deviceType = getDeviceType()

  return (
    <div className="window-size">
      <span className="window-dimensions">
        {windowSize.width} × {windowSize.height}
      </span>
      <span className={`device-tag ${deviceType.toLowerCase()}`}>
        {getDeviceIcon()} {deviceType}
      </span>
    </div>
  )
}
