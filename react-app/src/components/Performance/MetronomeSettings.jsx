import { useState } from 'react'

export default function MetronomeSettings({
  soundPreset = 'click',
  subdivision = 'none',
  countInBeats = 0,
  accentVolume = 0.8,
  regularVolume = 0.5,
  subdivisionVolume = 0.3,
  masterVolume = 0.3,
  onSoundPresetChange,
  onSubdivisionChange,
  onCountInChange,
  onAccentVolumeChange,
  onRegularVolumeChange,
  onSubdivisionVolumeChange,
  onMasterVolumeChange
}) {
  const [isOpen, setIsOpen] = useState(false)

  const soundPresets = [
    { value: 'wood', label: 'Wood Block', icon: '🪵' },
    { value: 'click', label: 'Click', icon: '🔘' },
    { value: 'beep', label: 'Beep', icon: '🔔' },
    { value: 'tick', label: 'Tick', icon: '✓' },
    { value: 'electronic', label: 'Electronic', icon: '⚡' }
  ]

  const subdivisions = [
    { value: 'none', label: 'None' },
    { value: 'eighth', label: 'Eighth Notes' },
    { value: 'sixteenth', label: 'Sixteenth Notes' },
    { value: 'triplet', label: 'Triplets' }
  ]

  const countInOptions = [0, 1, 2, 3, 4]

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 bg-[var(--color-bg-tertiary)] border-[var(--color-glass-border)] hover:border-[var(--color-accent-purple)] hover:bg-[var(--color-bg-secondary)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
        title="Metronome Settings"
      >
        <span className="text-2xl sm:text-3xl">⚙️</span>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-bg-secondary)] rounded-3xl border-2 border-[var(--color-glass-border)] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                Metronome Settings
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] hover:bg-[var(--color-accent-danger)]/20 hover:border-[var(--color-accent-danger)] transition-all"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Sound Preset */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">
                Sound Preset
              </label>
              <div className="grid grid-cols-5 gap-2">
                {soundPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => onSoundPresetChange && onSoundPresetChange(preset.value)}
                    className={`h-16 sm:h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                      soundPreset === preset.value
                        ? 'bg-[var(--color-accent-cyan)]/20 border-[var(--color-accent-cyan)] shadow-[0_0_15px_rgba(0,217,255,0.4)]'
                        : 'bg-[var(--color-bg-tertiary)] border-[var(--color-glass-border)] hover:border-[var(--color-accent-cyan)]/50'
                    }`}
                  >
                    <span className="text-2xl">{preset.icon}</span>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Controls */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-4 uppercase tracking-wider">
                Volume Controls
              </label>
              <div className="space-y-4">
                {/* Master Volume */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">Master</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{Math.round(masterVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={masterVolume}
                    onChange={(e) => onMasterVolumeChange && onMasterVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-cyan)]"
                  />
                </div>

                {/* Accent Volume */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">Accent Beats</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{Math.round(accentVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={accentVolume}
                    onChange={(e) => onAccentVolumeChange && onAccentVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-green)]"
                  />
                </div>

                {/* Regular Volume */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">Regular Beats</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{Math.round(regularVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={regularVolume}
                    onChange={(e) => onRegularVolumeChange && onRegularVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-cyan)]"
                  />
                </div>

                {/* Subdivision Volume */}
                {subdivision !== 'none' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Subdivisions</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">{Math.round(subdivisionVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={subdivisionVolume}
                      onChange={(e) => onSubdivisionVolumeChange && onSubdivisionVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-purple)]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Subdivision */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">
                Subdivision
              </label>
              <div className="grid grid-cols-4 gap-2">
                {subdivisions.map((sub) => (
                  <button
                    key={sub.value}
                    onClick={() => onSubdivisionChange && onSubdivisionChange(sub.value)}
                    className={`h-12 rounded-xl border-2 flex items-center justify-center transition-all font-semibold ${
                      subdivision === sub.value
                        ? 'bg-[var(--color-accent-purple)]/20 border-[var(--color-accent-purple)] shadow-[0_0_15px_rgba(168,85,247,0.4)] text-[var(--color-accent-purple)]'
                        : 'bg-[var(--color-bg-tertiary)] border-[var(--color-glass-border)] hover:border-[var(--color-accent-purple)]/50 text-[var(--color-text-primary)]'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Count-In */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">
                Count-In
              </label>
              <div className="grid grid-cols-5 gap-2">
                {countInOptions.map((beats) => (
                  <button
                    key={beats}
                    onClick={() => onCountInChange && onCountInChange(beats)}
                    className={`h-12 rounded-xl border-2 flex items-center justify-center transition-all font-bold text-lg ${
                      countInBeats === beats
                        ? 'bg-[var(--color-accent-green)]/20 border-[var(--color-accent-green)] shadow-[0_0_15px_rgba(0,255,136,0.4)] text-[var(--color-accent-green)]'
                        : 'bg-[var(--color-bg-tertiary)] border-[var(--color-glass-border)] hover:border-[var(--color-accent-green)]/50 text-[var(--color-text-primary)]'
                    }`}
                  >
                    {beats === 0 ? 'Off' : beats}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

