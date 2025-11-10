export default function BeatFlash({ isFlashing, isAccent, currentBeat, timeSignature, showBeatNumber }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-6">
      <div 
        className={`relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full border-4 transition-all duration-150 ${
          isFlashing 
            ? isAccent
              ? 'bg-[var(--color-accent-danger)]/40 border-[var(--color-accent-danger)] scale-110 shadow-[0_0_40px_rgba(255,0,85,0.8)]' 
              : 'bg-[var(--color-accent-cyan)]/40 border-[var(--color-accent-cyan)] scale-110 shadow-[0_0_40px_rgba(0,217,255,0.8)]'
            : 'bg-[var(--color-bg-tertiary)]/30 border-[var(--color-glass-border)] scale-100'
        }`}
      >
        {showBeatNumber && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl sm:text-5xl md:text-6xl font-black font-mono ${
              isAccent ? 'text-[var(--color-accent-danger)]' : 'text-[var(--color-accent-cyan)]'
            }`}>
              {currentBeat}
            </span>
          </div>
        )}
      </div>
      {showBeatNumber && (
        <div className="mt-4 text-xs sm:text-sm text-[var(--color-text-secondary)] uppercase tracking-wider">
          Beat {currentBeat} of {timeSignature}
        </div>
      )}
    </div>
  )
}

