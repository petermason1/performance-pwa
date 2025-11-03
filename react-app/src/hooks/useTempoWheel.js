import { useState, useEffect, useRef, useCallback } from 'react'

// Convert BPM to rotation angle - Map BPM (40-300) to angle (0-360)
function angleFromBPM(bpm) {
  const normalized = (Math.max(40, Math.min(300, bpm)) - 40) / 260
  return normalized * 360
}

// Convert angle to BPM
function bpmFromAngle(angle) {
  const normalized = ((angle % 360) + 360) % 360 / 360
  const bpm = Math.round(40 + (normalized * 260))
  return Math.max(40, Math.min(300, bpm))
}

export function useTempoWheel(initialBPM, onBPMChange) {
  const wheelRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rotation, setRotation] = useState(angleFromBPM(initialBPM))

  useEffect(() => {
    // Ensure rotation is clamped to 0-360° when BPM changes externally
    const angle = angleFromBPM(initialBPM)
    setRotation(Math.max(0, Math.min(360, angle)))
  }, [initialBPM])

  const getAngle = useCallback((e) => {
    if (!wheelRef.current) return 0
    
    const rect = wheelRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    const dx = clientX - centerX
    const dy = clientY - centerY
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    angle += 90 // Rotate so 0° is at top
    return ((angle % 360) + 360) % 360
  }, [])

  const startAngleRef = useRef(0)
  const startBPMRef = useRef(initialBPM)
  const lastAngleRef = useRef(0)

  const startDrag = useCallback((e) => {
    // Don't start drag if clicking the play button
    if (e.target.closest && e.target.closest('.wheel-play-btn')) {
      return
    }
    
    e.preventDefault()
    setIsDragging(true)
    if (wheelRef.current) {
      wheelRef.current.classList.add('active')
    }
    
    const mouseAngle = getAngle(e)
    startAngleRef.current = mouseAngle
    startBPMRef.current = initialBPM
    lastAngleRef.current = mouseAngle
  }, [getAngle, initialBPM])

  const drag = useCallback((e) => {
    if (!isDragging || !wheelRef.current) return
    
    e.preventDefault()
    const currentAngle = getAngle(e)
    let deltaAngle = currentAngle - lastAngleRef.current
    
    // Handle wrap-around at 0/360 boundary
    if (deltaAngle > 180) {
      deltaAngle -= 360
    } else if (deltaAngle < -180) {
      deltaAngle += 360
    }
    
    // Only process significant movements (ignore tiny jitter)
    if (Math.abs(deltaAngle) < 2) {
      return
    }
    
    // Calculate angle delta from start
    let angleDelta = currentAngle - startAngleRef.current
    
    // Handle wrap-around for total delta
    if (angleDelta > 180) {
      angleDelta -= 360
    } else if (angleDelta < -180) {
      angleDelta += 360
    }
    
    // Calculate new BPM based on start BPM + angle change
    const startAngleForBPM = angleFromBPM(startBPMRef.current)
    let newAngle = startAngleForBPM + angleDelta
    
    // Clamp to 0-360 range (prevent multiple spins)
    // This ensures one full rotation = 40-300 BPM
    // If user tries to spin past limits, stop at 0° (40 BPM) or 360° (300 BPM)
    if (newAngle < 0) {
      newAngle = 0
    } else if (newAngle > 360) {
      newAngle = 360
    }
    
    // Calculate BPM from angle
    const newBPM = bpmFromAngle(newAngle)
    
    // Only update if BPM changed significantly (reduce sensitivity)
    if (Math.abs(newBPM - initialBPM) >= 1) {
      onBPMChange(newBPM)
      setRotation(newAngle) // Use clamped angle directly
    }
    
    lastAngleRef.current = currentAngle
  }, [isDragging, getAngle, initialBPM, onBPMChange])

  const endDrag = useCallback(() => {
    setIsDragging(false)
    if (wheelRef.current) {
      wheelRef.current.classList.remove('active')
    }
  }, [])

  // Attach event listeners
  useEffect(() => {
    const wheel = wheelRef.current
    if (!wheel) return

    wheel.addEventListener('mousedown', startDrag)
    document.addEventListener('mousemove', drag)
    document.addEventListener('mouseup', endDrag)
    
    wheel.addEventListener('touchstart', startDrag, { passive: false })
    document.addEventListener('touchmove', drag, { passive: false })
    document.addEventListener('touchend', endDrag)

    return () => {
      wheel.removeEventListener('mousedown', startDrag)
      document.removeEventListener('mousemove', drag)
      document.removeEventListener('mouseup', endDrag)
      wheel.removeEventListener('touchstart', startDrag)
      document.removeEventListener('touchmove', drag)
      document.removeEventListener('touchend', endDrag)
    }
  }, [startDrag, drag, endDrag])

  return {
    wheelRef,
    rotation,
    isDragging
  }
}

