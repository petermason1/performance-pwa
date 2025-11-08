// Audio utilities for metronome

/**
 * Create an audio context (handles browser compatibility)
 */
export function createAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  
  if (!AudioContextClass) {
    throw new Error('Web Audio API not supported in this browser')
  }
  
  const context = new AudioContextClass()
  
  // Handle iOS restrictions
  if (context.state === 'suspended') {
    console.warn('AudioContext created in suspended state. Will resume on user interaction.')
  }
  
  return context
}

/**
 * Resume audio context (required after user interaction on iOS)
 */
export async function resumeAudioContext(context) {
  if (context && context.state === 'suspended') {
    try {
      await context.resume()
      console.log('AudioContext resumed')
      return true
    } catch (error) {
      console.error('Failed to resume AudioContext:', error)
      return false
    }
  }
  return true
}

/**
 * Create a click sound using oscillator
 * @param {AudioContext} context 
 * @param {number} time - When to play (audioContext.currentTime)
 * @param {boolean} isAccent - Whether this is an accented beat
 * @param {object} options - Optional params: frequency, volume, duration
 */
export function createClickSound(context, time, isAccent = false, options = {}) {
  const {
    accentFreq = 1000,    // Hz
    normalFreq = 600,     // Hz
    accentVolume = 0.5,
    normalVolume = 0.3,
    attackTime = 0.01,    // seconds
    releaseTime = 0.15    // seconds
  } = options
  
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  
  // Set frequency based on accent
  oscillator.frequency.value = isAccent ? accentFreq : normalFreq
  oscillator.type = 'sine'
  
  // Envelope (attack and release) to avoid clicks
  const volume = isAccent ? accentVolume : normalVolume
  gainNode.gain.setValueAtTime(0, time)
  gainNode.gain.linearRampToValueAtTime(volume, time + attackTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, time + releaseTime)
  
  oscillator.start(time)
  oscillator.stop(time + releaseTime)
  
  return { oscillator, gainNode }
}

/**
 * Create a woodblock-style click sound
 */
export function createWoodblockSound(context, time, isAccent = false) {
  // Woodblock is a short burst of noise with specific frequency emphasis
  const duration = isAccent ? 0.05 : 0.03
  const volume = isAccent ? 0.6 : 0.4
  
  // Create white noise
  const bufferSize = context.sampleRate * duration
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate)
  const data = buffer.getChannelData(0)
  
  // Fill with noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  
  // Apply envelope
  for (let i = 0; i < bufferSize; i++) {
    const envelope = Math.exp(-i / (bufferSize * 0.2))
    data[i] *= envelope
  }
  
  const source = context.createBufferSource()
  source.buffer = buffer
  
  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = isAccent ? 800 : 600
  filter.Q.value = 2
  
  const gainNode = context.createGain()
  gainNode.gain.value = volume
  
  source.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(context.destination)
  
  source.start(time)
  
  return { source, filter, gainNode }
}

/**
 * Load an audio file as a buffer
 */
export async function loadAudioFile(context, url) {
  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await context.decodeAudioData(arrayBuffer)
    return audioBuffer
  } catch (error) {
    console.error('Failed to load audio file:', error)
    return null
  }
}

/**
 * Play an audio buffer at a specific time
 */
export function playBufferAtTime(context, buffer, time, volume = 1.0) {
  const source = context.createBufferSource()
  source.buffer = buffer
  
  const gainNode = context.createGain()
  gainNode.gain.value = volume
  
  source.connect(gainNode)
  gainNode.connect(context.destination)
  
  source.start(time)
  
  return { source, gainNode }
}

/**
 * Calculate the duration of one beat in seconds
 */
export function beatDuration(bpm) {
  return 60.0 / bpm
}

/**
 * Calculate beats per second
 */
export function beatsPerSecond(bpm) {
  return bpm / 60.0
}

/**
 * Convert BPM to milliseconds per beat
 */
export function bpmToMs(bpm) {
  return (60.0 / bpm) * 1000
}

/**
 * Convert milliseconds to BPM
 */
export function msToBpm(ms) {
  return (60.0 / (ms / 1000))
}

/**
 * Check if Web Audio API is supported
 */
export function isWebAudioSupported() {
  return !!(window.AudioContext || window.webkitAudioContext)
}

/**
 * Get audio context state
 */
export function getAudioContextState(context) {
  if (!context) return 'not-initialized'
  return context.state // 'suspended', 'running', 'closed'
}

/**
 * Scheduler constants (best practices for Web Audio metronome)
 */
export const SCHEDULER_CONFIG = {
  LOOKAHEAD_MS: 25,           // How often to check for scheduling (ms)
  SCHEDULE_AHEAD_S: 0.1,      // How far ahead to schedule beats (seconds)
  TIME_UPDATE_MS: 50,         // How often to update elapsed time (ms)
  MIN_BPM: 40,
  MAX_BPM: 300
}

