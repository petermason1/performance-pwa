import { useEffect, useMemo, useRef, useState } from 'react'
import BeatFlash from '../Performance/BeatFlash'

/**
 * Lightweight visual-only beat preview that runs independently of the audio metronome.
 */
export default function BeatPreview({
  bpm = 120,
  timeSignature = 4,
  accentPattern = [],
  showBeatNumber = true,
  visualEnabled = true,
  playing = true
}) {
  const [currentBeat, setCurrentBeat] = useState(1)
  const [isFlashing, setIsFlashing] = useState(false)
  const [isAccent, setIsAccent] = useState(false)
  const intervalRef = useRef(null)
  const flashTimeoutRef = useRef(null)

  const normalizedPattern = useMemo(() => {
    if (!Array.isArray(accentPattern) || accentPattern.length === 0) {
      return new Array(timeSignature).fill(false)
    }
    if (accentPattern.length === timeSignature) return accentPattern
    const copy = [...accentPattern]
    if (copy.length < timeSignature) {
      return [...copy, ...new Array(timeSignature - copy.length).fill(false)]
    }
    return copy.slice(0, timeSignature)
  }, [accentPattern, timeSignature])

  useEffect(() => {
    setCurrentBeat(1)
  }, [timeSignature])

  useEffect(() => {
    if (!playing || !visualEnabled || bpm <= 0) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      return () => {}
    }

    const beatDurationMs = (60_000 / bpm)

    const tick = () => {
      setCurrentBeat(prev => {
        const nextBeat = prev >= timeSignature ? 1 : prev + 1
        const accent = normalizedPattern[nextBeat - 1] === true || nextBeat === 1
        setIsAccent(accent)
        setIsFlashing(true)

        clearTimeout(flashTimeoutRef.current)
        flashTimeoutRef.current = window.setTimeout(() => {
          setIsFlashing(false)
        }, Math.min(beatDurationMs / 3, 180))

        return nextBeat
      })
    }

    // Prime first flash immediately
    setIsAccent(normalizedPattern[0] === true || true)
    setIsFlashing(true)
    flashTimeoutRef.current = window.setTimeout(() => {
      setIsFlashing(false)
    }, Math.min(beatDurationMs / 3, 180))

    intervalRef.current = window.setInterval(tick, beatDurationMs)

    return () => {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      clearTimeout(flashTimeoutRef.current)
    }
  }, [bpm, normalizedPattern, playing, timeSignature, visualEnabled])

  return (
    <BeatFlash
      isFlashing={visualEnabled && isFlashing}
      isAccent={isAccent}
      currentBeat={currentBeat}
      timeSignature={timeSignature}
      showBeatNumber={showBeatNumber}
      accentPattern={normalizedPattern}
    />
  )
}

