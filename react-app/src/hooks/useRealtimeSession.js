import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook for managing real-time metronome sessions using Supabase Realtime.
 * Allows a host to broadcast metronome state (BPM, playing, song changes)
 * and clients to receive and sync to those changes.
 * 
 * @param {object} metronomeHook - The metronome hook from useMetronome
 * @param {object} options - Configuration options
 * @returns {object} Session controls and state
 */
export function useRealtimeSession(metronomeHook, options = {}) {
  const [isHost, setIsHost] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [connectedClients, setConnectedClients] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'disconnected', 'connecting', 'connected', 'error'
  const [lastSync, setLastSync] = useState(null)
  
  const channelRef = useRef(null)
  const presenceRef = useRef(null)

  // Generate a unique session ID
  const generateSessionId = useCallback(() => {
    return `metronome-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Start a new session as host
  const startHostSession = useCallback(async () => {
    if (isHost || isClient) {
      console.warn('Already in a session')
      return null
    }

    const newSessionId = generateSessionId()
    setConnectionStatus('connecting')

    try {
      // Create a new Realtime channel for this session
      const channel = supabase.channel(`session:${newSessionId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: 'metronome-users' }
        }
      })

      // Track presence
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: `host-${Date.now()}`,
            role: 'host',
            onlineAt: new Date().toISOString()
          })
          console.log('Host session started:', newSessionId)
          setConnectionStatus('connected')
          setIsHost(true)
          setSessionId(newSessionId)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('error')
          console.error('Failed to start host session')
        }
      })

      // Listen for presence changes
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const clients = Object.values(state).flat().filter(user => user.role === 'client')
        setConnectedClients(clients)
      })

      channelRef.current = channel
      return newSessionId
    } catch (error) {
      console.error('Error starting host session:', error)
      setConnectionStatus('error')
      return null
    }
  }, [isHost, isClient, generateSessionId])

  // Join an existing session as client
  const joinSession = useCallback(async (joinSessionId) => {
    if (isHost || isClient) {
      console.warn('Already in a session')
      return false
    }

    if (!joinSessionId) {
      console.error('Session ID required to join')
      return false
    }

    setConnectionStatus('connecting')

    try {
      const channel = supabase.channel(`session:${joinSessionId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: 'metronome-users' }
        }
      })

      // Listen for state broadcasts from host
      channel
        .on('broadcast', { event: 'metronome-state' }, (payload) => {
          const { bpm, isPlaying, timeSignature, accentPattern, beat, timestamp } = payload.payload
          
          if (metronomeHook) {
            // Sync metronome state
            if (bpm !== undefined && metronomeHook.updateBPM) {
              metronomeHook.updateBPM(bpm)
            }
            if (timeSignature !== undefined && metronomeHook.setTimeSignature) {
              metronomeHook.setTimeSignature(timeSignature)
            }
            if (accentPattern !== undefined && metronomeHook.setAccentPattern) {
              metronomeHook.setAccentPattern(accentPattern)
            }
            // Sync playing state
            if (isPlaying !== undefined && isPlaying !== metronomeHook.isPlaying) {
              metronomeHook.toggle()
            }
          }

          setLastSync({
            timestamp,
            bpm,
            isPlaying,
            beat
          })
        })
        .on('broadcast', { event: 'song-change' }, (payload) => {
          console.log('Song changed by host:', payload.payload)
          // Could dispatch an event here for the app to handle
          window.dispatchEvent(new CustomEvent('realtime:song-change', { 
            detail: payload.payload 
          }))
        })

      // Track presence
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: `client-${Date.now()}`,
            role: 'client',
            onlineAt: new Date().toISOString()
          })
          console.log('Joined session:', joinSessionId)
          setConnectionStatus('connected')
          setIsClient(true)
          setSessionId(joinSessionId)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('error')
          console.error('Failed to join session')
        }
      })

      channelRef.current = channel
      return true
    } catch (error) {
      console.error('Error joining session:', error)
      setConnectionStatus('error')
      return false
    }
  }, [isHost, isClient, metronomeHook])

  // Broadcast metronome state (host only)
  const broadcastState = useCallback(async (state) => {
    if (!isHost || !channelRef.current) {
      console.warn('Not a host or channel not ready')
      return
    }

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'metronome-state',
        payload: {
          ...state,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('Error broadcasting state:', error)
    }
  }, [isHost])

  // Broadcast song change (host only)
  const broadcastSongChange = useCallback(async (song) => {
    if (!isHost || !channelRef.current) {
      console.warn('Not a host or channel not ready')
      return
    }

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'song-change',
        payload: {
          songId: song.id,
          songName: song.name,
          bpm: song.bpm,
          timeSignature: song.timeSignature,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.error('Error broadcasting song change:', error)
    }
  }, [isHost])

  // Leave session
  const leaveSession = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.unsubscribe()
      channelRef.current = null
    }

    setIsHost(false)
    setIsClient(false)
    setSessionId(null)
    setConnectedClients([])
    setConnectionStatus('disconnected')
    setLastSync(null)
  }, [])

  // Auto-broadcast metronome state when host's metronome changes
  useEffect(() => {
    if (!isHost || !metronomeHook) return

    const interval = setInterval(() => {
      if (metronomeHook.isPlaying) {
        broadcastState({
          bpm: metronomeHook.bpm,
          isPlaying: metronomeHook.isPlaying,
          timeSignature: metronomeHook.metronome?.timeSignature || 4,
          accentPattern: metronomeHook.metronome?.accentPattern || null,
          beat: metronomeHook.metronome?.currentBeat || 1
        })
      }
    }, 500) // Broadcast every 500ms when playing

    return () => clearInterval(interval)
  }, [isHost, metronomeHook, broadcastState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [])

  return {
    // State
    isHost,
    isClient,
    sessionId,
    connectedClients,
    connectionStatus,
    lastSync,
    isInSession: isHost || isClient,

    // Actions
    startHostSession,
    joinSession,
    leaveSession,
    broadcastState,
    broadcastSongChange
  }
}

