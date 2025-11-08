// Web MIDI Hook for controlling metronome via MIDI devices
import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Check if Web MIDI API is supported
 */
export function isMIDISupported() {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
}

/**
 * Hook for managing MIDI input/output
 */
export function useMIDI() {
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [error, setError] = useState(null)
  const [isLearning, setIsLearning] = useState(false)
  const [lastMIDIMessage, setLastMIDIMessage] = useState(null)
  
  const midiAccessRef = useRef(null)
  const messageHandlersRef = useRef([])

  /**
   * Initialize MIDI access
   */
  const initMIDI = useCallback(async () => {
    if (!isMIDISupported()) {
      setIsSupported(false)
      setError('Web MIDI API not supported in this browser')
      return false
    }

    setIsSupported(true)

    try {
      const access = await navigator.requestMIDIAccess()
      midiAccessRef.current = access
      
      // Get all input devices
      const inputs = Array.from(access.inputs.values())
      const deviceList = inputs.map((input) => ({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state,
        connection: input.connection
      }))
      
      setDevices(deviceList)
      setIsEnabled(true)
      setError(null)
      
      console.log('MIDI initialized:', deviceList)
      return true
    } catch (err) {
      console.error('Failed to initialize MIDI:', err)
      setError(err.message)
      setIsEnabled(false)
      return false
    }
  }, [])

  /**
   * Attach MIDI message handler
   */
  const attachMessageHandler = useCallback((handler) => {
    if (!midiAccessRef.current) return

    const midiAccess = midiAccessRef.current
    
    // Create wrapper that includes device info
    const wrappedHandler = (event) => {
      const deviceId = event.target.id
      const deviceName = event.target.name || 'Unknown'
      
      handler({
        ...event,
        deviceId,
        deviceName
      })
    }

    // Attach to all inputs
    midiAccess.inputs.forEach((input) => {
      input.addEventListener('midimessage', wrappedHandler)
    })

    // Store for cleanup
    messageHandlersRef.current.push({ handler: wrappedHandler, midiAccess })

    // Return cleanup function
    return () => {
      midiAccess.inputs.forEach((input) => {
        input.removeEventListener('midimessage', wrappedHandler)
      })
      messageHandlersRef.current = messageHandlersRef.current.filter(
        h => h.handler !== wrappedHandler
      )
    }
  }, [])

  /**
   * Parse MIDI message
   */
  const parseMIDIMessage = useCallback((event) => {
    const [status, data1, data2] = event.data
    
    const messageType = status & 0xF0
    const channel = status & 0x0F
    
    let type = 'unknown'
    let note = null
    let velocity = null
    let controller = null
    let value = null
    let program = null
    
    switch (messageType) {
      case 0x80: // Note Off
        type = 'noteoff'
        note = data1
        velocity = data2
        break
      case 0x90: // Note On
        type = data2 === 0 ? 'noteoff' : 'noteon'
        note = data1
        velocity = data2
        break
      case 0xB0: // Control Change
        type = 'cc'
        controller = data1
        value = data2
        break
      case 0xC0: // Program Change
        type = 'pc'
        program = data1
        break
      case 0xE0: // Pitch Bend
        type = 'pitchbend'
        value = (data2 << 7) | data1
        break
    }
    
    return {
      type,
      channel,
      note,
      velocity,
      controller,
      value,
      program,
      raw: event.data,
      timestamp: event.timeStamp
    }
  }, [])

  /**
   * Start learning mode (capture next MIDI message)
   */
  const startLearning = useCallback((onLearn) => {
    setIsLearning(true)
    
    const handler = (event) => {
      const parsed = parseMIDIMessage(event)
      setLastMIDIMessage(parsed)
      
      if (onLearn) {
        onLearn(parsed)
      }
      
      setIsLearning(false)
      
      // Detach handler after learning
      if (midiAccessRef.current) {
        midiAccessRef.current.inputs.forEach((input) => {
          input.removeEventListener('midimessage', handler)
        })
      }
    }
    
    // Attach handler to all inputs
    if (midiAccessRef.current) {
      midiAccessRef.current.inputs.forEach((input) => {
        input.addEventListener('midimessage', handler)
      })
    }
  }, [parseMIDIMessage])

  /**
   * Stop learning mode
   */
  const stopLearning = useCallback(() => {
    setIsLearning(false)
  }, [])

  /**
   * Disable MIDI
   */
  const disable = useCallback(() => {
    // Clean up all message handlers
    messageHandlersRef.current.forEach(({ handler, midiAccess }) => {
      midiAccess.inputs.forEach((input) => {
        input.removeEventListener('midimessage', handler)
      })
    })
    messageHandlersRef.current = []
    
    midiAccessRef.current = null
    setIsEnabled(false)
    setDevices([])
    setSelectedDevice(null)
  }, [])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      disable()
    }
  }, [disable])

  /**
   * Handle device state changes
   */
  useEffect(() => {
    if (!midiAccessRef.current) return

    const handleStateChange = () => {
      const access = midiAccessRef.current
      const inputs = Array.from(access.inputs.values())
      const deviceList = inputs.map((input) => ({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state,
        connection: input.connection
      }))
      
      setDevices(deviceList)
      console.log('MIDI devices changed:', deviceList)
    }

    midiAccessRef.current.addEventListener('statechange', handleStateChange)

    return () => {
      if (midiAccessRef.current) {
        midiAccessRef.current.removeEventListener('statechange', handleStateChange)
      }
    }
  }, [isEnabled])

  return {
    isSupported,
    isEnabled,
    devices,
    selectedDevice,
    error,
    isLearning,
    lastMIDIMessage,
    initMIDI,
    disable,
    attachMessageHandler,
    parseMIDIMessage,
    startLearning,
    stopLearning,
    setSelectedDevice
  }
}

/**
 * Hook for MIDI control mappings
 */
export function useMIDIControl(metronomeHook, midiHook) {
  const [mappings, setMappings] = useState([])
  const mappingsRef = useRef([])

  // Load mappings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('midiMappings')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setMappings(parsed)
        mappingsRef.current = parsed
      } catch (e) {
        console.error('Failed to load MIDI mappings:', e)
      }
    }
  }, [])

  // Save mappings to localStorage
  useEffect(() => {
    if (mappings.length > 0) {
      localStorage.setItem('midiMappings', JSON.stringify(mappings))
    }
  }, [mappings])

  // Add a new mapping
  const addMapping = useCallback((mapping) => {
    setMappings(prev => [...prev, { ...mapping, id: Date.now().toString() }])
  }, [])

  // Remove a mapping
  const removeMapping = useCallback((id) => {
    setMappings(prev => prev.filter(m => m.id !== id))
  }, [])

  // Clear all mappings
  const clearMappings = useCallback(() => {
    setMappings([])
    localStorage.removeItem('midiMappings')
  }, [])

  // Handle MIDI message and trigger mapped actions
  const handleMIDIMessage = useCallback((message) => {
    const parsed = midiHook.parseMIDIMessage(message)
    
    // Find matching mapping
    const mapping = mappingsRef.current.find(m => {
      if (m.type !== parsed.type) return false
      if (m.channel !== undefined && m.channel !== parsed.channel) return false
      
      switch (parsed.type) {
        case 'noteon':
        case 'noteoff':
          return m.note === parsed.note
        case 'cc':
          return m.controller === parsed.controller
        case 'pc':
          return m.program === parsed.program
        default:
          return false
      }
    })
    
    if (mapping && metronomeHook) {
      executeAction(mapping.action, metronomeHook)
    }
  }, [midiHook, metronomeHook])

  // Execute a mapped action
  const executeAction = useCallback((action, hook) => {
    switch (action) {
      case 'play':
        if (!hook.isPlaying) hook.toggle()
        break
      case 'pause':
        if (hook.isPlaying) hook.toggle()
        break
      case 'toggle':
        hook.toggle()
        break
      case 'tap':
        // Trigger tap tempo (need to add this to metronome hook)
        console.log('Tap tempo triggered')
        break
      case 'bpm+1':
        hook.updateBPM(hook.bpm + 1)
        break
      case 'bpm-1':
        hook.updateBPM(hook.bpm - 1)
        break
      case 'bpm+5':
        hook.updateBPM(hook.bpm + 5)
        break
      case 'bpm-5':
        hook.updateBPM(hook.bpm - 5)
        break
      case 'bpm+10':
        hook.updateBPM(hook.bpm + 10)
        break
      case 'bpm-10':
        hook.updateBPM(hook.bpm - 10)
        break
      default:
        console.warn('Unknown MIDI action:', action)
    }
  }, [])

  // Attach handler when enabled
  useEffect(() => {
    if (midiHook.isEnabled) {
      const cleanup = midiHook.attachMessageHandler(handleMIDIMessage)
      return cleanup
    }
  }, [midiHook, handleMIDIMessage])

  return {
    mappings,
    addMapping,
    removeMapping,
    clearMappings
  }
}

