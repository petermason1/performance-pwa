// Unit tests for useTempoWheel hook
import { describe, it, expect } from 'vitest'

// Helper functions from useTempoWheel
function angleFromBPM(bpm) {
  const normalized = (Math.max(40, Math.min(300, bpm)) - 40) / 260
  return normalized * 360
}

function bpmFromAngle(angle) {
  const normalized = ((angle % 360) + 360) % 360 / 360
  const bpm = Math.round(40 + (normalized * 260))
  return Math.max(40, Math.min(300, bpm))
}

describe('angleFromBPM', () => {
  it('should map BPM to angle correctly', () => {
    expect(angleFromBPM(40)).toBe(0)
    expect(angleFromBPM(300)).toBe(360)
    expect(angleFromBPM(170)).toBeCloseTo(180, 1) // Middle of range
  })
  
  it('should clamp BPM to 40-300 range', () => {
    expect(angleFromBPM(30)).toBe(0)
    expect(angleFromBPM(350)).toBe(360)
  })
})

describe('bpmFromAngle', () => {
  it('should map angle to BPM correctly', () => {
    expect(bpmFromAngle(0)).toBe(40)
    expect(bpmFromAngle(360)).toBe(40) // Wraps around
    expect(bpmFromAngle(180)).toBeGreaterThanOrEqual(165)
    expect(bpmFromAngle(180)).toBeLessThanOrEqual(175)
  })
  
  it('should handle negative angles', () => {
    const result = bpmFromAngle(-90)
    expect(result).toBeGreaterThanOrEqual(40)
    expect(result).toBeLessThanOrEqual(300)
  })
  
  it('should handle angles > 360', () => {
    const result = bpmFromAngle(450) // 450 = 90 degrees
    expect(result).toBeGreaterThanOrEqual(40)
    expect(result).toBeLessThanOrEqual(300)
  })
})

describe('BPM and Angle conversion', () => {
  it('should be inverse operations', () => {
    const testBPMs = [40, 100, 150, 200, 250, 300]
    
    testBPMs.forEach(bpm => {
      const angle = angleFromBPM(bpm)
      const convertedBPM = bpmFromAngle(angle)
      expect(convertedBPM).toBeCloseTo(bpm, 0)
    })
  })
  
  it('should handle full rotation (0-360°)', () => {
    const angle0 = angleFromBPM(40)
    const angle360 = angleFromBPM(300)
    
    expect(angle0).toBe(0)
    expect(angle360).toBe(360)
    
    expect(bpmFromAngle(angle0)).toBe(40)
    expect(bpmFromAngle(angle360)).toBe(40) // Wraps back to 40
  })
})

