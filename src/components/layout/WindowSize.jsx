import React, { useState, useEffect } from 'react'
export default function WindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  function getDeviceType() {
    if (windowSize.width <= 640) return 'Mobile'
    if (windowSize.width <= 1000) return 'Tablet'
    return 'Desktop'
  }

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
