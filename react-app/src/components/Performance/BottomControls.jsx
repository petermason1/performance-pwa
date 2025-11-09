export default function BottomControls({ timeSignature, tapTempoMessage, onTimeSignatureChange, onTapTempo }) {
  const cycleTimeSignature = () => {
    const nextSig = timeSignature === 4 ? 3 : timeSignature === 3 ? 6 : 4
    onTimeSignatureChange(nextSig)
  }

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 px-6 pt-4">
      <button 
        className="flex-1 max-w-[140px] h-14 sm:h-16 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] flex items-center justify-center text-2xl sm:text-3xl font-bold text-[var(--color-accent-cyan)] font-mono transition-all hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-cyan)] hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] active:scale-95"
        onClick={cycleTimeSignature}
        title="Cycle time signature"
      >
        {timeSignature}/4
      </button>
      <button 
        className="flex-1 max-w-[140px] h-14 sm:h-16 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] flex flex-col items-center justify-center transition-all hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-purple)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95"
        onClick={onTapTempo}
      >
        <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">TAP</span>
        {tapTempoMessage && (
          <span className="text-[10px] text-[var(--color-accent-green)] mt-0.5">{tapTempoMessage}</span>
        )}
      </button>
    </div>
  )
}

