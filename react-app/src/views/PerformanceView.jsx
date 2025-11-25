import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useApp } from '../hooks/useApp'
import { useTempoWheel } from '../hooks/useTempoWheel'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { midiController } from '../midi'
import { announce } from '../utils/accessibility'
import ModeToggle from '../components/Performance/ModeToggle'
import LiveView from '../components/Performance/LiveView'
import MetronomeSettings from '../components/Performance/MetronomeSettings'
import ExampleSetListsModal from '../components/ExampleSetListsModal'
import PresetSelector from '../components/PresetSelector'
import { initPresets } from '../utils/presets'
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal'
import RealtimeSessionModal from '../components/RealtimeSessionModal'
import MIDIStatusIndicator from '../components/MIDIStatusIndicator'
import MIDIControlModal from '../components/MIDIControlModal'
import './PerformanceView.css'

function patternsEqual(a, b) {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let index = 0; index < a.length; index += 1) {
    if (Boolean(a[index]) !== Boolean(b[index])) {
      return false
    }
  }
  return true
}

export default function PerformanceView() {
  const { songs, setLists, getSetList, getSong, updateSong, updateSetList, addSetList, metronome: metronomeHook, setCurrentView, ui, dispatchUi, focusMode } = useApp()
  const [currentSetList, setCurrentSetList] = useState(null)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [currentSong, setCurrentSong] = useState(null)
  const [showExampleSetListsModal, setShowExampleSetListsModal] = useState(false)
  const [selectedSetListId, setSelectedSetListId] = useState(() => {
    // Restore selected set list from localStorage
    return localStorage.getItem('currentSetListId') || ''
  })
  const [performanceMode, setPerformanceMode] = useState('setup')
  const [timeSignature, setTimeSignatureState] = useState(4)
  const [accentPattern, setAccentPatternState] = useState([])
  const [polyrhythm, setPolyrhythm] = useState(null)
  const [showCustomPolyrhythm, setShowCustomPolyrhythm] = useState(false)
  const [customPolyrhythmValue, setCustomPolyrhythmValue] = useState('')
  const [songHasChanges, setSongHasChanges] = useState(false)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [tapTimes, setTapTimes] = useState([])
  const [tapTempoMessage, setTapTempoMessage] = useState('')
  const [bpmInputValue, setBpmInputValue] = useState('')
  const [isEditingBPM, setIsEditingBPM] = useState(false)
  const [currentBeatInMeasure, setCurrentBeatInMeasure] = useState(0)
  const [isBeatFlashing, setIsBeatFlashing] = useState(false)
  const [isAccentBeat, setIsAccentBeat] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('metronomeSoundEnabled') !== 'false')
  const [visualEnabled, setVisualEnabled] = useState(() => localStorage.getItem('metronomeVisualEnabled') !== 'false')
  const [showBeatNumber, setShowBeatNumber] = useState(() => localStorage.getItem('metronomeShowBeatNumber') !== 'false')
  
  // Use global metronome from context
  const {
    bpm,
    isPlaying,
    updateBPM,
    toggle,
    setTimeSignature: setMetronomeTimeSignature,
    setAccentPattern: setMetronomeAccentPattern,
    setPolyrhythm: setMetronomePolyrhythm,
    setSoundEnabled: setMetronomeSoundEnabled,
    setSubdivision: setMetronomeSubdivision,
    setSoundPreset: setMetronomeSoundPreset,
    setAccentVolume: setMetronomeAccentVolume,
    setRegularVolume: setMetronomeRegularVolume,
    setSubdivisionVolume: setMetronomeSubdivisionVolume,
    setMasterVolume: setMetronomeMasterVolume,
    setCountIn: setMetronomeCountIn,
    metronome
  } = metronomeHook

  // Metronome settings state
  const [soundPreset, setSoundPreset] = useState(() => {
    return localStorage.getItem('metronomeSoundPreset') || 'click'
  })
  const [subdivision, setSubdivision] = useState(() => {
    return localStorage.getItem('metronomeSubdivision') || 'none'
  })
  const [countInBeats, setCountInBeats] = useState(() => {
    return parseInt(localStorage.getItem('metronomeCountIn') || '0', 10)
  })
  const [accentVolume, setAccentVolume] = useState(() => {
    return parseFloat(localStorage.getItem('metronomeAccentVolume') || '0.8')
  })
  const [regularVolume, setRegularVolume] = useState(() => {
    return parseFloat(localStorage.getItem('metronomeRegularVolume') || '0.5')
  })
  const [subdivisionVolume, setSubdivisionVolume] = useState(() => {
    return parseFloat(localStorage.getItem('metronomeSubdivisionVolume') || '0.3')
  })
  const [masterVolume, setMasterVolume] = useState(() => {
    return parseFloat(localStorage.getItem('metronomeMasterVolume') || '0.3')
  })
  
  // Get songs from current set list
  const setListSongs = useMemo(() => {
    if (!currentSetList || !currentSetList.songIds) return []
    return currentSetList.songIds
      .map(id => getSong(id))
      .filter(s => s !== undefined)
  }, [currentSetList, getSong])

  const updateBeatPatternSelector = useCallback((sig, pattern = null) => {
    const newPattern = pattern || new Array(sig).fill(false)
    setAccentPatternState(newPattern)
    if (pattern && pattern.some(p => p)) {
      setMetronomeAccentPattern(newPattern)
    } else {
      setMetronomeAccentPattern(null)
    }
  }, [setMetronomeAccentPattern])

  const handleBPMChange = useCallback((newBPM) => {
    updateBPM(newBPM)
    if (currentSong) {
      setSongHasChanges(true)
    }
    // Announce tempo change to screen readers
    announce(`Tempo changed to ${newBPM} BPM`, 'polite')
  }, [currentSong, updateBPM])

  // Sync bpmInputValue when bpm changes externally (but not when editing)
  useEffect(() => {
    if (!isEditingBPM) {
      setBpmInputValue(bpm.toString())
    }
  }, [bpm, isEditingBPM])

  const handleBPMInputChange = (e) => {
    const value = e.target.value
    setBpmInputValue(value)
  }

  const handleBPMInputBlur = () => {
    setIsEditingBPM(false)
    const numValue = parseInt(bpmInputValue)
    if (!isNaN(numValue) && numValue >= 40 && numValue <= 300) {
      handleBPMChange(numValue)
    } else {
      // Reset to current BPM if invalid
      setBpmInputValue(bpm.toString())
    }
  }

  const handleBPMInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    } else if (e.key === 'Escape') {
      setBpmInputValue(bpm.toString())
      setIsEditingBPM(false)
      e.target.blur()
    }
  }

  const handleBPMClick = () => {
    setIsEditingBPM(true)
    setBpmInputValue(bpm.toString())
  }

  const { wheelRef, rotation } = useTempoWheel(bpm, handleBPMChange)

  // Initialize accent pattern based on time signature - default to no accent
  useEffect(() => {
    if (timeSignature <= 0) {
      setAccentPatternState(prev => (prev.length === 0 ? prev : []))
      setMetronomeAccentPattern(null)
      return
    }

    const nextPattern =
      accentPattern.length === timeSignature
        ? accentPattern
        : new Array(timeSignature).fill(false)

    if (!patternsEqual(accentPattern, nextPattern)) {
      setAccentPatternState(nextPattern)
    }

    const shouldAccent = nextPattern.some(Boolean)
    setMetronomeAccentPattern(shouldAccent ? nextPattern : null)
  }, [timeSignature, accentPattern, setMetronomeAccentPattern])

  // Update metronome when song changes
  useEffect(() => {
    if (currentSong) {
      if (currentSong.bpm) updateBPM(currentSong.bpm)
      if (currentSong.timeSignature) {
        setTimeSignatureState(currentSong.timeSignature)
        setMetronomeTimeSignature(currentSong.timeSignature)
        // Use song's accent pattern if it has one, otherwise no accent (null)
        updateBeatPatternSelector(currentSong.timeSignature, currentSong.accentPattern || null)
      } else {
        // No song accent pattern - ensure no accent is set
        updateBeatPatternSelector(timeSignature, null)
      }
      if (currentSong.polyrhythm) {
        setPolyrhythm(currentSong.polyrhythm)
        setMetronomePolyrhythm(currentSong.polyrhythm.pattern, currentSong.polyrhythm.name)
        if (currentSong.polyrhythm.name === 'custom') {
          setShowCustomPolyrhythm(true)
          setCustomPolyrhythmValue(currentSong.polyrhythm.pattern.join(','))
        } else {
          setShowCustomPolyrhythm(false)
          setCustomPolyrhythmValue('')
        }
      } else {
        setPolyrhythm(null)
        setMetronomePolyrhythm(null)
        setShowCustomPolyrhythm(false)
        setCustomPolyrhythmValue('')
      }
      
      // Load lyrics into metronome
      if (metronome && currentSong.lyrics) {
        metronome.lyrics = currentSong.lyrics
        metronome.currentLyricIndex = 0
      }
      
    }
  }, [currentSong, setMetronomeTimeSignature, setMetronomeAccentPattern, setMetronomePolyrhythm, metronome, updateBPM, updateBeatPatternSelector, timeSignature])

  // Set up metronome callbacks
  useEffect(() => {
    if (!metronome) return
    
    metronome.setOnBeatCallback((beatNumber, isAccent, isSubdivision) => {
      // Only update beat display for main beats, not subdivisions
      if (!isSubdivision) {
        setCurrentBeatInMeasure(beatNumber)
      }
      
      if (visualEnabled) {
        setIsBeatFlashing(true)
        setIsAccentBeat(isAccent)
        setTimeout(() => {
          setIsBeatFlashing(false)
        }, 150)
      }
    })
    
    metronome.setOnTimeUpdateCallback(() => {
      if (currentSong && currentSong.lyrics) {
        const index = metronome.currentLyricIndex
        setCurrentLyricIndex(index)
      }
      // Also update current beat from metronome state
      if (metronome.isPlaying) {
        setCurrentBeatInMeasure(metronome.getCurrentBeatInMeasure())
      }
    })
    
    return () => {
      metronome.setOnBeatCallback(null)
      metronome.setOnTimeUpdateCallback(null)
    }
  }, [metronome, currentSong, visualEnabled, setMetronomeAccentPattern])
  
  // Announce metronome state changes
  useEffect(() => {
    if (isPlaying) {
      announce('Metronome started', 'assertive')
    } else {
      announce('Metronome stopped', 'polite')
    }
  }, [isPlaying])
  
  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('metronomeSoundEnabled', soundEnabled.toString())
  }, [soundEnabled])
  
  useEffect(() => {
    localStorage.setItem('metronomeVisualEnabled', visualEnabled.toString())
  }, [visualEnabled])
  
  useEffect(() => {
    localStorage.setItem('metronomeShowBeatNumber', showBeatNumber.toString())
  }, [showBeatNumber])
  
  // Sync sound enabled setting with metronome
  useEffect(() => {
    if (setMetronomeSoundEnabled) {
      setMetronomeSoundEnabled(soundEnabled)
    }
  }, [soundEnabled, setMetronomeSoundEnabled])

  // Sync metronome settings with metronome engine
  useEffect(() => {
    if (setMetronomeSoundPreset) {
      setMetronomeSoundPreset(soundPreset)
      localStorage.setItem('metronomeSoundPreset', soundPreset)
    }
  }, [soundPreset, setMetronomeSoundPreset])

  useEffect(() => {
    if (setMetronomeSubdivision) {
      setMetronomeSubdivision(subdivision)
      localStorage.setItem('metronomeSubdivision', subdivision)
    }
  }, [subdivision, setMetronomeSubdivision])

  useEffect(() => {
    if (setMetronomeCountIn) {
      setMetronomeCountIn(countInBeats)
      localStorage.setItem('metronomeCountIn', countInBeats.toString())
    }
  }, [countInBeats, setMetronomeCountIn])

  useEffect(() => {
    if (setMetronomeAccentVolume) {
      setMetronomeAccentVolume(accentVolume)
      localStorage.setItem('metronomeAccentVolume', accentVolume.toString())
    }
  }, [accentVolume, setMetronomeAccentVolume])

  useEffect(() => {
    if (setMetronomeRegularVolume) {
      setMetronomeRegularVolume(regularVolume)
      localStorage.setItem('metronomeRegularVolume', regularVolume.toString())
    }
  }, [regularVolume, setMetronomeRegularVolume])

  useEffect(() => {
    if (setMetronomeSubdivisionVolume) {
      setMetronomeSubdivisionVolume(subdivisionVolume)
      localStorage.setItem('metronomeSubdivisionVolume', subdivisionVolume.toString())
    }
  }, [subdivisionVolume, setMetronomeSubdivisionVolume])

  useEffect(() => {
    if (setMetronomeMasterVolume) {
      setMetronomeMasterVolume(masterVolume)
      localStorage.setItem('metronomeMasterVolume', masterVolume.toString())
    }
  }, [masterVolume, setMetronomeMasterVolume])

  const loadSetList = (setListId) => {
    const setList = getSetList(setListId)
    if (!setList) return
    
    // Save to localStorage so it persists across view changes
    localStorage.setItem('currentSetListId', setListId)
    setSelectedSetListId(setListId)
    
    setCurrentSetList(setList)
    setCurrentSongIndex(0)
    setSongHasChanges(false)
    
    if (setList.songIds && setList.songIds.length > 0) {
      const firstSong = getSong(setList.songIds[0])
      if (firstSong) {
        setCurrentSong(firstSong)
      }
    } else {
      setCurrentSong(null)
    }
  }
  
  // Restore loaded set list on mount
  useEffect(() => {
    const savedSetListId = localStorage.getItem('currentSetListId')
    if (savedSetListId) {
      const setList = getSetList(savedSetListId)
      if (setList) {
        // Set list still exists, restore it
        setCurrentSetList(setList)
        setSelectedSetListId(savedSetListId)
        
        // Restore current song if available
        if (setList.songIds && setList.songIds.length > 0) {
          const savedSongIndex = parseInt(localStorage.getItem('currentSongIndex') || '0')
          const songIndex = Math.min(savedSongIndex, setList.songIds.length - 1)
          const song = getSong(setList.songIds[songIndex])
          if (song) {
            setCurrentSongIndex(songIndex)
            setCurrentSong(song)
          }
        }
      } else {
        // Set list was deleted, clear the saved ID
        localStorage.removeItem('currentSetListId')
      }
    }
  }, [getSetList, getSong])
  
  // Save current song index when it changes
  useEffect(() => {
    if (currentSetList && currentSongIndex >= 0) {
      localStorage.setItem('currentSongIndex', currentSongIndex.toString())
    }
  }, [currentSongIndex, currentSetList])

  const selectSong = useCallback((index) => {
    // Get fresh songs list to avoid stale data
    const songs = currentSetList ? 
      currentSetList.songIds
        .map(id => getSong(id))
        .filter(s => s !== undefined) : []
    
    if (index < 0 || index >= songs.length) return
    
    const songToLoad = songs[index]
    if (!songToLoad) return
    
    const isCurrentlyPlaying = isPlaying && index === currentSongIndex
    
    if (isCurrentlyPlaying) {
      // If clicking the currently playing song, stop the metronome
      toggle()
    } else {
      // If clicking a different song or no song is playing
      setCurrentSongIndex(index)
      setSongHasChanges(false)
      setCurrentSong(songToLoad)
      
      // Announce song change to screen readers
      announce(`Now playing: ${songToLoad.name}${songToLoad.artist ? ` by ${songToLoad.artist}` : ''}, ${songToLoad.bpm} BPM`, 'assertive')
      
      // If metronome is not playing, start it
      if (!isPlaying) {
        toggle()
      }
      // If metronome is playing, it will automatically update tempo via useEffect
    }
  }, [currentSetList, getSong, isPlaying, currentSongIndex, toggle])

  const nextSong = useCallback(() => {
    if (!currentSetList || !currentSetList.songIds || currentSetList.songIds.length === 0) return
    if (currentSongIndex < currentSetList.songIds.length - 1) {
      selectSong(currentSongIndex + 1)
    }
  }, [currentSongIndex, currentSetList, selectSong])

  const previousSong = useCallback(() => {
    if (currentSongIndex > 0) {
      selectSong(currentSongIndex - 1)
    }
  }, [currentSongIndex, selectSong])

  // Keyboard shortcuts integration
  const handleIncreaseBPM = useCallback(() => {
    const newBPM = Math.min(300, bpm + 1)
    handleBPMChange(newBPM)
  }, [bpm, handleBPMChange])

  const handleDecreaseBPM = useCallback(() => {
    const newBPM = Math.max(40, bpm - 1)
    handleBPMChange(newBPM)
  }, [bpm, handleBPMChange])

  const handleStopMetronome = useCallback(() => {
    if (isPlaying) {
      toggle()
    }
  }, [isPlaying, toggle])

  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [presetFeedback, setPresetFeedback] = useState(null)
  const [showRealtimeSession, setShowRealtimeSession] = useState(false)
  const [showLyrics, setShowLyrics] = useState(() => localStorage.getItem('performanceShowLyrics') === 'true')
  const [showMIDIControl, setShowMIDIControl] = useState(false)
  const presetFeedbackTimeoutRef = useRef(null)
  const lastSentHelixPresetRef = useRef({ songId: null, presetNumber: null })

  const showPresetFeedback = useCallback((payload) => {
    if (!payload) {
      setPresetFeedback(null)
      if (presetFeedbackTimeoutRef.current) {
        clearTimeout(presetFeedbackTimeoutRef.current)
        presetFeedbackTimeoutRef.current = null
      }
      return
    }

    setPresetFeedback(payload)
    if (presetFeedbackTimeoutRef.current) {
      clearTimeout(presetFeedbackTimeoutRef.current)
    }
    const duration = payload.duration ?? 4000
    presetFeedbackTimeoutRef.current = setTimeout(() => {
      setPresetFeedback(null)
      presetFeedbackTimeoutRef.current = null
    }, duration)
  }, [setPresetFeedback])

  const handleSendHelixPreset = useCallback(async (program, { source = 'manual', label } = {}) => {
    if (program === undefined || program === null) {
      showPresetFeedback({
        message: 'No Helix preset assigned to this song.',
        variant: 'warning'
      })
      return false
    }

    const programNumber = Number(program)
    if (!Number.isInteger(programNumber) || programNumber < 0 || programNumber > 127) {
      showPresetFeedback({
        message: 'Helix preset number must be between 0 and 127.',
        variant: 'error'
      })
      return false
    }

    if (!midiController.isSupported) {
      showPresetFeedback({
        message: 'Web MIDI is not supported in this browser. Try Chrome or Edge on desktop.',
        variant: 'error'
      })
      return false
    }

    if (!midiController.outputs.length) {
      const initialized = await midiController.initialize()
      if (!initialized || !midiController.outputs.length) {
        showPresetFeedback({
          message: source === 'auto'
            ? 'Connect your Helix and enable MIDI access to auto-switch presets.'
            : 'No MIDI outputs available. Check that your Helix is connected and MIDI is enabled.',
          variant: 'warning'
        })
        return false
      }
    }

    const ok = midiController.sendProgramChange(programNumber, 0, true)
    if (ok) {
      const labelText = label ? `${programNumber} (${label})` : `#${programNumber}`
      showPresetFeedback({
        message: source === 'auto'
          ? `🎛️ Auto-sent Helix preset ${labelText}`
          : `🎛️ Sent Helix preset ${labelText}`,
        variant: 'success'
      })
    } else {
      showPresetFeedback({
        message: 'Failed to send Helix preset. Verify the Helix output in MIDI settings.',
        variant: 'error'
      })
    }

    return ok
  }, [showPresetFeedback])

  // Auto-switch Helix preset when song changes
  useEffect(() => {
    if (!currentSong) return

    const presetNumber = currentSong.helixPresetNumber
    if (presetNumber === null || presetNumber === undefined) return

    // Check if we already sent this preset for this song (avoid duplicate sends)
    if (
      lastSentHelixPresetRef.current.songId === currentSong.id &&
      lastSentHelixPresetRef.current.presetNumber === presetNumber
    ) {
      return
    }

    // Send preset change
    handleSendHelixPreset(presetNumber, {
      source: 'auto',
      label: currentSong.helixPreset || undefined
    })

    // Track that we sent this preset
    lastSentHelixPresetRef.current = {
      songId: currentSong.id,
      presetNumber
    }
  }, [currentSong, handleSendHelixPreset])

  useEffect(() => {
    return () => {
      if (presetFeedbackTimeoutRef.current) {
        clearTimeout(presetFeedbackTimeoutRef.current)
        presetFeedbackTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!currentSong || !currentSong.id) {
      return
    }

    if (currentSong.helixPresetNumber === undefined || currentSong.helixPresetNumber === null) {
      lastSentHelixPresetRef.current = { songId: currentSong.id, presetNumber: null }
      return
    }

    if (
      lastSentHelixPresetRef.current.songId === currentSong.id &&
      lastSentHelixPresetRef.current.presetNumber === currentSong.helixPresetNumber
    ) {
      return
    }

    lastSentHelixPresetRef.current = {
      songId: currentSong.id,
      presetNumber: currentSong.helixPresetNumber
    }

    void handleSendHelixPreset(currentSong.helixPresetNumber, {
      source: 'auto',
      label: currentSong.helixPreset
    })
  }, [currentSong, handleSendHelixPreset])

  useKeyboardShortcuts({
    onToggleMetronome: toggle,
    onPreviousSong: previousSong,
    onNextSong: nextSong,
    onStopMetronome: handleStopMetronome,
    onIncreaseBPM: handleIncreaseBPM,
    onDecreaseBPM: handleDecreaseBPM,
    enabled: !isEditingBPM && !showKeyboardShortcuts // Disable when editing BPM or modal open
  })

  // Keyboard shortcut to show help modal
  useEffect(() => {
    const handleHelpKey = (e) => {
      if ((e.key === '?' || e.key === '/') && !isEditingBPM && 
          e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && 
          !e.target.isContentEditable) {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
      }
    }
    document.addEventListener('keydown', handleHelpKey)
    return () => document.removeEventListener('keydown', handleHelpKey)
  }, [isEditingBPM])

  useEffect(() => {
    if (ui.openRealtime && !showRealtimeSession) {
      setShowRealtimeSession(true)
    }
  }, [ui.openRealtime, showRealtimeSession])

  useEffect(() => {
    if (ui.openShortcuts && !showKeyboardShortcuts) {
      setShowKeyboardShortcuts(true)
    }
  }, [ui.openShortcuts, showKeyboardShortcuts])

  const toggleBeatAccent = (index) => {
    const newPattern = [...accentPattern]
    newPattern[index] = !newPattern[index]
    setAccentPatternState(newPattern)
    
    const hasAccents = newPattern.some(p => p)
    // Apply accent pattern immediately - it will take effect on the next beat
    // based on the current beat position, without restarting playback
    setMetronomeAccentPattern(hasAccents ? newPattern : null)
    
    if (currentSong) {
      setSongHasChanges(true)
    }
  }

  const clearAllAccents = () => {
    const pattern = new Array(timeSignature).fill(false)
    setAccentPatternState(pattern)
    // Apply immediately - no restart needed
    setMetronomeAccentPattern(null)
    if (currentSong) setSongHasChanges(true)
  }

  const setNoAccent = () => {
    const pattern = new Array(timeSignature).fill(false)
    setAccentPatternState(pattern)
    // Apply immediately - no restart needed
    setMetronomeAccentPattern(null) // null means no accents
    if (currentSong) setSongHasChanges(true)
  }

  const handleTimeSignatureChange = (sig) => {
    setTimeSignatureState(sig)
    setMetronomeTimeSignature(sig)
    updateBeatPatternSelector(sig)
    if (currentSong) setSongHasChanges(true)
    // Announce time signature change
    announce(`Time signature changed to ${sig} over 4`, 'polite')
  }

  const handlePolyrhythmChange = (value) => {
    if (value === '') {
      setPolyrhythm(null)
      setMetronomePolyrhythm(null)
      setShowCustomPolyrhythm(false)
    } else if (value === 'custom') {
      setShowCustomPolyrhythm(true)
    } else {
      setShowCustomPolyrhythm(false)
      const patterns = {
        '3:2': [1, 0, 0, 1, 0, 0],
        '4:3': [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        '5:4': [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0]
      }
      const pattern = patterns[value]
      if (pattern) {
        const poly = { pattern, name: value }
        setPolyrhythm(poly)
        setMetronomePolyrhythm(pattern, value)
      }
    }
    if (currentSong) setSongHasChanges(true)
  }

  const handleCustomPolyrhythm = (value) => {
    setCustomPolyrhythmValue(value)
    try {
      const pattern = value.split(',').map(v => v.trim() === '1' ? 1 : 0).filter(p => p === 0 || p === 1)
      if (pattern.length > 0) {
        const poly = { pattern, name: 'custom' }
        setPolyrhythm(poly)
        setMetronomePolyrhythm(pattern, 'custom')
      }
    } catch (e) {
      console.error('Invalid polyrhythm:', e)
    }
    if (currentSong) setSongHasChanges(true)
  }

  const tapTempo = () => {
    const now = Date.now()
    const newTapTimes = [...tapTimes.filter(time => now - time < 3000), now]
    setTapTimes(newTapTimes)
    
    // Require at least 3 taps for accuracy
    const MIN_TAPS = 3
    
    if (newTapTimes.length < MIN_TAPS) {
      // Show "keep tapping" message
      setTapTempoMessage(`Tap ${MIN_TAPS - newTapTimes.length} more time${MIN_TAPS - newTapTimes.length > 1 ? 's' : ''}...`)
      // Clear message after 2 seconds if user stops tapping
      setTimeout(() => {
        setTapTempoMessage('')
      }, 2000)
      return
    }
    
    // Calculate tempo from taps
    const intervals = []
    for (let i = 1; i < newTapTimes.length; i++) {
      intervals.push(newTapTimes[i] - newTapTimes[i - 1])
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const bpm = Math.round(60000 / avgInterval)
    const clampedBPM = Math.max(40, Math.min(300, bpm))
    
    // Update BPM
    updateBPM(clampedBPM)
    if (currentSong) setSongHasChanges(true)
    
    // Show success message briefly
    setTapTempoMessage(`Set to ${clampedBPM} BPM`)
    // Announce to screen readers
    announce(`Tap tempo set to ${clampedBPM} BPM`, 'assertive')
    setTimeout(() => {
      setTapTempoMessage('')
    }, 1500)
  }

  const handleReorderSetListSongs = useCallback(async (updatedSongs) => {
    if (!currentSetList) return

    const updatedIds = updatedSongs
      .map(song => song?.id)
      .filter(Boolean)

    if (!updatedIds.length) return

    const updatedSetList = { ...currentSetList, songIds: updatedIds }
    setCurrentSetList(updatedSetList)

    try {
      await updateSetList(currentSetList.id, { songIds: updatedIds })
    } catch (error) {
      console.error('Failed to persist reordered set list:', error)
      setCurrentSetList(currentSetList)
      showPresetFeedback({
        message: 'Set list order failed to save. Check the console for details.',
        variant: 'error',
        duration: 6000
      })
    }
  }, [currentSetList, updateSetList, showPresetFeedback])

  const saveSongChanges = () => {
    if (!currentSong) return
    
    const updates = {
      bpm,
      timeSignature,
      accentPattern: accentPattern.some(a => a) ? accentPattern : null,
      polyrhythm
    }
    
    updateSong(currentSong.id, updates)
    setCurrentSong({ ...currentSong, ...updates })
    setSongHasChanges(false)
    // Announce save to screen readers
    announce(`Song settings saved for ${currentSong.name}`, 'polite')
  }

  // Get current lyric
  const lyricsToShow = currentSong?.lyrics ? 
    currentSong.lyrics.slice(Math.max(0, currentLyricIndex - 2), Math.min(currentSong.lyrics.length, currentLyricIndex + 5)) :
    []

  return (
    <div role="main" aria-label="Performance View">
      <header className="performance-view-header">
        <h1>Performance</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto' }}>
          <MIDIStatusIndicator onClick={() => setShowMIDIControl(true)} />
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setShowKeyboardShortcuts(true)}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (press ?)"
          >
            ⌨️ Shortcuts
          </button>
        </div>
      </header>

      {showExampleSetListsModal && (
        <ExampleSetListsModal
          songs={songs}
          onImport={addSetList}
          onClose={() => setShowExampleSetListsModal(false)}
        />
      )}

      {/* Early ModeToggle removed in favor of later not-focusMode wrapper */}
      {false && <ModeToggle mode={performanceMode} onChange={setPerformanceMode} />}

      {false && (
        <div className="performance-mode active setup-mode-container">
          <div className="setlist-section" role="region" aria-label="Set list selection">
            <select 
              className="setlist-select"
              value={selectedSetListId}
              onChange={(e) => {
                setSelectedSetListId(e.target.value)
                if (e.target.value) loadSetList(e.target.value)
              }}
              aria-label="Select a set list"
              aria-describedby="setlist-help"
            >
              <option value="">Select a Set List</option>
              {setLists.map(setList => (
                <option key={setList.id} value={setList.id}>{setList.name}</option>
              ))}
            </select>
            <button 
              className="setlist-button" 
              onClick={() => {
                if (selectedSetListId) loadSetList(selectedSetListId)
              }}
              aria-label="Load selected set list"
              disabled={!selectedSetListId}
            >
              Load
            </button>
            {currentSetList && (
              <button 
                className="setlist-button" 
                onClick={() => {
                  if (confirm('Unload this set list?')) {
                    setCurrentSetList(null)
                    setCurrentSong(null)
                    setSelectedSetListId('')
                    setCurrentSongIndex(0)
                    localStorage.removeItem('currentSetListId')
                    localStorage.removeItem('currentSongIndex')
                  }
                }}
                aria-label={`Unload set list: ${currentSetList?.name || ''}`}
              >
                Unload
              </button>
            )}
            <span id="setlist-help" className="sr-only">Select and load a set list to begin performance</span>
          </div>
        </div>
      )}

      {false && (
        <LiveView 
          bpm={bpm}
          timeSignature={timeSignature}
          isPlaying={isPlaying}
          soundEnabled={soundEnabled}
          visualEnabled={visualEnabled}
          rotation={rotation}
          wheelRef={wheelRef}
          tapTempoMessage={tapTempoMessage}
          currentSong={currentSong}
          setListSongs={setListSongs}
          currentSongIndex={currentSongIndex}
          currentSetList={currentSetList}
          isBeatFlashing={isBeatFlashing}
          isAccentBeat={isAccentBeat}
          currentBeatInMeasure={currentBeatInMeasure}
          showBeatNumber={showBeatNumber}
          accentPattern={accentPattern}
          onToggleMetronome={toggle}
          onSoundToggle={setSoundEnabled}
          onVisualToggle={setVisualEnabled}
          onTimeSignatureChange={handleTimeSignatureChange}
          onTapTempo={tapTempo}
          onPreviousSong={previousSong}
          onNextSong={nextSong}
          onSelectSong={selectSong}
          soundPreset={soundPreset}
          subdivision={subdivision}
          countInBeats={countInBeats}
          accentVolume={accentVolume}
          regularVolume={regularVolume}
          subdivisionVolume={subdivisionVolume}
          masterVolume={masterVolume}
          onSoundPresetChange={setSoundPreset}
          onSubdivisionChange={setSubdivision}
          onCountInChange={setCountInBeats}
          onAccentVolumeChange={setAccentVolume}
          onRegularVolumeChange={setRegularVolume}
          onSubdivisionVolumeChange={setSubdivisionVolume}
          onMasterVolumeChange={setMasterVolume}
          onToggleAccent={(beatNumber) => toggleBeatAccent(beatNumber - 1)}
          presetFeedback={presetFeedback}
          onSendHelixPreset={handleSendHelixPreset}
          onReorderSetList={handleReorderSetListSongs}
        />
      )}

      {false && (
        <div className="performance-controls">
          {/* duplicate controls removed; canonical version exists later in not-focusMode */}
        </div>
      )}

      {false && performanceMode === 'setup' && (
        <div className="performance-mode active setup-mode-container">
          <div className="setlist-section" role="region" aria-label="Set list selection">
            <select 
              className="setlist-select"
              value={selectedSetListId}
              onChange={(e) => {
                setSelectedSetListId(e.target.value)
                if (e.target.value) loadSetList(e.target.value)
              }}
              aria-label="Select a set list"
              aria-describedby="setlist-help"
            >
              <option value="">Select a Set List</option>
              {setLists.map(setList => (
                <option key={setList.id} value={setList.id}>{setList.name}</option>
              ))}
            </select>
            <button 
              className="setlist-button" 
              onClick={() => {
                if (selectedSetListId) loadSetList(selectedSetListId)
              }}
              aria-label="Load selected set list"
              disabled={!selectedSetListId}
            >
              Load
            </button>
            {currentSetList && (
              <button 
                className="setlist-button" 
                onClick={() => {
                  if (confirm('Unload this set list?')) {
                    setCurrentSetList(null)
                    setCurrentSong(null)
                    setSelectedSetListId('')
                    setCurrentSongIndex(0)
                    localStorage.removeItem('currentSetListId')
                    localStorage.removeItem('currentSongIndex')
                  }
                }}
                aria-label={`Unload set list: ${currentSetList.name}`}
              >
                Unload
              </button>
            )}
            <span id="setlist-help" className="sr-only">Select and load a set list to begin performance</span>
          </div>

          <div className="song-list-section">
            <div className="song-list-header">
              <h3>Set List Songs</h3>
              {currentSetList && (
                <button 
                  className="setlist-button"
                  onClick={() => {
                    setCurrentView('setlists')
                  }}
                  title="Go to Set Lists to edit song order"
                >
                  ✏️ Edit Order
                </button>
              )}
            </div>
            {currentSetList && (
              <div className="song-list-tip">
                💡 Click a song to load it. To reorder songs, go to <strong>Set Lists</strong> view and edit this set list.
              </div>
            )}
            <div className="song-list-container" role="list" aria-label="Set list songs">
              {setListSongs.length === 0 ? (
                <div className="song-list-empty" role="status">
                  <p className="empty-message">
                    {currentSetList ? '📋 No songs in this set list' : '🎼 Load a set list to begin performing'}
                  </p>
                  {!currentSetList && (
                    <div className="empty-tips">
                      <p className="tip-title">💡 Quick Start Guide:</p>
                      <ul className="tip-list">
                        <li>
                          <button 
                            className="link-button"
                            onClick={() => setCurrentView('setlists')}
                            aria-label="Go to Set Lists view"
                          >
                            <strong>Create a Set List</strong>
                          </button> to organize your songs
                        </li>
                        <li>
                          <button 
                            className="link-button"
                            onClick={() => setCurrentView('songs')}
                            aria-label="Go to Songs library"
                          >
                            <strong>Add Songs</strong>
                          </button> to your library
                        </li>
                        <li>Import example songs to explore features</li>
                      </ul>
                      <div className="empty-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                        <div style={{ 
                          background: 'var(--surface-light)', 
                          padding: '20px', 
                          borderRadius: '12px',
                          border: '2px solid var(--primary-color)',
                          width: '100%',
                          maxWidth: '500px'
                        }}>
                          <h4 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>
                            🎵 Quick Start with Example Set Lists
                          </h4>
                          <p style={{ marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Try one of our pre-built set lists to see how it works!
                          </p>
                          <button
                            className="btn btn-primary"
                            onClick={() => setShowExampleSetListsModal(true)}
                            aria-label="Browse and import example set lists"
                            style={{ width: '100%' }}
                          >
                            📋 Browse Example Set Lists
                          </button>
                        </div>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setCurrentView('setlists')}
                          aria-label="Create your first set list"
                        >
                          ➕ Or Create Your Own Set List
                        </button>
                      </div>
                    </div>
                  )}
                  {currentSetList && (
                    <div className="empty-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => setCurrentView('setlists')}
                        aria-label="Add songs to this set list"
                      >
                        ➕ Add Songs to Set List
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                setListSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className={`song-item-card ${index === currentSongIndex ? 'active' : ''}`}
                    onClick={() => selectSong(index)}
                  >
                    <span className="song-number">{index + 1}</span>
                    <div className="song-name-display">
                      <span className="song-name">
                        {song.name}
                        {song.artist && <span className="song-artist-small"> ({song.artist})</span>}
                      </span>
                      <span className="song-bpm-display">{song.bpm} BPM</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {false && performanceMode === 'live' && (
        <LiveView 
          bpm={bpm}
          timeSignature={timeSignature}
          isPlaying={isPlaying}
          soundEnabled={soundEnabled}
          visualEnabled={visualEnabled}
          rotation={rotation}
          wheelRef={wheelRef}
          tapTempoMessage={tapTempoMessage}
          currentSong={currentSong}
          setListSongs={setListSongs}
          currentSongIndex={currentSongIndex}
          currentSetList={currentSetList}
          isBeatFlashing={isBeatFlashing}
          isAccentBeat={isAccentBeat}
          currentBeatInMeasure={currentBeatInMeasure}
          showBeatNumber={showBeatNumber}
          accentPattern={accentPattern}
          onToggleMetronome={toggle}
          onSoundToggle={setSoundEnabled}
          onVisualToggle={setVisualEnabled}
          onTimeSignatureChange={handleTimeSignatureChange}
          onTapTempo={tapTempo}
          onPreviousSong={previousSong}
          onNextSong={nextSong}
          onSelectSong={selectSong}
          soundPreset={soundPreset}
          subdivision={subdivision}
          countInBeats={countInBeats}
          accentVolume={accentVolume}
          regularVolume={regularVolume}
          subdivisionVolume={subdivisionVolume}
          masterVolume={masterVolume}
          onSoundPresetChange={setSoundPreset}
          onSubdivisionChange={setSubdivision}
          onCountInChange={setCountInBeats}
          onAccentVolumeChange={setAccentVolume}
          onRegularVolumeChange={setRegularVolume}
          onSubdivisionVolumeChange={setSubdivisionVolume}
          onMasterVolumeChange={setMasterVolume}
          onToggleAccent={(beatNumber) => toggleBeatAccent(beatNumber - 1)}
          presetFeedback={presetFeedback}
          onSendHelixPreset={handleSendHelixPreset}
          onReorderSetList={handleReorderSetListSongs}
        />
      )}

      {performanceMode === 'setup' && (
        <div className="performance-controls">
        <div className="current-song-display" role="region" aria-label="Current song information">
          <h2 aria-live="polite">{currentSong ? currentSong.name : '--'}</h2>
          <div className="bpm-display" role="group" aria-label="Tempo and time signature">
            {isEditingBPM ? (
              <input
                type="number"
                className="bpm-input"
                value={bpmInputValue}
                onChange={handleBPMInputChange}
                onBlur={handleBPMInputBlur}
                onKeyDown={handleBPMInputKeyDown}
                min="40"
                max="300"
                autoFocus
                aria-label="Edit tempo in BPM"
                aria-describedby="bpm-help"
                style={{
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  width: '80px',
                  textAlign: 'center',
                  background: 'var(--surface-light)',
                  border: '2px solid var(--primary-color)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
            ) : (
              <span 
                id="bpm-value" 
                onClick={handleBPMClick}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title="Click to edit tempo"
                role="button"
                tabIndex={0}
                aria-label={`Current tempo: ${bpm} BPM. Click to edit.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleBPMClick()
                  }
                }}
              >
                {bpm}
              </span>
            )}
            <span className="bpm-label" aria-hidden="true">BPM</span>
            <span className="time-signature-display" aria-label={`Time signature: ${timeSignature} over 4`}>{timeSignature}/4</span>
            <span id="bpm-help" className="sr-only">Enter a tempo between 40 and 300 BPM</span>
          </div>
        </div>

        <div className="tempo-wheel-container">
          <div className="tempo-wheel" ref={wheelRef}>
            <div 
              className="wheel-background"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className="wheel-mark wheel-mark-1"></div>
              <div className="wheel-mark wheel-mark-2"></div>
              <div className="wheel-mark wheel-mark-3"></div>
              <div className="wheel-mark wheel-mark-4"></div>
            </div>
            <div className="wheel-inner">
              <button 
                className={`wheel-play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggle()
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <span className="wheel-play-icon" style={{ display: isPlaying ? 'none' : 'inline' }}>▶</span>
                <span className="wheel-pause-icon" style={{ display: isPlaying ? 'inline' : 'none' }}>⏸</span>
                <div className="wheel-bpm-value">{bpm}</div>
                <div className="wheel-label">BPM</div>
              </button>
            </div>
            <div className="wheel-handle"></div>
          </div>
          <div className="tempo-wheel-controls">
            {setListSongs.length > 0 && (
              <div className="song-navigation-container" role="navigation" aria-label="Song navigation">
                <button 
                  className="btn btn-secondary" 
                  onClick={previousSong}
                  disabled={currentSongIndex === 0}
                  aria-label="Previous song in set list"
                  aria-disabled={currentSongIndex === 0}
                  style={{ 
                    opacity: currentSongIndex === 0 ? 0.5 : 1, 
                    cursor: currentSongIndex === 0 ? 'not-allowed' : 'pointer',
                    minWidth: '110px',
                    flexShrink: 0
                  }}
                >
                  ◀ Prev Song
                </button>
                <span 
                  className="current-song-title" 
                  title={currentSong ? `${currentSong.name}${currentSong.artist ? ` - ${currentSong.artist}` : ''}` : 'No Song'}
                  aria-label={`Current song: ${currentSong ? `${currentSong.name}${currentSong.artist ? ` by ${currentSong.artist}` : ''}` : 'No Song'}`}
                  role="status"
                  aria-live="polite"
                >
                  {currentSong ? `${currentSong.name}${currentSong.artist ? ` - ${currentSong.artist}` : ''}` : 'No Song'}
                </span>
                <button 
                  className="btn btn-secondary" 
                  onClick={nextSong}
                  disabled={!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1}
                  aria-label="Next song in set list"
                  aria-disabled={!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1}
                  style={{ 
                    opacity: (!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1) ? 0.5 : 1, 
                    cursor: (!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1) ? 'not-allowed' : 'pointer',
                    minWidth: '110px',
                    flexShrink: 0
                  }}
                >
                  Next Song ▶
                </button>
              </div>
            )}
            <div className="tap-tempo-container" role="region" aria-label="Tap tempo">
              <button 
                className="btn btn-secondary tap-tempo-btn" 
                onClick={tapTempo}
                aria-label="Tap to set tempo"
                aria-describedby="tap-tempo-help"
              >
                Tap Tempo
              </button>
              <span 
                className="tap-tempo-message" 
                role="status" 
                aria-live="polite"
                aria-atomic="true"
              >
                {tapTempoMessage || '\u00A0'}
              </span>
              <span id="tap-tempo-help" className="sr-only">Tap this button repeatedly at the desired tempo</span>
            </div>
          </div>
        </div>

        <div className="lyrics-container" role="region" aria-label="Song lyrics">
          <div className="lyrics-display">
            {!currentSong || !currentSong.lyrics || currentSong.lyrics.length === 0 ? (
              <div className="lyrics-empty-state">
                <p className="lyrics-placeholder">🎵 No lyrics for this song</p>
                <div className="empty-state-help">
                  <p className="help-text">Add synchronized lyrics to follow along with your performance</p>
                  <div className="help-actions">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => setCurrentView('songs')}
                      aria-label="Go to songs view to add lyrics"
                    >
                      ✏️ Edit Song
                    </button>
                  </div>
                  <details className="help-details">
                    <summary>How to add lyrics</summary>
                    <ol>
                      <li>Go to the <strong>Songs</strong> view</li>
                      <li>Click <strong>Edit</strong> on your song</li>
                      <li>Add synchronized lyrics in LRC format</li>
                      <li>Format: <code>[MM:SS.CC] Lyric text</code></li>
                    </ol>
                  </details>
                </div>
              </div>
            ) : lyricsToShow.length === 0 ? (
              <p className="lyrics-placeholder">Ready to start...</p>
            ) : (
              lyricsToShow.map((lyric) => {
                const actualIndex = currentSong.lyrics.indexOf(lyric)
                const isCurrent = actualIndex === currentLyricIndex
                return (
                  <p key={actualIndex} className={`lyric-line ${isCurrent ? 'current' : ''}`}>
                    {lyric.text}
                  </p>
                )
              })
            )}
          </div>
        </div>

        <div className="metronome-section" role="region" aria-label="Metronome controls and display">
          <div className="visual-beat" style={{ opacity: visualEnabled ? 1 : 0.3 }} role="img" aria-label="Visual beat indicator">
            <div 
              className={`beat-indicator ${isBeatFlashing ? 'active' : ''} ${isAccentBeat ? 'accent' : ''}`}
              aria-live="off"
            >
              {showBeatNumber && (
                isPlaying && currentBeatInMeasure > 0 ? (
                  <span style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 700, 
                    color: 'var(--text)',
                    textShadow: isBeatFlashing ? (isAccentBeat ? '0 0 10px rgba(255, 68, 68, 0.8)' : '0 0 10px rgba(76, 175, 80, 0.8)') : 'none',
                    transition: 'text-shadow 0.15s ease'
                  }}>
                    {currentBeatInMeasure}
                  </span>
                ) : (
                  <span style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 500, 
                    color: 'var(--text-secondary)',
                    opacity: 0.6
                  }}>
                    Ready
                  </span>
                )
              )}
            </div>
          </div>
          
          <div className="metronome-settings" role="group" aria-label="Metronome settings">
            <div className="settings-grid">
              <label className="settings-checkbox">
                <input 
                  type="checkbox" 
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  aria-label="Enable metronome sound"
                  aria-describedby="sound-setting-help"
                />
                <span className="settings-icon" aria-hidden="true">🔊</span>
                <span className="settings-label">Sound</span>
              </label>
              <span id="sound-setting-help" className="sr-only">Toggle audio clicks for the metronome</span>
              
              <label className="settings-checkbox">
                <input 
                  type="checkbox" 
                  checked={visualEnabled}
                  onChange={(e) => setVisualEnabled(e.target.checked)}
                  aria-label="Enable visual beat indicator"
                  aria-describedby="visual-setting-help"
                />
                <span className="settings-icon" aria-hidden="true">💡</span>
                <span className="settings-label">Visual Flash</span>
              </label>
              <span id="visual-setting-help" className="sr-only">Toggle visual flashing indicator for beats</span>
              
              {visualEnabled && (
                <>
                  <label className="settings-checkbox">
                    <input 
                      type="checkbox" 
                      checked={showBeatNumber}
                      onChange={(e) => setShowBeatNumber(e.target.checked)}
                      aria-label="Show beat numbers in visual indicator"
                      aria-describedby="beat-number-help"
                    />
                    <span className="settings-icon" aria-hidden="true">🔢</span>
                    <span className="settings-label">Show No.</span>
                  </label>
                  <span id="beat-number-help" className="sr-only">Display the current beat number in the visual indicator</span>
                </>
              )}
            </div>
          </div>
          
          <div className="controls">
            <div className="control-group">
              <label htmlFor="time-signature-select">Time Signature</label>
              <select 
                id="time-signature-select"
                value={timeSignature}
                onChange={(e) => handleTimeSignatureChange(parseInt(e.target.value))}
                aria-label="Select time signature"
                aria-describedby="time-sig-help"
              >
                <option value="2">2/4</option>
                <option value="3">3/4</option>
                <option value="4">4/4 (Common Time)</option>
                <option value="5">5/4</option>
                <option value="6">6/8</option>
                <option value="7">7/8</option>
                <option value="9">9/8</option>
                <option value="12">12/8</option>
              </select>
              <small id="time-sig-help">Beats per measure</small>
            </div>
            
            <div className="control-group" role="group" aria-labelledby="accent-pattern-label">
              <label id="accent-pattern-label">Accent Pattern</label>
              <div className="beat-pattern-selector" role="toolbar" aria-label="Accent pattern selector">
                {accentPattern.map((accented, index) => (
                  <button
                    key={index}
                    className={`beat-btn ${accented ? 'accented' : ''}`}
                    data-beat-index={index}
                    onClick={() => toggleBeatAccent(index)}
                    aria-label={`Beat ${index + 1}, ${accented ? 'accented' : 'not accented'}. Click to toggle.`}
                    aria-pressed={accented}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="accent-controls" role="group" aria-label="Accent pattern presets">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={clearAllAccents}
                  aria-label="Clear all accent patterns"
                >
                  Clear All
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={setNoAccent}
                  aria-label="Set no accent (uniform beats)"
                >
                  No Accent
                </button>
              </div>
              <small id="accent-pattern-help">Click beats to toggle accent on/off</small>
            </div>

            <details className="advanced-section">
              <summary>Advanced</summary>
              <PresetSelector
                timeSignature={timeSignature}
                currentPattern={accentPattern}
                onApplyPreset={(pattern, presetName) => {
                  setAccentPatternState(pattern)
                  setMetronomeAccentPattern(pattern)
                  if (currentSong) setSongHasChanges(true)
                  setPresetFeedback(`✅ Applied preset: ${presetName || 'Custom'}`)
                  setTimeout(() => setPresetFeedback(''), 2000)
                }}
                onSaveAsPreset={(pattern) => {}}
              />
              <div className="control-group">
                <label htmlFor="polyrhythm-select">Polyrhythm</label>
                <select 
                  id="polyrhythm-select"
                  value={polyrhythm?.name || ''}
                  onChange={(e) => handlePolyrhythmChange(e.target.value)}
                  aria-label="Select polyrhythm pattern"
                  aria-describedby="polyrhythm-help"
                >
                  <option value="">None (Standard)</option>
                  <option value="3:2">3:2 (Three over Two)</option>
                  <option value="4:3">4:3 (Four over Three)</option>
                  <option value="5:4">5:4 (Five over Four)</option>
                  <option value="custom">Custom Pattern</option>
                </select>
                <small id="polyrhythm-help">Advanced rhythm patterns for complex time signatures</small>
              </div>
              {showCustomPolyrhythm && (
                <div className="control-group">
                  <label htmlFor="custom-polyrhythm">Custom Pattern</label>
                  <input 
                    type="text" 
                    id="custom-polyrhythm" 
                    placeholder="e.g., 1,0,0,1,0,0" 
                    pattern="[01,]+"
                    value={customPolyrhythmValue}
                    onChange={(e) => handleCustomPolyrhythm(e.target.value)}
                  />
                  <small>1 = accent, 0 = normal. Example: 1,0,0,1,0,0 creates a 3:2 pattern</small>
                </div>
              )}
            </details>
            
            <div className="button-group" role="group" aria-label="Metronome and song controls">
              <button 
                className="btn btn-secondary" 
                onClick={previousSong}
                aria-label="Go to previous song"
                disabled={currentSongIndex === 0}
              >
                ◀ Prev
              </button>
              <button 
                className={`btn btn-primary ${isPlaying ? 'playing' : ''}`}
                onClick={toggle}
                aria-label={isPlaying ? 'Stop metronome' : 'Start metronome'}
                aria-pressed={isPlaying}
              >
                <span aria-hidden="true">{isPlaying ? '⏸' : '▶'}</span>
                <span>{isPlaying ? 'Stop' : 'Start'}</span>
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={nextSong}
                aria-label="Go to next song"
                disabled={!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1}
              >
                Next ▶
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowRealtimeSession(true)}
                aria-label="Open live session sync"
              >
                🔴 Live Sync
              </button>
            </div>
            
            {songHasChanges && currentSong && (
              <div className="save-changes-section">
                <div className="unsaved-indicator">
                  <span className="unsaved-dot"></span>
                  <span>Settings changed</span>
                </div>
                <button className="btn btn-primary save-btn" onClick={() => saveSongChanges()}>
                  <span>💾</span>
                  <span>Save Changes</span>
                </button>
                <button 
                  className="btn btn-secondary overwrite-btn" 
                  title="Hold to overwrite song"
                  onMouseDown={() => {
                    setTimeout(() => {
                      if (confirm('Overwrite saved song with current settings?')) {
                        saveSongChanges(true)
                      }
                    }, 1000)
                  }}
                >
                  <span>Hold to Overwrite</span>
                </button>
              </div>
            )}

            {/* Lyrics Panel */}
            {currentSong && (
              <div className="lyrics-section" style={{ marginTop: '20px' }}>
                <button 
                  className="btn btn-secondary btn-small lyrics-toggle"
                  onClick={() => {
                    const newValue = !showLyrics
                    setShowLyrics(newValue)
                    localStorage.setItem('performanceShowLyrics', newValue.toString())
                  }}
                  aria-expanded={showLyrics}
                  aria-controls="lyrics-panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: showLyrics ? '12px' : '0'
                  }}
                >
                  <span aria-hidden="true">{showLyrics ? '▼' : '▶'}</span>
                  <span>Lyrics</span>
                </button>
                
                {showLyrics && (
                  <div 
                    id="lyrics-panel"
                    className="lyrics-panel"
                    role="region"
                    aria-label="Song lyrics"
                    style={{
                      padding: '16px',
                      background: 'var(--surface-light)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}
                  >
                    {currentSong.lyrics ? (
                      <pre style={{
                        fontFamily: 'inherit',
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        color: 'var(--text-primary)'
                      }}>
                        {currentSong.lyrics}
                      </pre>
                    ) : (
                      <p style={{ 
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic',
                        margin: 0
                      }}>
                        No lyrics for this song. Add lyrics in the Songs view.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
      )}

      {/* Focus Mode - minimal mobile-first surface */}
      {focusMode && (
        <div className="performance-controls" style={{ textAlign: 'center' }}>
          <div className="current-song-display" role="region" aria-label="Current song information">
            <h2 aria-live="polite">{currentSong ? currentSong.name : '--'}</h2>
            <div className="bpm-display" role="group" aria-label="Tempo and time signature">
              <span id="bpm-value" title="Click to edit tempo" role="button" tabIndex={0} aria-label={`Current tempo: ${bpm} BPM.`}>{bpm}</span>
              <span className="bpm-label" aria-hidden="true">BPM</span>
              <span className="time-signature-display" aria-label={`Time signature: ${timeSignature} over 4`}>{timeSignature}/4</span>
            </div>
          </div>
          <div className="visual-beat" role="img" aria-label="Visual beat indicator" style={{ opacity: visualEnabled ? 1 : 0.3 }}>
            <div className={`beat-indicator ${isBeatFlashing ? 'active' : ''} ${isAccentBeat ? 'accent' : ''}`} aria-live="off">
              {showBeatNumber && (
                isPlaying && currentBeatInMeasure > 0 ? (
                  <span style={{ fontSize: '3rem', fontWeight: 700 }}>{currentBeatInMeasure}</span>
                ) : (
                  <span style={{ fontSize: '1.2rem', fontWeight: 500, opacity: 0.6 }}>Ready</span>
                )
              )}
            </div>
          </div>
          <div className="song-navigation-container" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={previousSong} disabled={currentSongIndex === 0}>◀ Prev</button>
            <button className={`btn btn-primary ${isPlaying ? 'playing' : ''}`} onClick={toggle} aria-pressed={isPlaying}>{isPlaying ? '⏸ Stop' : '▶ Start'}</button>
            <button className="btn btn-secondary" onClick={nextSong} disabled={!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1}>Next ▶</button>
          </div>
        </div>
      )}

      {/* Setup Mode stack (hidden in focus mode) */}
      {!focusMode && (
        <>
          <ModeToggle mode={performanceMode} onChange={setPerformanceMode} />

          {performanceMode === 'setup' && (
            <div className="performance-mode active setup-mode-container">
              <div className="setlist-section" role="region" aria-label="Set list selection">
                <select 
                  className="setlist-select"
                  value={selectedSetListId}
                  onChange={(e) => {
                    setSelectedSetListId(e.target.value)
                    if (e.target.value) loadSetList(e.target.value)
                  }}
                  aria-label="Select a set list"
                  aria-describedby="setlist-help"
                >
                  <option value="">Select a Set List</option>
                  {setLists.map(setList => (
                    <option key={setList.id} value={setList.id}>{setList.name}</option>
                  ))}
                </select>
                <button 
                  className="setlist-button" 
                  onClick={() => {
                    if (selectedSetListId) loadSetList(selectedSetListId)
                  }}
                  aria-label="Load selected set list"
                  disabled={!selectedSetListId}
                >
                  Load
                </button>
                {currentSetList && (
                  <button 
                    className="setlist-button" 
                    onClick={() => {
                      if (confirm('Unload this set list?')) {
                        setCurrentSetList(null)
                        setCurrentSong(null)
                        setSelectedSetListId('')
                        setCurrentSongIndex(0)
                        localStorage.removeItem('currentSetListId')
                        localStorage.removeItem('currentSongIndex')
                      }
                    }}
                    aria-label={`Unload set list: ${currentSetList.name}`}
                  >
                    Unload
                  </button>
                )}
                <span id="setlist-help" className="sr-only">Select and load a set list to begin performance</span>
              </div>

              <div className="song-list-section">
                <div className="song-list-header">
                  <h3>Set List Songs</h3>
                  {currentSetList && (
                    <button 
                      className="setlist-button"
                      onClick={() => {
                        setCurrentView('setlists')
                      }}
                      title="Go to Set Lists to edit song order"
                    >
                      ✏️ Edit Order
                    </button>
                  )}
                </div>
                {currentSetList && (
                  <div className="song-list-tip">
                    💡 Click a song to load it. To reorder songs, go to <strong>Set Lists</strong> view and edit this set list.
                  </div>
                )}
                <div className="song-list-container" role="list" aria-label="Set list songs">
                  {setListSongs.length === 0 ? (
                    <div className="song-list-empty" role="status">
                      <p className="empty-message">
                        {currentSetList ? '📋 No songs in this set list' : '🎼 Load a set list to begin performing'}
                      </p>
                      {!currentSetList && (
                        <div className="empty-tips">
                          <p className="tip-title">💡 Quick Start Guide:</p>
                          <ul className="tip-list">
                            <li>
                              <button 
                                className="link-button"
                                onClick={() => setCurrentView('setlists')}
                                aria-label="Go to Set Lists view"
                              >
                                <strong>Create a Set List</strong>
                              </button> to organize your songs
                            </li>
                            <li>
                              <button 
                                className="link-button"
                                onClick={() => setCurrentView('songs')}
                                aria-label="Go to Songs library"
                              >
                                <strong>Add Songs</strong>
                              </button> to your library
                            </li>
                            <li>Import example songs to explore features</li>
                          </ul>
                          <div className="empty-actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                            <div style={{ 
                              background: 'var(--surface-light)', 
                              padding: '20px', 
                              borderRadius: '12px',
                              border: '2px solid var(--primary-color)',
                              width: '100%',
                              maxWidth: '500px'
                            }}>
                              <h4 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>
                                🎵 Quick Start with Example Set Lists
                              </h4>
                              <p style={{ marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Try one of our pre-built set lists to see how it works!
                              </p>
                              <button
                                className="btn btn-primary"
                                onClick={() => setShowExampleSetListsModal(true)}
                                aria-label="Browse and import example set lists"
                                style={{ width: '100%' }}
                              >
                                📋 Browse Example Set Lists
                              </button>
                            </div>
                            <button
                              className="btn btn-secondary"
                              onClick={() => setCurrentView('setlists')}
                              aria-label="Create your first set list"
                            >
                              ➕ Or Create Your Own Set List
                            </button>
                          </div>
                        </div>
                      )}
                      {currentSetList && (
                        <div className="empty-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => setCurrentView('setlists')}
                            aria-label="Add songs to this set list"
                          >
                            ➕ Add Songs to Set List
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    setListSongs.map((song, index) => (
                      <div
                        key={song.id}
                        className={`song-item-card ${index === currentSongIndex ? 'active' : ''}`}
                        onClick={() => selectSong(index)}
                      >
                        <span className="song-number">{index + 1}</span>
                        <div className="song-name-display">
                          <span className="song-name">
                            {song.name}
                            {song.artist && <span className="song-artist-small"> ({song.artist})</span>}
                          </span>
                          <span className="song-bpm-display">{song.bpm} BPM</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {performanceMode === 'live' && (
            <LiveView 
              bpm={bpm}
              timeSignature={timeSignature}
              isPlaying={isPlaying}
              soundEnabled={soundEnabled}
              visualEnabled={visualEnabled}
              rotation={rotation}
              wheelRef={wheelRef}
              tapTempoMessage={tapTempoMessage}
              currentSong={currentSong}
              setListSongs={setListSongs}
              currentSongIndex={currentSongIndex}
              currentSetList={currentSetList}
              isBeatFlashing={isBeatFlashing}
              isAccentBeat={isAccentBeat}
              currentBeatInMeasure={currentBeatInMeasure}
              showBeatNumber={showBeatNumber}
              accentPattern={accentPattern}
              onToggleMetronome={toggle}
              onSoundToggle={setSoundEnabled}
              onVisualToggle={setVisualEnabled}
              onTimeSignatureChange={handleTimeSignatureChange}
              onTapTempo={tapTempo}
              onPreviousSong={previousSong}
              onNextSong={nextSong}
              onSelectSong={selectSong}
              soundPreset={soundPreset}
              subdivision={subdivision}
              countInBeats={countInBeats}
              accentVolume={accentVolume}
              regularVolume={regularVolume}
              subdivisionVolume={subdivisionVolume}
              masterVolume={masterVolume}
              onSoundPresetChange={setSoundPreset}
              onSubdivisionChange={setSubdivision}
              onCountInChange={setCountInBeats}
              onAccentVolumeChange={setAccentVolume}
              onRegularVolumeChange={setRegularVolume}
              onSubdivisionVolumeChange={setSubdivisionVolume}
              onMasterVolumeChange={setMasterVolume}
              onToggleAccent={(beatNumber) => toggleBeatAccent(beatNumber - 1)}
              presetFeedback={presetFeedback}
              onSendHelixPreset={handleSendHelixPreset}
              onReorderSetList={handleReorderSetListSongs}
            />
          )}

          {performanceMode === 'setup' && (
            <div className="performance-controls">
            <div className="current-song-display" role="region" aria-label="Current song information">
              <h2 aria-live="polite">{currentSong ? currentSong.name : '--'}</h2>
              <div className="bpm-display" role="group" aria-label="Tempo and time signature">
                {isEditingBPM ? (
                  <input
                    type="number"
                    className="bpm-input"
                    value={bpmInputValue}
                    onChange={handleBPMInputChange}
                    onBlur={handleBPMInputBlur}
                    onKeyDown={handleBPMInputKeyDown}
                    min="40"
                    max="300"
                    autoFocus
                    aria-label="Edit tempo in BPM"
                    aria-describedby="bpm-help"
                    style={{
                      fontSize: 'inherit',
                      fontWeight: 'inherit',
                      width: '80px',
                      textAlign: 'center',
                      background: 'var(--surface-light)',
                      border: '2px solid var(--primary-color)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      color: 'var(--text)',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <span 
                    id="bpm-value" 
                    onClick={handleBPMClick}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to edit tempo"
                    role="button"
                    tabIndex={0}
                    aria-label={`Current tempo: ${bpm} BPM. Click to edit.`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleBPMClick()
                      }
                    }}
                  >
                    {bpm}
                  </span>
                )}
                <span className="bpm-label" aria-hidden="true">BPM</span>
                <span className="time-signature-display" aria-label={`Time signature: ${timeSignature} over 4`}>{timeSignature}/4</span>
                <span id="bpm-help" className="sr-only">Enter a tempo between 40 and 300 BPM</span>
              </div>
            </div>

            <div className="tempo-wheel-container">
              <div className="tempo-wheel" ref={wheelRef}>
                <div 
                  className="wheel-background"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="wheel-mark wheel-mark-1"></div>
                  <div className="wheel-mark wheel-mark-2"></div>
                  <div className="wheel-mark wheel-mark-3"></div>
                  <div className="wheel-mark wheel-mark-4"></div>
                </div>
                <div className="wheel-inner">
                  <button 
                    className={`wheel-play-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggle()
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <span className="wheel-play-icon" style={{ display: isPlaying ? 'none' : 'inline' }}>▶</span>
                    <span className="wheel-pause-icon" style={{ display: isPlaying ? 'inline' : 'none' }}>⏸</span>
                    <div className="wheel-bpm-value">{bpm}</div>
                    <div className="wheel-label">BPM</div>
                  </button>
                </div>
                <div className="wheel-handle"></div>
              </div>
              <div className="tempo-wheel-controls">
                {setListSongs.length > 0 && (
                  <div className="song-navigation-container" role="navigation" aria-label="Song navigation">
                    <button 
                      className="btn btn-secondary" 
                      onClick={previousSong}
                      disabled={currentSongIndex === 0}
                      aria-label="Previous song in set list"
                      aria-disabled={currentSongIndex === 0}
                      style={{ 
                        opacity: currentSongIndex === 0 ? 0.5 : 1, 
                        cursor: currentSongIndex === 0 ? 'not-allowed' : 'pointer',
                        minWidth: '110px',
                        flexShrink: 0
                      }}
                    >
                      ◀ Prev Song
                    </button>
                    <span 
                      className="current-song-title" 
                      title={currentSong ? `${currentSong.name}${currentSong.artist ? ` - ${currentSong.artist}` : ''}` : 'No Song'}
                      aria-label={`Current song: ${currentSong ? `${currentSong.name}${currentSong.artist ? ` by ${currentSong.artist}` : ''}` : 'No Song'}`}
                      role="status"
                      aria-live="polite"
                    >
                      {currentSong ? `${currentSong.name}${currentSong.artist ? ` - ${currentSong.artist}` : ''}` : 'No Song'}
                    </span>
                    <button 
                      className="btn btn-secondary" 
                      onClick={nextSong}
                      disabled={!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1}
                      aria-label="Next song in set list"
                      aria-disabled={!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1}
                      style={{ 
                        opacity: (!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1) ? 0.5 : 1, 
                        cursor: (!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1) ? 'not-allowed' : 'pointer',
                        minWidth: '110px',
                        flexShrink: 0
                      }}
                    >
                      Next Song ▶
                    </button>
                  </div>
                )}
                <div className="tap-tempo-container" role="region" aria-label="Tap tempo">
                  <button 
                    className="btn btn-secondary tap-tempo-btn" 
                    onClick={tapTempo}
                    aria-label="Tap to set tempo"
                    aria-describedby="tap-tempo-help"
                  >
                    Tap Tempo
                  </button>
                  <span 
                    className="tap-tempo-message" 
                    role="status" 
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {tapTempoMessage || '\u00A0'}
                  </span>
                  <span id="tap-tempo-help" className="sr-only">Tap this button repeatedly at the desired tempo</span>
                </div>
              </div>
            </div>

            <div className="lyrics-container" role="region" aria-label="Song lyrics">
              <div className="lyrics-display">
                {!currentSong || !currentSong.lyrics || currentSong.lyrics.length === 0 ? (
                  <div className="lyrics-empty-state">
                    <p className="lyrics-placeholder">🎵 No lyrics for this song</p>
                    <div className="empty-state-help">
                      <p className="help-text">Add synchronized lyrics to follow along with your performance</p>
                      <div className="help-actions">
                        <button 
                          className="btn btn-secondary btn-small"
                          onClick={() => setCurrentView('songs')}
                          aria-label="Go to songs view to add lyrics"
                        >
                          ✏️ Edit Song
                        </button>
                      </div>
                      <details className="help-details">
                        <summary>How to add lyrics</summary>
                        <ol>
                          <li>Go to the <strong>Songs</strong> view</li>
                          <li>Click <strong>Edit</strong> on your song</li>
                          <li>Add synchronized lyrics in LRC format</li>
                          <li>Format: <code>[MM:SS.CC] Lyric text</code></li>
                        </ol>
                      </details>
                    </div>
                  </div>
                ) : lyricsToShow.length === 0 ? (
                  <p className="lyrics-placeholder">Ready to start...</p>
                ) : (
                  lyricsToShow.map((lyric) => {
                    const actualIndex = currentSong.lyrics.indexOf(lyric)
                    const isCurrent = actualIndex === currentLyricIndex
                    return (
                      <p key={actualIndex} className={`lyric-line ${isCurrent ? 'current' : ''}`}>
                        {lyric.text}
                      </p>
                    )
                  })
                )}
              </div>
            </div>

            <div className="metronome-section" role="region" aria-label="Metronome controls and display">
              <div className="visual-beat" style={{ opacity: visualEnabled ? 1 : 0.3 }} role="img" aria-label="Visual beat indicator">
                <div 
                  className={`beat-indicator ${isBeatFlashing ? 'active' : ''} ${isAccentBeat ? 'accent' : ''}`}
                  aria-live="off"
                >
                  {showBeatNumber && (
                    isPlaying && currentBeatInMeasure > 0 ? (
                      <span style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: 700, 
                        color: 'var(--text)',
                        textShadow: isBeatFlashing ? (isAccentBeat ? '0 0 10px rgba(255, 68, 68, 0.8)' : '0 0 10px rgba(76, 175, 80, 0.8)') : 'none',
                        transition: 'text-shadow 0.15s ease'
                      }}>
                        {currentBeatInMeasure}
                      </span>
                    ) : (
                      <span style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 500, 
                        color: 'var(--text-secondary)',
                        opacity: 0.6
                      }}>
                        Ready
                      </span>
                    )
                  )}
                </div>
              </div>
              
              <div className="metronome-settings" role="group" aria-label="Metronome settings">
                <div className="settings-grid">
                  <label className="settings-checkbox">
                    <input 
                      type="checkbox" 
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      aria-label="Enable metronome sound"
                      aria-describedby="sound-setting-help"
                    />
                    <span className="settings-icon" aria-hidden="true">🔊</span>
                    <span className="settings-label">Sound</span>
                  </label>
                  <span id="sound-setting-help" className="sr-only">Toggle audio clicks for the metronome</span>
                  
                  <label className="settings-checkbox">
                    <input 
                      type="checkbox" 
                      checked={visualEnabled}
                      onChange={(e) => setVisualEnabled(e.target.checked)}
                      aria-label="Enable visual beat indicator"
                      aria-describedby="visual-setting-help"
                    />
                    <span className="settings-icon" aria-hidden="true">💡</span>
                    <span className="settings-label">Visual Flash</span>
                  </label>
                  <span id="visual-setting-help" className="sr-only">Toggle visual flashing indicator for beats</span>
                  
                  {visualEnabled && (
                    <>
                      <label className="settings-checkbox">
                        <input 
                          type="checkbox" 
                          checked={showBeatNumber}
                          onChange={(e) => setShowBeatNumber(e.target.checked)}
                          aria-label="Show beat numbers in visual indicator"
                          aria-describedby="beat-number-help"
                        />
                        <span className="settings-icon" aria-hidden="true">🔢</span>
                        <span className="settings-label">Show No.</span>
                      </label>
                      <span id="beat-number-help" className="sr-only">Display the current beat number in the visual indicator</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="controls">
                <div className="control-group">
                  <label htmlFor="time-signature-select">Time Signature</label>
                  <select 
                    id="time-signature-select"
                    value={timeSignature}
                    onChange={(e) => handleTimeSignatureChange(parseInt(e.target.value))}
                    aria-label="Select time signature"
                    aria-describedby="time-sig-help"
                  >
                    <option value="2">2/4</option>
                    <option value="3">3/4</option>
                    <option value="4">4/4 (Common Time)</option>
                    <option value="5">5/4</option>
                    <option value="6">6/8</option>
                    <option value="7">7/8</option>
                    <option value="9">9/8</option>
                    <option value="12">12/8</option>
                  </select>
                  <small id="time-sig-help">Beats per measure</small>
                </div>
                
                <div className="control-group" role="group" aria-labelledby="accent-pattern-label">
                  <label id="accent-pattern-label">Accent Pattern</label>
                  <div className="beat-pattern-selector" role="toolbar" aria-label="Accent pattern selector">
                    {accentPattern.map((accented, index) => (
                      <button
                        key={index}
                        className={`beat-btn ${accented ? 'accented' : ''}`}
                        data-beat-index={index}
                        onClick={() => toggleBeatAccent(index)}
                        aria-label={`Beat ${index + 1}, ${accented ? 'accented' : 'not accented'}. Click to toggle.`}
                        aria-pressed={accented}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <div className="accent-controls" role="group" aria-label="Accent pattern presets">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={clearAllAccents}
                      aria-label="Clear all accent patterns"
                    >
                      Clear All
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={setNoAccent}
                      aria-label="Set no accent (uniform beats)"
                    >
                      No Accent
                    </button>
                  </div>
                  <small id="accent-pattern-help">Click beats to toggle accent on/off</small>
                </div>

                <details className="advanced-section">
                  <summary>Advanced</summary>
                  <PresetSelector
                    timeSignature={timeSignature}
                    currentPattern={accentPattern}
                    onApplyPreset={(pattern, presetName) => {
                      setAccentPatternState(pattern)
                      setMetronomeAccentPattern(pattern)
                      if (currentSong) setSongHasChanges(true)
                      setPresetFeedback(`✅ Applied preset: ${presetName || 'Custom'}`)
                      setTimeout(() => setPresetFeedback(''), 2000)
                    }}
                    onSaveAsPreset={(pattern) => {}}
                  />
                  <div className="control-group">
                    <label htmlFor="polyrhythm-select">Polyrhythm</label>
                    <select 
                      id="polyrhythm-select"
                      value={polyrhythm?.name || ''}
                      onChange={(e) => handlePolyrhythmChange(e.target.value)}
                      aria-label="Select polyrhythm pattern"
                      aria-describedby="polyrhythm-help"
                    >
                      <option value="">None (Standard)</option>
                      <option value="3:2">3:2 (Three over Two)</option>
                      <option value="4:3">4:3 (Four over Three)</option>
                      <option value="5:4">5:4 (Five over Four)</option>
                      <option value="custom">Custom Pattern</option>
                    </select>
                    <small id="polyrhythm-help">Advanced rhythm patterns for complex time signatures</small>
                  </div>
                  {showCustomPolyrhythm && (
                    <div className="control-group">
                      <label htmlFor="custom-polyrhythm">Custom Pattern</label>
                      <input 
                        type="text" 
                        id="custom-polyrhythm" 
                        placeholder="e.g., 1,0,0,1,0,0" 
                        pattern="[01,]+"
                        value={customPolyrhythmValue}
                        onChange={(e) => handleCustomPolyrhythm(e.target.value)}
                      />
                      <small>1 = accent, 0 = normal. Example: 1,0,0,1,0,0 creates a 3:2 pattern</small>
                    </div>
                  )}
                </details>
                
                <div className="button-group" role="group" aria-label="Metronome and song controls">
                  <button 
                    className="btn btn-secondary" 
                    onClick={previousSong}
                    aria-label="Go to previous song"
                    disabled={currentSongIndex === 0}
                  >
                    ◀ Prev
                  </button>
                  <button 
                    className={`btn btn-primary ${isPlaying ? 'playing' : ''}`}
                    onClick={toggle}
                    aria-label={isPlaying ? 'Stop metronome' : 'Start metronome'}
                    aria-pressed={isPlaying}
                  >
                    <span aria-hidden="true">{isPlaying ? '⏸' : '▶'}</span>
                    <span>{isPlaying ? 'Stop' : 'Start'}</span>
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={nextSong}
                    aria-label="Go to next song"
                    disabled={!currentSetList || !currentSetList.songIds || currentSongIndex >= currentSetList.songIds.length - 1}
                  >
                    Next ▶
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowRealtimeSession(true)}
                    aria-label="Open live session sync"
                  >
                    🔴 Live Sync
                  </button>
                </div>
                
                {songHasChanges && currentSong && (
                  <div className="save-changes-section">
                    <div className="unsaved-indicator">
                      <span className="unsaved-dot"></span>
                      <span>Settings changed</span>
                    </div>
                    <button className="btn btn-primary save-btn" onClick={() => saveSongChanges()}>
                      <span>💾</span>
                      <span>Save Changes</span>
                    </button>
                    <button 
                      className="btn btn-secondary overwrite-btn" 
                      title="Hold to overwrite song"
                      onMouseDown={() => {
                        setTimeout(() => {
                          if (confirm('Overwrite saved song with current settings?')) {
                            saveSongChanges(true)
                          }
                        }, 1000)
                      }}
                    >
                      <span>Hold to Overwrite</span>
                    </button>
                  </div>
                )}

                {/* Lyrics Panel */}
                {currentSong && (
                  <div className="lyrics-section" style={{ marginTop: '20px' }}>
                    <button 
                      className="btn btn-secondary btn-small lyrics-toggle"
                      onClick={() => {
                        const newValue = !showLyrics
                        setShowLyrics(newValue)
                        localStorage.setItem('performanceShowLyrics', newValue.toString())
                      }}
                      aria-expanded={showLyrics}
                      aria-controls="lyrics-panel"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: showLyrics ? '12px' : '0'
                      }}
                    >
                      <span aria-hidden="true">{showLyrics ? '▼' : '▶'}</span>
                      <span>Lyrics</span>
                    </button>
                    
                    {showLyrics && (
                      <div 
                        id="lyrics-panel"
                        className="lyrics-panel"
                        role="region"
                        aria-label="Song lyrics"
                        style={{
                          padding: '16px',
                          background: 'var(--surface-light)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}
                      >
                        {currentSong.lyrics ? (
                          <pre style={{
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            color: 'var(--text-primary)'
                          }}>
                            {currentSong.lyrics}
                          </pre>
                        ) : (
                          <p style={{ 
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic',
                            margin: 0
                          }}>
                            No lyrics for this song. Add lyrics in the Songs view.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
          )}

          {showRealtimeSession && (
            <RealtimeSessionModal 
              onClose={() => { setShowRealtimeSession(false); dispatchUi({ type: 'CLOSE_REALTIME' }) }} 
              metronomeHook={metronomeHook}
            />
          )}

          {showKeyboardShortcuts && (
            <KeyboardShortcutsModal onClose={() => { setShowKeyboardShortcuts(false); dispatchUi({ type: 'CLOSE_SHORTCUTS' }) }} />
          )}

          {showMIDIControl && (
            <MIDIControlModal
              currentSong={currentSong}
              onClose={() => setShowMIDIControl(false)}
            />
          )}
        </>
      )}

      {/* Mobile sticky status + FAB */}
      <div className="mini-status" role="status" aria-live="polite">
        <span>{bpm} BPM</span>
        <span>•</span>
        <span>{isPlaying ? 'Playing' : 'Stopped'}</span>
      </div>
      <button
        className={`fab-play ${isPlaying ? 'playing' : ''}`}
        onClick={toggle}
        aria-label={isPlaying ? 'Stop metronome' : 'Start metronome'}
        aria-pressed={isPlaying}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  )
}
