import { getTempoMarking } from '../../utils/getTempoMarking'

export default function TempoDisplay({ bpm, timeSignature, onTimeSignatureClick }) {
  return (
    <div className="flex items-start justify-between px-6 pt-6 pb-4">
      <div className="flex flex-col items-start gap-1">
        <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-danger)] font-semibold px-2 py-0.5 bg-[var(--color-accent-danger)]/10 rounded">
          TEMPO (BPM)
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-5xl sm:text-6xl font-bold text-[var(--color-accent-cyan)] font-mono tracking-tight leading-none">
            {bpm}
          </span>
          <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-1">{getTempoMarking(bpm)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)] font-semibold px-2 py-0.5 bg-[var(--color-accent-cyan)]/10 rounded">
          T.S.
        </div>
        <button 
          className="text-5xl sm:text-6xl font-bold text-[var(--color-accent-cyan)] font-mono mt-1 leading-none hover:text-[var(--color-accent-purple)] transition-colors cursor-pointer"
          onClick={onTimeSignatureClick}
          title="Click to cycle: 4/4 → 3/4 → 6/8"
        >
          {timeSignature}/4
        </button>
      </div>
    </div>
  )
}

