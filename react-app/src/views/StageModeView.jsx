import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../hooks/useApp'
import BeatFlash from '../components/Performance/BeatFlash'
import { announce } from '../utils/accessibility'
import './StageModeView.css'

function clampIndex(index, length) {
  if (length === 0) return 0
  if (index < 0) return 0
  if (index >= length) return length - 1
  return index
}

export default function StageModeView() {
  const { metronome: metronomeHook, setLists, songs } = useApp()
  const {
    bpm,
    isPlaying,
    toggle,
    updateBPM,
    setTimeSignature: setMetronomeTimeSignature,
    setAccentPattern: setMetronomeAccentPattern,
    setPolyrhythm: setMetronomePolyrhythm,
    setSoundEnabled: setMetronomeSoundEnabled,
    metronome
  } = metronomeHook

  const [activeSetListId, setActiveSetListId] = useState(() => localStorage.getItem('currentSetListId') || '')
  const [currentSongIndex, setCurrentSongIndex] = useState(() => {
    const storedIndex = parseInt(localStorage.getItem('currentSongIndex') || '0', 10)
    return Number.isNaN(storedIndex) ? 0 : storedIndex
  })
  const [visualEnabled, setVisualEnabled] = useState(() => localStorage.getItem('metronomeVisualEnabled') !== 'false')
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('metronomeSoundEnabled') !== 'false')
  const [currentBeat, setCurrentBeat] = useState(1)
  const [isAccentBeat, setIsAccentBeat] = useState(false)
  const [isBeatFlashing, setIsBeatFlashing] = useState(false)
  const [isLiveLocked, setIsLiveLocked] = useState(false)
  const [unlockProgress, setUnlockProgress] = useState(0)
  const unlockTimerRef = useRef(null)
  const [showLyrics, setShowLyrics] = useState(() => localStorage.getItem('stageModeShowLyrics') === 'true')

  const activeSetList = useMemo(() => {
    if (!activeSetListId) return null
    return setLists.find(list => list.id === activeSetListId) || null
  }, [activeSetListId, setLists])

  const setListSongs = useMemo(() => {
    if (!activeSetList || !Array.isArray(activeSetList.songIds)) return []
    return activeSetList.songIds
      .map(id => songs.find(song => song.id === id))
      .filter(Boolean)
  }, [activeSetList, songs])

  const safeSongIndex = clampIndex(currentSongIndex, setListSongs.length)
  const activeSong = setListSongs[safeSongIndex] || null

  useEffect(() => {
    if (setListSongs.length === 0) {
      setCurrentSongIndex(0)
      return
    }
    if (safeSongIndex !== currentSongIndex) {
      setCurrentSongIndex(safeSongIndex)
    }
  }, [setListSongs.length, safeSongIndex, currentSongIndex])

  useEffect(() => {
    if (!activeSetList && setLists.length > 0 && !activeSetListId) {
      const stored = localStorage.getItem('currentSetListId')
      if (stored && setLists.some(list => list.id === stored)) {
        setActiveSetListId(stored)
      }
    }
  }, [activeSetList, activeSetListId, setLists])

  useEffect(() => {
    if (!activeSong) return

    if (activeSong.bpm) {
      updateBPM(activeSong.bpm)
    }

    if (activeSong.timeSignature) {
      setMetronomeTimeSignature?.(activeSong.timeSignature)
    }

    if (Array.isArray(activeSong.accentPattern) && activeSong.accentPattern.length > 0) {
      setMetronomeAccentPattern?.(activeSong.accentPattern)
    } else {
      setMetronomeAccentPattern?.(null)
    }

    if (activeSong.polyrhythm?.pattern) {
      setMetronomePolyrhythm?.(activeSong.polyrhythm.pattern, activeSong.polyrhythm.name)
    } else {
      setMetronomePolyrhythm?.(null)
    }

    const displayName = `${activeSong.name}${activeSong.artist ? ` by ${activeSong.artist}` : ''}`
    announce(`Stage mode armed for ${displayName}`, 'assertive')
  }, [
    activeSong,
    updateBPM,
    setMetronomeTimeSignature,
    setMetronomeAccentPattern,
    setMetronomePolyrhythm
  ])

  useEffect(() => {
    if (!metronome) return

    const handleBeat = (beatNumber, accent, isSubdivision) => {
      if (!isSubdivision) {
        setCurrentBeat(beatNumber)
      }

      if (visualEnabled && !isSubdivision) {
        setIsAccentBeat(accent)
        setIsBeatFlashing(true)
        window.setTimeout(() => {
          setIsBeatFlashing(false)
        }, 160)
      }
    }

    metronome.setOnBeatCallback(handleBeat)

    return () => {
      metronome.setOnBeatCallback(null)
    }
  }, [metronome, visualEnabled])

  useEffect(() => {
    if (soundEnabled) {
      setMetronomeSoundEnabled?.(true)
    } else {
      setMetronomeSoundEnabled?.(false)
    }
  }, [soundEnabled, setMetronomeSoundEnabled])

  useEffect(() => {
    localStorage.setItem('currentSongIndex', safeSongIndex.toString())
  }, [safeSongIndex])

  const handleToggleMetronome = useCallback(() => {
    toggle()
  }, [toggle])

  const handleNextSong = useCallback(() => {
    if (isLiveLocked) return // Prevent navigation when locked
    if (setListSongs.length === 0) return
    const nextIndex = clampIndex(safeSongIndex + 1, setListSongs.length)
    if (nextIndex !== safeSongIndex) {
      setCurrentSongIndex(nextIndex)
    }
  }, [safeSongIndex, setListSongs.length, isLiveLocked])

  const handlePreviousSong = useCallback(() => {
    if (isLiveLocked) return // Prevent navigation when locked
    if (setListSongs.length === 0) return
    const nextIndex = clampIndex(safeSongIndex - 1, setListSongs.length)
    if (nextIndex !== safeSongIndex) {
      setCurrentSongIndex(nextIndex)
    }
  }, [safeSongIndex, setListSongs.length, isLiveLocked])

  const handleSoundToggle = useCallback((enabled) => {
    setSoundEnabled(enabled)
    setMetronomeSoundEnabled?.(enabled)
    localStorage.setItem('metronomeSoundEnabled', enabled ? 'true' : 'false')
  }, [setMetronomeSoundEnabled])

  const handleVisualToggle = useCallback((enabled) => {
    setVisualEnabled(enabled)
    localStorage.setItem('metronomeVisualEnabled', enabled ? 'true' : 'false')
  }, [])

  const handleLiveToggle = useCallback(() => {
    if (!isLiveLocked) {
      // Going live - instant lock
      setIsLiveLocked(true)
      announce('Stage mode locked. Long-press to unlock.', 'assertive')
    }
    // Unlocking requires long-press, handled by handleUnlockStart/End
  }, [isLiveLocked])

  const handleUnlockStart = useCallback(() => {
    if (!isLiveLocked) return
    
    const UNLOCK_DURATION = 2000 // 2 seconds
    const TICK_INTERVAL = 50
    let elapsed = 0

    const tickUnlock = () => {
      elapsed += TICK_INTERVAL
      const progress = Math.min(elapsed / UNLOCK_DURATION, 1)
      setUnlockProgress(progress)

      if (progress >= 1) {
        setIsLiveLocked(false)
        setUnlockProgress(0)
        announce('Stage mode unlocked', 'polite')
      } else if (unlockTimerRef.current) {
        unlockTimerRef.current = window.setTimeout(tickUnlock, TICK_INTERVAL)
      }
    }

    unlockTimerRef.current = window.setTimeout(tickUnlock, TICK_INTERVAL)
  }, [isLiveLocked, unlockTimerRef])

  const handleUnlockEnd = useCallback(() => {
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current)
      unlockTimerRef.current = null
    }
    setUnlockProgress(0)
  }, [unlockTimerRef])

  const handleNavigate = useCallback((view) => {
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { view } }))
  }, [])

  const timeSignatureLabel = useMemo(() => {
    if (activeSong?.timeSignature) return `${activeSong.timeSignature}`
    if (metronome?.timeSignature) return `${metronome.timeSignature}`
    return '—'
  }, [activeSong?.timeSignature, metronome?.timeSignature])

  const previousSong = setListSongs[safeSongIndex - 1] || null
  const nextSong = setListSongs[safeSongIndex + 1] || null

  return (
    <div className="view stage-mode-view" aria-live="polite">
      <header className="stage-header">
        <div className="stage-status">
          <span className={`stage-status-light ${isPlaying ? 'online' : 'standby'}`} aria-hidden="true" />
          <span>{isPlaying ? 'Live' : 'Standby'}</span>
          <span className="stage-divider">•</span>
          <span>{activeSong?.bpm || bpm} BPM</span>
          <span className="stage-divider">•</span>
          <span>{timeSignatureLabel}</span>
          {activeSetList && (
            <>
              <span className="stage-divider">•</span>
              <span className="stage-setlist-name">{activeSetList.name}</span>
            </>
          )}
        </div>

        <button
          type="button"
          className={`stage-live-toggle ${isLiveLocked ? 'locked' : ''}`}
          onClick={handleLiveToggle}
          onMouseDown={isLiveLocked ? handleUnlockStart : undefined}
          onMouseUp={isLiveLocked ? handleUnlockEnd : undefined}
          onMouseLeave={isLiveLocked ? handleUnlockEnd : undefined}
          onTouchStart={isLiveLocked ? handleUnlockStart : undefined}
          onTouchEnd={isLiveLocked ? handleUnlockEnd : undefined}
          onTouchCancel={isLiveLocked ? handleUnlockEnd : undefined}
          aria-pressed={isLiveLocked}
          aria-label={isLiveLocked ? 'Stage locked. Hold to unlock.' : 'Lock stage mode to prevent accidental changes'}
          style={isLiveLocked && unlockProgress > 0 ? {
            background: `linear-gradient(to right, var(--warning-color) ${unlockProgress * 100}%, var(--error-color) ${unlockProgress * 100}%)`
          } : undefined}
        >
          {isLiveLocked ? (unlockProgress > 0 ? `Unlocking... ${Math.round(unlockProgress * 100)}%` : 'Hold to Unlock') : 'Go Live'}
        </button>
      </header>

      <main className="stage-main">
        <div className="stage-song-info">
          <h1>{activeSong ? activeSong.name : 'Load a set list to begin'}</h1>
          <p className="stage-song-meta">
            {activeSong?.artist ? activeSong.artist : activeSong ? `${activeSong.bpm} BPM` : 'Select a song in Set Lists'}
          </p>
        </div>

        <div className="stage-beat-visual" aria-hidden={!visualEnabled}>
          <BeatFlash
            isFlashing={visualEnabled && isBeatFlashing}
            isAccent={isAccentBeat}
            currentBeat={currentBeat}
            timeSignature={metronome?.timeSignature || activeSong?.timeSignature || 4}
            showBeatNumber
            accentPattern={metronome?.accentPattern || activeSong?.accentPattern || null}
          />
        </div>

        {/* Lyrics Display for Stage Mode */}
        {showLyrics && activeSong && (
          <div 
            className="stage-lyrics"
            role="region"
            aria-label="Song lyrics"
            style={{
              padding: '20px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              margin: '20px auto',
              maxWidth: '600px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {activeSong.lyrics ? (
              <pre style={{
                fontFamily: 'inherit',
                fontSize: '1.1rem',
                lineHeight: '1.8',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                color: 'var(--text-primary)',
                textAlign: 'center'
              }}>
                {activeSong.lyrics}
              </pre>
            ) : (
              <p style={{ 
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                margin: 0,
                textAlign: 'center'
              }}>
                No lyrics available
              </p>
            )}
          </div>
        )}

        <div className="stage-controls">
          <button
            type="button"
            className="stage-control-btn secondary"
            onClick={handlePreviousSong}
            disabled={isLiveLocked || setListSongs.length === 0 || safeSongIndex === 0}
            aria-label={isLiveLocked ? 'Previous song (locked)' : 'Previous song'}
          >
            ⬅ Prev
          </button>
          <button
            type="button"
            className={`stage-control-btn primary ${isPlaying ? 'stop' : 'start'}`}
            onClick={handleToggleMetronome}
            aria-label={isPlaying ? 'Stop metronome' : 'Start metronome'}
          >
            {isPlaying ? 'Stop' : 'Start'}
          </button>
          <button
            type="button"
            className="stage-control-btn secondary"
            onClick={handleNextSong}
            disabled={isLiveLocked || setListSongs.length === 0 || safeSongIndex >= setListSongs.length - 1}
            aria-label={isLiveLocked ? 'Next song (locked)' : 'Next song'}
          >
            Next ➡
          </button>
        </div>

        <div className="stage-toggles">
          <label className="stage-toggle">
            <input
              type="checkbox"
              checked={visualEnabled}
              onChange={(event) => handleVisualToggle(event.target.checked)}
              aria-label="Toggle visual beat flash"
            />
            <span>Flash</span>
          </label>
          <label className="stage-toggle">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => handleSoundToggle(event.target.checked)}
              aria-label="Toggle audio click"
            />
            <span>Audio</span>
          </label>
          {activeSong && activeSong.lyrics && (
            <label className="stage-toggle">
              <input
                type="checkbox"
                checked={showLyrics}
                onChange={(event) => {
                  const newValue = event.target.checked
                  setShowLyrics(newValue)
                  localStorage.setItem('stageModeShowLyrics', newValue.toString())
                }}
                aria-label="Toggle lyrics display"
              />
              <span>Lyrics</span>
            </label>
          )}
        </div>
      </main>

      <footer className="stage-footer">
        {activeSetList ? (
          <div className="stage-footer-grid">
            <div className="stage-footer-card">
              <h3>Previous</h3>
              <p>{previousSong ? previousSong.name : '—'}</p>
            </div>
            <div className="stage-footer-card">
              <h3>Current</h3>
              <p>{activeSong ? activeSong.name : 'Select a song'}</p>
            </div>
            <div className="stage-footer-card">
              <h3>Next</h3>
              <p>{nextSong ? nextSong.name : '—'}</p>
            </div>
          </div>
        ) : (
          <div className="stage-empty">
            <p>No set list loaded. Head to Set Lists to load one.</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => handleNavigate('setlists')}
            >
              Open Set Lists
            </button>
          </div>
        )}

        <div className="stage-footer-links">
          <button
            type="button"
            className="link-button"
            onClick={() => handleNavigate('performance')}
          >
            Performance View
          </button>
          <span aria-hidden="true">•</span>
          <button
            type="button"
            className="link-button"
            onClick={() => handleNavigate('metronome')}
          >
            Metronome Settings
          </button>
        </div>
      </footer>
    </div>
  )
}

