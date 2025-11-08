// Unit tests for audio utilities
import { describe, it, expect } from 'vitest'
import { beatDuration, beatsPerSecond, bpmToMs, msToBpm, isWebAudioSupported, SCHEDULER_CONFIG } from './audio.js'

describe('beatDuration', () => {
  it('should calculate correct beat duration', () => {
    expect(beatDuration(60)).toBe(1.0) // 60 BPM = 1 second per beat
    expect(beatDuration(120)).toBe(0.5) // 120 BPM = 0.5 seconds per beat
    expect(beatDuration(240)).toBe(0.25) // 240 BPM = 0.25 seconds per beat
  })
})

describe('beatsPerSecond', () => {
  it('should calculate correct beats per second', () => {
    expect(beatsPerSecond(60)).toBe(1.0) // 60 BPM = 1 beat per second
    expect(beatsPerSecond(120)).toBe(2.0) // 120 BPM = 2 beats per second
    expect(beatsPerSecond(240)).toBe(4.0) // 240 BPM = 4 beats per second
  })
})

describe('bpmToMs', () => {
  it('should convert BPM to milliseconds', () => {
    expect(bpmToMs(60)).toBe(1000) // 60 BPM = 1000ms per beat
    expect(bpmToMs(120)).toBe(500) // 120 BPM = 500ms per beat
  })
})

describe('msToBpm', () => {
  it('should convert milliseconds to BPM', () => {
    expect(msToBpm(1000)).toBe(60) // 1000ms = 60 BPM
    expect(msToBpm(500)).toBe(120) // 500ms = 120 BPM
  })
})

describe('bpmToMs and msToBpm', () => {
  it('should be inverse operations', () => {
    const bpm = 150
    expect(msToBpm(bpmToMs(bpm))).toBe(bpm)
    
    const ms = 400
    expect(bpmToMs(msToBpm(ms))).toBe(ms)
  })
})

describe('SCHEDULER_CONFIG', () => {
  it('should have correct constants', () => {
    expect(SCHEDULER_CONFIG.LOOKAHEAD_MS).toBe(25)
    expect(SCHEDULER_CONFIG.SCHEDULE_AHEAD_S).toBe(0.1)
    expect(SCHEDULER_CONFIG.MIN_BPM).toBe(40)
    expect(SCHEDULER_CONFIG.MAX_BPM).toBe(300)
  })
})

describe('isWebAudioSupported', () => {
  it('should return a boolean', () => {
    const result = isWebAudioSupported()
    expect(typeof result).toBe('boolean')
  })
})

