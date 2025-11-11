export default function StageHeader({ 
  currentSong, 
  currentSongIndex, 
  setListSongs,
  currentSetList,
  onSettingsClick,
  onOpenHelixModal,
  helixConnected = false,
  presetFeedback
}) {
  const songPosition = setListSongs.length > 0 
    ? `${currentSongIndex + 1}/${setListSongs.length}`
    : '--/--'

  return (
    <div className="sticky top-0 z-10 bg-[var(--color-bg-primary)]/95 backdrop-blur-xl border-b border-[var(--color-glass-border)] px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-start justify-between gap-4 max-w-7xl mx-auto">
        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-1">
            <span className="text-lg sm:text-xl leading-none">🎵</span>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--color-text-primary)] truncate">
              {currentSong?.name || 'No song selected'}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            {currentSetList && (
              <>
                <span className="px-2 py-0.5 bg-[var(--color-accent-purple)]/20 border border-[var(--color-accent-purple)]/30 rounded text-[var(--color-accent-purple)] font-semibold">
                  {currentSetList.name}
                </span>
                <span className="opacity-60">•</span>
              </>
            )}
            <span>Song {songPosition}</span>
            {currentSong && (
              <>
                <span className="opacity-60">•</span>
                <span>{currentSong.bpm || '--'} BPM</span>
                {currentSong.timeSignature && (
                  <>
                    <span className="opacity-60">•</span>
                    <span>{currentSong.timeSignature}/4</span>
                  </>
                )}
              </>
            )}
          </div>
          {currentSong?.helixPreset && (
            <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
              Helix preset: <span className="text-[var(--color-text-primary)] font-semibold">{currentSong.helixPreset}</span>
              {typeof currentSong.helixPresetNumber === 'number' && (
                <span className="ml-1 text-[var(--color-text-secondary)]">({currentSong.helixPresetNumber})</span>
              )}
            </div>
          )}
          {presetFeedback && presetFeedback.message && (
            <div
              className={[
                'mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium',
                presetFeedback.variant === 'error'
                  ? 'bg-red-500/15 border border-red-500/40 text-red-200'
                  : presetFeedback.variant === 'warning'
                    ? 'bg-amber-500/15 border border-amber-500/40 text-amber-100'
                    : 'bg-[var(--color-accent-cyan)]/15 border border-[var(--color-accent-cyan)]/40 text-[var(--color-accent-cyan)]'
              ].join(' ')}
            >
              <span>{presetFeedback.message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenHelixModal && (
            <button
              onClick={onOpenHelixModal}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all active:scale-95',
                helixConnected
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/30 text-red-200 hover:border-red-400 hover:bg-red-500/15'
              ].join(' ')}
              aria-label="Open Helix MIDI controls"
              title={helixConnected ? 'Helix output connected' : 'Select Helix output'}
            >
              <span className="text-lg leading-none">🎛️</span>
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">
                {helixConnected ? 'Helix Ready' : 'Helix Offline'}
              </span>
            </button>
          )}

          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="flex-shrink-0 p-2 sm:p-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-cyan)] transition-all active:scale-95"
              aria-label="Stage mode settings"
              title="Stage mode settings"
            >
              <span className="text-xl sm:text-2xl leading-none">⚙️</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

