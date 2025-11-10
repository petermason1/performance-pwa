import { useEffect } from 'react'

/**
 * Hook for keyboard shortcuts in Performance View
 * 
 * Shortcuts:
 * - Space: Toggle metronome play/pause
 * - ArrowLeft: Previous song
 * - ArrowRight: Next song
 * - Escape: Stop metronome
 * - + / =: Increase BPM
 * - - / _: Decrease BPM
 */
export function useKeyboardShortcuts({
  onToggleMetronome,
  onPreviousSong,
  onNextSong,
  onStopMetronome,
  onIncreaseBPM,
  onDecreaseBPM,
  enabled = true
}) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return
      }

      // Prevent default for shortcuts we handle
      switch (e.key) {
        case ' ':
          e.preventDefault()
          onToggleMetronome?.()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onPreviousSong?.()
          break
        case 'ArrowRight':
          e.preventDefault()
          onNextSong?.()
          break
        case 'Escape':
          e.preventDefault()
          onStopMetronome?.()
          break
        case '+':
        case '=':
          if (e.shiftKey || e.key === '=') {
            e.preventDefault()
            onIncreaseBPM?.()
          }
          break
        case '-':
        case '_':
          if (e.shiftKey || e.key === '-') {
            e.preventDefault()
            onDecreaseBPM?.()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, onToggleMetronome, onPreviousSong, onNextSong, onStopMetronome, onIncreaseBPM, onDecreaseBPM])
}

