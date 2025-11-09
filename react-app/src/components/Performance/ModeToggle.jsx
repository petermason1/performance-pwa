export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex w-full max-w-3xl mx-auto rounded-2xl bg-[var(--color-bg-secondary)]/60 border border-[var(--color-glass-border)] backdrop-blur-xl p-1.5 sm:p-2 gap-1 sm:gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <button
        type="button"
        className={[
          'flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-xl border border-transparent bg-transparent text-[var(--color-text-secondary)]',
          mode === 'setup'
            ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-accent-purple)] glow-purple border-[var(--color-glass-border-strong)]'
            : 'hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
        ].join(' ')}
        onClick={() => onChange('setup')}
      >
        <span className="text-lg leading-none">⚙️</span>
        <span className="uppercase tracking-wide">Setup</span>
      </button>
      <button
        type="button"
        className={[
          'flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-xl border border-transparent bg-transparent text-[var(--color-text-secondary)]',
          mode === 'live'
            ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-accent-cyan)] glow-cyan border-[var(--color-glass-border-strong)]'
            : 'hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
        ].join(' ')}
        onClick={() => onChange('live')}
      >
        <span className="text-lg leading-none">🎤</span>
        <span className="uppercase tracking-wide">Live</span>
      </button>
    </div>
  )
}

