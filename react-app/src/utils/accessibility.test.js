// Unit tests for accessibility utilities
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  isWakeLockSupported, 
  isVibrationSupported,
  prefersReducedMotion,
  prefersDarkMode,
  prefersHighContrast,
  isLowEndDevice,
  vibrate
} from './accessibility.js'

describe('Feature Detection', () => {
  it('isWakeLockSupported should return boolean', () => {
    const result = isWakeLockSupported()
    expect(typeof result).toBe('boolean')
  })
  
  it('isVibrationSupported should return boolean', () => {
    const result = isVibrationSupported()
    expect(typeof result).toBe('boolean')
  })
  
  it('prefersReducedMotion should return boolean', () => {
    const result = prefersReducedMotion()
    expect(typeof result).toBe('boolean')
  })
  
  it('prefersDarkMode should return boolean', () => {
    const result = prefersDarkMode()
    expect(typeof result).toBe('boolean')
  })
  
  it('prefersHighContrast should return boolean', () => {
    const result = prefersHighContrast()
    expect(typeof result).toBe('boolean')
  })
  
  it('isLowEndDevice should return boolean', () => {
    const result = isLowEndDevice()
    expect(typeof result).toBe('boolean')
  })
})

describe('Vibration', () => {
  beforeEach(() => {
    // Mock navigator.vibrate
    if (!navigator.vibrate) {
      vi.stubGlobal('navigator', {
        ...navigator,
        vibrate: vi.fn(() => true)
      })
    }
  })
  
  afterEach(() => {
    vi.unstubAllGlobals()
  })
  
  it('vibrate should return boolean', () => {
    const result = vibrate(50)
    expect(typeof result).toBe('boolean')
  })
  
  it('vibrate should accept number or array', () => {
    vibrate(50)
    vibrate([50, 100, 50])
    // No errors should be thrown
    expect(true).toBe(true)
  })
})

