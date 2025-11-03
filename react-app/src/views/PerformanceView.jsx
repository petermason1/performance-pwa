import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '../hooks/useApp'
import { useTempoWheel } from '../hooks/useTempoWheel'
import { midiController } from '../midi.js'

export default function PerformanceView() {
  const { setLists, getSetList, getSong, updateSong, metronome: metronomeHook, setCurrentView } = useApp()
  const [currentSetList, setCurrentSetList] = useState(null)
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [currentSong, setCurrentSong] = useState(null)
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
    metronome
  } = metronomeHook
  
  // Get songs from current set list
  const setListSongs = useMemo(() => {
    return currentSetList ? 
      currentSetList.songIds
        .map(id => getSong(id))
        .filter(s => s !== undefined) : []
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
    if (accentPattern.length !== timeSignature) {
      const newPattern = new Array(timeSignature).fill(false)
      setAccentPatternState(newPattern)
      setMetronomeAccentPattern(null) // null = no accent (uniform clicks)
    }
  }, [timeSignature, accentPattern.length, setMetronomeAccentPattern])
  
  // Set no accent by default on initial load
  useEffect(() => {
    if (accentPattern.length === 0 && timeSignature > 0) {
      const newPattern = new Array(timeSignature).fill(false)
      setAccentPatternState(newPattern)
      setMetronomeAccentPattern(null) // No accent by default
    }
  }, [accentPattern.length, timeSignature, setMetronomeAccentPattern]) // Run when needed

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
      
      // Send Helix preset change if configured
      if (currentSong.helixPresetNumber !== undefined && currentSong.helixPresetNumber !== null) {
        midiController.sendProgramChange(currentSong.helixPresetNumber, 0, true)
      }
    }
  }, [currentSong, setMetronomeTimeSignature, setMetronomeAccentPattern, setMetronomePolyrhythm, metronome, updateBPM, updateBeatPatternSelector, timeSignature])

  // Set up metronome callbacks
  useEffect(() => {
    if (!metronome) return
    
    metronome.setOnBeatCallback((beatInMeasure, isAccent) => {
      // Update visual beat indicator - beatInMeasure is 0-indexed, convert to 1-indexed
      const beatNumber = beatInMeasure + 1
      setCurrentBeatInMeasure(beatNumber)
      
      // Flash the visual indicator
      if (visualEnabled) {
        setIsBeatFlashing(true)
        setIsAccentBeat(isAccent)
        // Reset flash after animation
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
  }, [metronome, currentSong, visualEnabled])
  
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

  const loadSetList = (setListId) => {
    const setList = getSetList(setListId)
    if (!setList) return
    
    // Save to localStorage so it persists across view changes
    localStorage.setItem('currentSetListId', setListId)
    setSelectedSetListId(setListId)
    
    setCurrentSetList(setList)
    setCurrentSongIndex(0)
    setSongHasChanges(false)
    
    if (setList.songIds.length > 0) {
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
        if (setList.songIds.length > 0) {
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
      
      // If metronome is not playing, start it
      if (!isPlaying) {
        toggle()
      }
      // If metronome is playing, it will automatically update tempo via useEffect
    }
  }, [currentSetList, getSong, isPlaying, currentSongIndex, toggle])

  const nextSong = useCallback(() => {
    if (!currentSetList || currentSetList.songIds.length === 0) return
    if (currentSongIndex < currentSetList.songIds.length - 1) {
      selectSong(currentSongIndex + 1)
    }
  }, [currentSongIndex, currentSetList, selectSong])

  const previousSong = useCallback(() => {
    if (currentSongIndex > 0) {
      selectSong(currentSongIndex - 1)
    }
  }, [currentSongIndex, selectSong])

  // Keyboard shortcuts - moved after function definitions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        toggle()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        previousSong()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        nextSong()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggle, previousSong, nextSong])

  const toggleBeatAccent = (index) => {
    const newPattern = [...accentPattern]
    newPattern[index] = !newPattern[index]
    setAccentPatternState(newPattern)
    
    if (newPattern.some(p => p)) {
      setMetronomeAccentPattern(newPattern)
    } else {
      setMetronomeAccentPattern(null)
    }
    
    if (currentSong) {
      setSongHasChanges(true)
    }
  }

  const clearAllAccents = () => {
    const pattern = new Array(timeSignature).fill(false)
    setAccentPatternState(pattern)
    setMetronomeAccentPattern(null)
    if (currentSong) setSongHasChanges(true)
  }

  const setNoAccent = () => {
    const pattern = new Array(timeSignature).fill(false)
    setAccentPatternState(pattern)
    setMetronomeAccentPattern(null) // null means no accents
    if (currentSong) setSongHasChanges(true)
  }

  const handleTimeSignatureChange = (sig) => {
    setTimeSignatureState(sig)
    setMetronomeTimeSignature(sig)
    updateBeatPatternSelector(sig)
    if (currentSong) setSongHasChanges(true)
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
    setTimeout(() => {
      setTapTempoMessage('')
    }, 1500)
  }

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
  }

  // Get current lyric
  const lyricsToShow = currentSong?.lyrics ? 
    currentSong.lyrics.slice(Math.max(0, currentLyricIndex - 2), Math.min(currentSong.lyrics.length, currentLyricIndex + 5)) :
    []

  return (
    <div>
      <header>
        <h1>Performance</h1>
      </header>

      <div className="performance-mode-selector">
        <button 
          className={`mode-btn ${performanceMode === 'setup' ? 'active' : ''}`}
          onClick={() => setPerformanceMode('setup')}
        >
          ⚙️ Setup
        </button>
        <button 
          className={`mode-btn ${performanceMode === 'live' ? 'active' : ''}`}
          onClick={() => setPerformanceMode('live')}
        >
          🎤 Live
        </button>
      </div>

      {performanceMode === 'setup' && (
        <div className="performance-mode active">
          <div className="current-setlist-section">
            <select 
              className="setlist-select"
              value={selectedSetListId}
              onChange={(e) => {
                setSelectedSetListId(e.target.value)
                if (e.target.value) loadSetList(e.target.value)
              }}
            >
              <option value="">Select a Set List</option>
              {setLists.map(setList => (
                <option key={setList.id} value={setList.id}>{setList.name}</option>
              ))}
            </select>
            <button className="btn btn-secondary" onClick={() => {
              if (selectedSetListId) loadSetList(selectedSetListId)
            }}>
              Load
            </button>
            {currentSetList && (
              <button 
                className="btn btn-secondary" 
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
                style={{ marginLeft: '10px' }}
              >
                Unload
              </button>
            )}
          </div>

          <div className="song-list-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Set List Songs</h3>
              {currentSetList && (
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    // Navigate to Set Lists view - the user can edit the set list there
                    setCurrentView('setlists')
                  }}
                  title="Go to Set Lists to edit song order"
                >
                  ✏️ Edit Order
                </button>
              )}
            </div>
            {currentSetList && (
              <div style={{ 
                display: 'block', 
                background: 'var(--surface-light)', 
                padding: '10px', 
                borderRadius: '8px', 
                marginBottom: '10px', 
                color: 'var(--text-secondary)', 
                fontSize: '0.9rem' 
              }}>
                💡 Click a song to load it. To reorder songs, go to <strong>Set Lists</strong> view and edit this set list.
              </div>
            )}
            <div className="song-list">
              {setListSongs.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                  {currentSetList ? 'No songs in this set list' : 'Load a set list to see songs'}
                </p>
              ) : (
                setListSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className={`song-item performance-song-item ${index === currentSongIndex ? 'active' : ''}`}
                    onClick={() => selectSong(index)}
                  >
                    <span className="song-number">{index + 1}</span>
                    <span className="song-name">
                      {song.name}
                      {song.artist && <span className="song-artist-small"> ({song.artist})</span>}
                    </span>
                    <span className="song-bpm">{song.bpm} BPM</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {performanceMode === 'live' && (
        <div className="performance-mode active">
          <div className={`live-song-grid ${setListSongs.length > 12 ? 'has-more' : ''}`}>
            {setListSongs.length === 0 ? (
              <div className="live-no-songs">
                <p>Load a set list to see songs</p>
              </div>
            ) : (
              <>
                {setListSongs.map((song, index) => (
                  <button
                    key={song.id}
                    className={`live-song-button ${index === currentSongIndex ? 'active' : ''}`}
                    onClick={() => selectSong(index)}
                  >
                    <div className="live-song-number">{index + 1}</div>
                    <div className="live-song-name">{song.name}</div>
                    {song.artist && <div className="live-song-artist">{song.artist}</div>}
                    <div className="live-song-bpm">{song.bpm} BPM</div>
                  </button>
                ))}
                {setListSongs.length > 12 && (
                  <div className="live-more-indicator" style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '10px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontStyle: 'italic'
                  }}>
                    Scroll to see {setListSongs.length - 12} more song{setListSongs.length - 12 > 1 ? 's' : ''}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}

      <div className="performance-controls">
        <div className="current-song-display">
          <h2>{currentSong ? currentSong.name : '--'}</h2>
          <div className="bpm-display">
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
                title="Click to edit"
              >
                {bpm}
              </span>
            )}
            <span className="bpm-label">BPM</span>
            <span className="time-signature-display">{timeSignature}/4</span>
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
              <div className="song-navigation-container">
                <button 
                  className="btn btn-secondary" 
                  onClick={previousSong}
                  disabled={currentSongIndex === 0}
                  style={{ 
                    opacity: currentSongIndex === 0 ? 0.5 : 1, 
                    cursor: currentSongIndex === 0 ? 'not-allowed' : 'pointer',
                    minWidth: '110px',
                    flexShrink: 0
                  }}
                >
                  ◀ Prev Song
                </button>
                <span className="current-song-title" title={currentSong ? `${currentSong.name}${currentSong.artist ? ` - ${currentSong.artist}` : ''}` : 'No Song'}>
                  {currentSong ? `${currentSong.name}${currentSong.artist ? ` - ${currentSong.artist}` : ''}` : 'No Song'}
                </span>
                <button 
                  className="btn btn-secondary" 
                  onClick={nextSong}
                  disabled={!currentSetList || currentSongIndex >= currentSetList.songIds.length - 1}
                  style={{ 
                    opacity: (!currentSetList || currentSongIndex >= currentSetList.songIds.length - 1) ? 0.5 : 1, 
                    cursor: (!currentSetList || currentSongIndex >= currentSetList.songIds.length - 1) ? 'not-allowed' : 'pointer',
                    minWidth: '110px',
                    flexShrink: 0
                  }}
                >
                  Next Song ▶
                </button>
              </div>
            )}
            <div className="tap-tempo-container">
              <button className="btn btn-secondary tap-tempo-btn" onClick={tapTempo}>Tap Tempo</button>
              <span className="tap-tempo-message">
                {tapTempoMessage || '\u00A0'}
              </span>
            </div>
          </div>
        </div>

        <div className="lyrics-container">
          <div className="lyrics-display">
            {!currentSong || !currentSong.lyrics || currentSong.lyrics.length === 0 ? (
              <p className="lyrics-placeholder">No lyrics for this song</p>
            ) : lyricsToShow.length === 0 ? (
              <p className="lyrics-placeholder">Ready...</p>
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

        <div className="metronome-section">
          <div className="visual-beat" style={{ opacity: visualEnabled ? 1 : 0.3 }}>
            <div 
              className={`beat-indicator ${isBeatFlashing ? 'active' : ''} ${isAccentBeat ? 'accent' : ''}`}
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
          
          <div className="metronome-settings">
            <div className="settings-grid">
              <label className="settings-checkbox">
                <input 
                  type="checkbox" 
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <span className="settings-icon">🔊</span>
                <span className="settings-label">Sound</span>
              </label>
              <label className="settings-checkbox">
                <input 
                  type="checkbox" 
                  checked={visualEnabled}
                  onChange={(e) => setVisualEnabled(e.target.checked)}
                />
                <span className="settings-icon">💡</span>
                <span className="settings-label">Visual Flash</span>
              </label>
              {visualEnabled && (
                <label className="settings-checkbox">
                  <input 
                    type="checkbox" 
                    checked={showBeatNumber}
                    onChange={(e) => setShowBeatNumber(e.target.checked)}
                  />
                  <span className="settings-icon">🔢</span>
                  <span className="settings-label">Show No.</span>
                </label>
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
              <small>Beats per measure</small>
            </div>
            
            <div className="control-group">
              <label>Accent Pattern</label>
              <div className="beat-pattern-selector">
                {accentPattern.map((accented, index) => (
                  <button
                    key={index}
                    className={`beat-btn ${accented ? 'accented' : ''}`}
                    data-beat-index={index}
                    onClick={() => toggleBeatAccent(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="accent-controls">
                <button type="button" className="btn btn-secondary" onClick={clearAllAccents}>
                  Clear All
                </button>
                <button type="button" className="btn btn-secondary" onClick={setNoAccent}>
                  No Accent
                </button>
              </div>
              <small>Click beats to toggle accent on/off</small>
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {isPlaying && currentBeatInMeasure > 0 ? (
                  <>
                    Current beat: <strong style={{ color: 'var(--primary)' }}>{currentBeatInMeasure}</strong>
                    {metronome && metronome.getAccentBeats().length > 0 && (
                      <> • Accent on: <strong>{metronome.getAccentBeats().join(', ')}</strong></>
                    )}
                    {metronome && metronome.getAccentBeats().length === 0 && (
                      <> • <em>No accent</em></>
                    )}
                  </>
                ) : (
                  <>
                    {metronome && metronome.getAccentBeats().length > 0 && (
                      <>Accent set on: <strong>{metronome.getAccentBeats().join(', ')}</strong></>
                    )}
                    {metronome && metronome.getAccentBeats().length === 0 && (
                      <><em>No accent (uniform click)</em></>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="control-group">
              <label htmlFor="polyrhythm-select">Polyrhythm</label>
              <select 
                id="polyrhythm-select"
                value={polyrhythm?.name || ''}
                onChange={(e) => handlePolyrhythmChange(e.target.value)}
              >
                <option value="">None (Standard)</option>
                <option value="3:2">3:2 (Three over Two)</option>
                <option value="4:3">4:3 (Four over Three)</option>
                <option value="5:4">5:4 (Five over Four)</option>
                <option value="custom">Custom Pattern</option>
              </select>
              <small>Advanced rhythm patterns</small>
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
            
            <div className="button-group">
              <button className="btn btn-secondary" onClick={previousSong}>◀ Prev</button>
              <button 
                className={`btn btn-primary ${isPlaying ? 'playing' : ''}`}
                onClick={toggle}
              >
                <span>{isPlaying ? '⏸' : '▶'}</span>
                <span>{isPlaying ? 'Stop' : 'Start'}</span>
              </button>
              <button className="btn btn-secondary" onClick={nextSong}>Next ▶</button>
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
          </div>
        </div>

        {currentSong && (
          <div className="helix-info">
            <p>Helix Preset: <span>{currentSong.helixPreset || '--'}</span></p>
            <p className="helix-status">MIDI: {midiController.getHelixOutput() ? 'Connected' : 'Not connected'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
