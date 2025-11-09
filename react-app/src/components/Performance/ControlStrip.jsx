export default function ControlStrip({ soundEnabled, isPlaying, visualEnabled, onSoundToggle, onToggleMetronome, onVisualToggle }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 px-6 pb-4">
      <button
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] flex items-center justify-center transition-all hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-cyan)] active:scale-95"
        onClick={() => onSoundToggle(!soundEnabled)}
        title={soundEnabled ? 'Mute' : 'Unmute'}
      >
        <span className="text-lg sm:text-xl">{soundEnabled ? '🔊' : '🔇'}</span>
      </button>
      <button
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] flex items-center justify-center transition-all hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-cyan)] active:scale-95"
        onClick={onToggleMetronome}
        title={isPlaying ? 'Stop' : 'Start'}
      >
        <span className="text-lg sm:text-xl">{isPlaying ? '⏸' : '▶️'}</span>
      </button>
      <button
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] flex items-center justify-center transition-all hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-cyan)] active:scale-95"
        onClick={() => onVisualToggle(!visualEnabled)}
        title="Visual Flash"
      >
        <span className="text-lg sm:text-xl">{visualEnabled ? '💡' : '🌑'}</span>
      </button>
    </div>
  )
}

