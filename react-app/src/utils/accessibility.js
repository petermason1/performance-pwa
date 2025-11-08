// Accessibility and performance utilities

/**
 * Wake Lock API - Keep screen awake during performance
 */
let wakeLock = null

export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) {
    console.warn('Wake Lock API not supported')
    return false
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen')
    console.log('Wake Lock acquired')
    
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock released')
    })
    
    return true
  } catch (err) {
    console.error('Failed to acquire Wake Lock:', err)
    return false
  }
}

export async function releaseWakeLock() {
  if (wakeLock) {
    try {
      await wakeLock.release()
      wakeLock = null
      console.log('Wake Lock manually released')
      return true
    } catch (err) {
      console.error('Failed to release Wake Lock:', err)
      return false
    }
  }
  return true
}

export function isWakeLockSupported() {
  return 'wakeLock' in navigator
}

export function isWakeLockActive() {
  return wakeLock !== null && !wakeLock.released
}

/**
 * Haptic Feedback - Vibration API
 */
export function vibrate(pattern = 50) {
  if (!('vibrate' in navigator)) {
    console.warn('Vibration API not supported')
    return false
  }

  try {
    if (Array.isArray(pattern)) {
      navigator.vibrate(pattern)
    } else {
      navigator.vibrate(pattern)
    }
    return true
  } catch (err) {
    console.error('Vibration failed:', err)
    return false
  }
}

export function vibratePattern(pattern) {
  return vibrate(pattern)
}

export function vibrateBeat(isAccent = false) {
  if (isAccent) {
    vibrate([30, 10, 30]) // Double pulse for accent
  } else {
    vibrate(15) // Short pulse for normal beat
  }
}

export function stopVibration() {
  if ('vibrate' in navigator) {
    navigator.vibrate(0)
  }
}

export function isVibrationSupported() {
  return 'vibrate' in navigator
}

/**
 * ARIA Live Announcer
 */
let liveRegion = null

export function initARIALiveRegion() {
  if (liveRegion) return liveRegion

  liveRegion = document.createElement('div')
  liveRegion.setAttribute('role', 'status')
  liveRegion.setAttribute('aria-live', 'polite')
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.style.position = 'absolute'
  liveRegion.style.left = '-10000px'
  liveRegion.style.width = '1px'
  liveRegion.style.height = '1px'
  liveRegion.style.overflow = 'hidden'
  
  document.body.appendChild(liveRegion)
  return liveRegion
}

export function announce(message, priority = 'polite') {
  const region = liveRegion || initARIALiveRegion()
  region.setAttribute('aria-live', priority) // 'polite' | 'assertive' | 'off'
  
  // Clear and set new message
  region.textContent = ''
  setTimeout(() => {
    region.textContent = message
  }, 100)
}

/**
 * Keyboard Navigation Helpers
 */
export function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }
  
  element.addEventListener('keydown', handleKeyDown)
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Focus Management
 */
export function saveFocus() {
  return document.activeElement
}

export function restoreFocus(element) {
  if (element && typeof element.focus === 'function') {
    element.focus()
  }
}

/**
 * Reduced Motion Detection
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function onReducedMotionChange(callback) {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  
  const handler = (e) => {
    callback(e.matches)
  }
  
  mediaQuery.addEventListener('change', handler)
  
  // Call immediately with current value
  callback(mediaQuery.matches)
  
  // Return cleanup
  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}

/**
 * High Contrast Mode Detection
 */
export function prefersHighContrast() {
  // Check for Windows High Contrast Mode
  return window.matchMedia('(prefers-contrast: high)').matches ||
         window.matchMedia('(-ms-high-contrast: active)').matches
}

/**
 * Color Scheme Detection
 */
export function prefersDarkMode() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Touch Target Size Validation
 */
export function validateTouchTargetSize(element, minSize = 44) {
  const rect = element.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  
  const isValid = width >= minSize && height >= minSize
  
  if (!isValid) {
    console.warn(`Touch target too small: ${width}x${height}px (minimum ${minSize}x${minSize}px)`, element)
  }
  
  return isValid
}

/**
 * Performance: Request Idle Callback Polyfill
 */
export function requestIdleCallback(callback, options) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }
  
  // Fallback
  const start = Date.now()
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    })
  }, 1)
}

export function cancelIdleCallback(id) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

/**
 * Performance: Check if device is low-end
 */
export function isLowEndDevice() {
  // Check hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    return true
  }
  
  // Check device memory (if available)
  if (navigator.deviceMemory && navigator.deviceMemory < 4) {
    return true
  }
  
  // Check connection type
  if (navigator.connection) {
    const conn = navigator.connection
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
      return true
    }
  }
  
  return false
}

/**
 * Battery Status
 */
export async function getBatteryStatus() {
  if (!('getBattery' in navigator)) {
    return null
  }
  
  try {
    const battery = await navigator.getBattery()
    return {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime
    }
  } catch (err) {
    console.error('Battery API not available:', err)
    return null
  }
}

/**
 * Auto-enable wake lock when metronome is playing
 */
export function setupAutoWakeLock(isPlayingRef, enabledRef) {
  if (!isWakeLockSupported()) {
    console.warn('Wake Lock not supported')
    return () => {}
  }

  const checkAndUpdateWakeLock = async () => {
    if (isPlayingRef.current && enabledRef.current && !isWakeLockActive()) {
      await requestWakeLock()
    } else if ((!isPlayingRef.current || !enabledRef.current) && isWakeLockActive()) {
      await releaseWakeLock()
    }
  }

  // Check when page visibility changes (reacquire wake lock if needed)
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      checkAndUpdateWakeLock()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Return cleanup
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    releaseWakeLock()
  }
}

