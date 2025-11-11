import './BeatFlash.css'

export default function BeatFlash({ 
  isFlashing, 
  isAccent, 
  currentBeat, 
  timeSignature, 
  showBeatNumber, 
  accentPattern = null,
  variant = 'normal', // 'normal' | 'stage' | 'fullscreen'
  colorCoded = false, // Enable color-coded beats (red=downbeat, blue=accent, white=regular)
  editableAccents = false,
  onToggleAccent // (beatNumber: 1-based) => void
}) {
  // Generate beat indicator dots with accent pattern awareness
  const beatDots = Array.from({ length: timeSignature }, (_, i) => i + 1)
  
  // Check if a beat is accented based on the pattern
  const isBeatAccented = (beatNumber) => {
    if (!accentPattern || accentPattern.length === 0) {
      // No explicit accents: treat all beats as not accented (uniform)
      return false
    }
    // accentPattern is 0-indexed array of booleans
    return accentPattern[beatNumber - 1] === true
  }
  
  // Calculate progress percentage through the measure
  const progressPercentage = timeSignature > 0
    ? Math.min(100, Math.max(0, (currentBeat / timeSignature) * 100))
    : 0

  // Determine beat color type for color-coded mode
  const getBeatColorType = () => {
    if (!colorCoded) return 'default'
    if (currentBeat === 1) return 'downbeat' // Red
    if (isAccent) return 'accent' // Blue
    return 'regular' // White
  }
  
  const beatColorType = getBeatColorType()

  const handleKeyToggle = (e, beat) => {
    if (!editableAccents || !onToggleAccent) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleAccent(beat)
    }
  }

  return (
    <div className={`beat-flash-container beat-flash-${variant} ${colorCoded ? 'color-coded' : ''}`} role="region" aria-label="Beat indicator">
      {/* Measure progress bar */}
      <div className="measure-progress-bar" role="progressbar" aria-valuenow={currentBeat} aria-valuemin="1" aria-valuemax={timeSignature}>
        <div className="measure-progress-fill" style={{ width: `${progressPercentage}%` }} />
      </div>
      
      <div 
        className={`beat-circle ${isFlashing ? (isAccent ? 'flashing accent' : 'flashing regular') : 'idle'} ${colorCoded ? `beat-${beatColorType}` : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {isFlashing && (
          <>
            <div className={`beat-pulse-ring ${isAccent ? 'accent' : 'regular'} ${colorCoded ? `beat-${beatColorType}` : ''}`} />
            {isAccent && <div className={`beat-pulse-ring-secondary accent ${colorCoded ? `beat-${beatColorType}` : ''}`} />}
          </>
        )}
        {showBeatNumber && (
          <span 
            className={`beat-number ${isAccent ? 'accent' : 'regular'} ${colorCoded ? `beat-${beatColorType}` : ''}`}
            aria-label={`Beat ${currentBeat} of ${timeSignature}${isAccent ? ' (accented)' : ''}${colorCoded && currentBeat === 1 ? ' (downbeat)' : ''}`}
          >
            {currentBeat}
          </span>
        )}
        {!showBeatNumber && isFlashing && (
          <div className={`beat-pulse-center ${isAccent ? 'accent' : 'regular'} ${colorCoded ? `beat-${beatColorType}` : ''}`} />
        )}
      </div>
      
      {showBeatNumber && (
        <div className="beat-label" aria-hidden="true">
          Beat {currentBeat} of {timeSignature}
          {isAccent && <span className="accent-indicator"> • Accent</span>}
        </div>
      )}
      
      {/* Beat indicator dots for measure visualization with accent pattern */}
      <div className="beat-indicators" role="group" aria-label="Measure beats">
        {beatDots.map((beat) => {
          const isCurrentBeat = beat === currentBeat
          const isAccentedBeat = isBeatAccented(beat)
          const isEditable = Boolean(editableAccents && onToggleAccent)
          return (
            <div
              key={beat}
              className={`beat-dot ${isCurrentBeat ? 'active' : ''} ${isAccentedBeat ? 'accent' : ''} ${isEditable ? 'editable' : ''}`}
              aria-label={`Beat ${beat}${isAccentedBeat ? ' (accented)' : ''}${isCurrentBeat ? ' - current' : ''}`}
              title={`Beat ${beat}${isAccentedBeat ? ' - Accent' : ''}`}
              role={isEditable ? 'button' : undefined}
              aria-pressed={isEditable ? isAccentedBeat : undefined}
              tabIndex={isEditable ? 0 : -1}
              onClick={isEditable ? () => onToggleAccent(beat) : undefined}
              onKeyDown={isEditable ? (e) => handleKeyToggle(e, beat) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

