import MetronomeSettings from './MetronomeSettings'

export default function ControlStrip({ 
  soundEnabled, 
  isPlaying, 
  visualEnabled, 
  onSoundToggle, 
  onToggleMetronome, 
  onVisualToggle,
  // Metronome settings props
  soundPreset,
  subdivision,
  countInBeats,
  accentVolume,
  regularVolume,
  subdivisionVolume,
  masterVolume,
  onSoundPresetChange,
  onSubdivisionChange,
  onCountInChange,
  onAccentVolumeChange,
  onRegularVolumeChange,
  onSubdivisionVolumeChange,
  onMasterVolumeChange
}) {
  return (
    <>
      <div className="flex items-center justify-center gap-3 sm:gap-4 px-6 pb-6">
        <button
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 ${
            soundEnabled 
              ? 'bg-[var(--color-accent-green)]/20 border-[var(--color-accent-green)]/50 hover:bg-[var(--color-accent-green)]/30 shadow-[0_0_15px_rgba(0,255,136,0.3)]' 
              : 'bg-[var(--color-bg-tertiary)] border-[var(--color-glass-border)] hover:border-[var(--color-text-secondary)]'
          }`}
          onClick={() => onSoundToggle(!soundEnabled)}
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
        >
          <span className="text-2xl sm:text-3xl">{soundEnabled ? '🔊' : '🔇'}</span>
        </button>
        <button
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-2 flex items-center justify-center transition-all active:scale-90 ${
            isPlaying 
              ? 'bg-[var(--color-accent-danger)]/20 border-[var(--color-accent-danger)]/60 hover:bg-[var(--color-accent-danger)]/30 shadow-[0_0_20px_rgba(255,0,85,0.4)]' 
              : 'bg-[var(--color-accent-cyan)]/20 border-[var(--color-accent-cyan)]/60 hover:bg-[var(--color-accent-cyan)]/30 shadow-[0_0_20px_rgba(0,217,255,0.4)]'
          }`}
          onClick={onToggleMetronome}
          title={isPlaying ? 'Stop Metronome' : 'Start Metronome'}
        >
          <span className="text-3xl sm:text-4xl">{isPlaying ? '⏸' : '▶️'}</span>
        </button>
        <button
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 ${
            visualEnabled 
              ? 'bg-[var(--color-accent-purple)]/20 border-[var(--color-accent-purple)]/50 hover:bg-[var(--color-accent-purple)]/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
              : 'bg-[var(--color-bg-tertiary)] border-[var(--color-glass-border)] hover:border-[var(--color-text-secondary)]'
          }`}
          onClick={() => onVisualToggle(!visualEnabled)}
          title={visualEnabled ? 'Disable Visual Flash' : 'Enable Visual Flash'}
        >
          <span className="text-2xl sm:text-3xl">{visualEnabled ? '💡' : '🌑'}</span>
        </button>
        <MetronomeSettings
          soundPreset={soundPreset}
          subdivision={subdivision}
          countInBeats={countInBeats}
          accentVolume={accentVolume}
          regularVolume={regularVolume}
          subdivisionVolume={subdivisionVolume}
          masterVolume={masterVolume}
          onSoundPresetChange={onSoundPresetChange}
          onSubdivisionChange={onSubdivisionChange}
          onCountInChange={onCountInChange}
          onAccentVolumeChange={onAccentVolumeChange}
          onRegularVolumeChange={onRegularVolumeChange}
          onSubdivisionVolumeChange={onSubdivisionVolumeChange}
          onMasterVolumeChange={onMasterVolumeChange}
        />
      </div>
    </>
  )
}

