import { getTempoMarking } from '../../utils/getTempoMarking'

export default function TempoDisplay({ bpm, timeSignature, onTimeSignatureClick }) {
  return (
    <div className="flex items-start justify-between px-6 pt-8 pb-6">
      <div className="flex flex-col items-start gap-2">
        <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.4em] text-[var(--color-accent-danger)] font-bold px-3 py-1 bg-[var(--color-accent-danger)]/15 rounded-md border border-[var(--color-accent-danger)]/30">
          TEMPO (BPM)
        </div>
        <div className="flex items-baseline gap-3 mt-1">
          <span className="text-6xl sm:text-7xl md:text-8xl font-black text-[var(--color-accent-cyan)] font-mono tracking-tight leading-none drop-shadow-[0_0_20px_rgba(0,217,255,0.5)]">
            {bpm}
          </span>
          <span className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-2 font-medium">{getTempoMarking(bpm)}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.4em] text-[var(--color-accent-cyan)] font-bold px-3 py-1 bg-[var(--color-accent-cyan)]/15 rounded-md border border-[var(--color-accent-cyan)]/30">
          TIME SIG.
        </div>
        <button 
          className="text-6xl sm:text-7xl md:text-8xl font-black text-[var(--color-accent-cyan)] font-mono mt-1 leading-none hover:text-[var(--color-accent-purple)] transition-all cursor-pointer drop-shadow-[0_0_20px_rgba(0,217,255,0.5)] hover:scale-105 active:scale-95"
          onClick={onTimeSignatureClick}
          title="Click to cycle: 4/4 → 3/4 → 6/8"
        >
          {timeSignature}/4
        </button>
      </div>
    </div>
  )
}

