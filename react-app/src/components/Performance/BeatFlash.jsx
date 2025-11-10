import './BeatFlash.css'

export default function BeatFlash({ 
  isFlashing, 
  isAccent, 
  currentBeat, 
  timeSignature, 
  showBeatNumber, 
  accentPattern = null,
  variant = 'normal', // 'normal' | 'stage' | 'fullscreen'
  colorCoded = false // Enable color-coded beats (red=downbeat, blue=accent, white=regular)
}) {
  // Generate beat indicator dots with accent pattern awareness
  const beatDots = Array.from({ length: timeSignature }, (_, i) => i + 1)
  
  // Check if a beat is accented based on the pattern
  const isBeatAccented = (beatNumber) => {
    if (!accentPattern || accentPattern.length === 0) {
      return beatNumber === 1 // Default: accent first beat only
    }
    // accentPattern is 0-indexed array of booleans
    return accentPattern[beatNumber - 1] === true
  }
  
  // Calculate progress percentage through the measure
  const progressPercentage = timeSignature > 0 ? ((currentBeat - 1) / timeSignature) * 100 : 0

  // Determine beat color type for color-coded mode
  const getBeatColorType = () => {
    if (!colorCoded) return 'default'
    if (currentBeat === 1) return 'downbeat' // Red
    if (isAccent) return 'accent' // Blue
    return 'regular' // White
  }
  
  const beatColorType = getBeatColorType()

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
          return (
            <div
              key={beat}
              className={`beat-dot ${isCurrentBeat ? 'active' : ''} ${isAccentedBeat ? 'accent' : ''}`}
              aria-label={`Beat ${beat}${isAccentedBeat ? ' (accented)' : ''}${isCurrentBeat ? ' - current' : ''}`}
              title={`Beat ${beat}${isAccentedBeat ? ' - Accent' : ''}`}
            />
          )
        })}
      </div>
    </div>
  )
}

