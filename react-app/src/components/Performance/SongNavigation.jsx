export default function SongNavigation({ setListSongs, currentSongIndex, currentSong, onPreviousSong, onNextSong }) {
  if (setListSongs.length === 0) return null

  return (
    <div className="flex items-center justify-center gap-2 px-6 pt-4">
      <button
        className="px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-cyan)] disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={onPreviousSong}
        disabled={currentSongIndex === 0}
      >
        ◀ Prev
      </button>
      <div className="flex-1 text-center px-2">
        <div className="text-xs text-[var(--color-text-secondary)] mb-0.5">
          {currentSongIndex + 1} / {setListSongs.length}
        </div>
        <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {currentSong ? currentSong.name : 'No song'}
        </div>
      </div>
      <button
        className="px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)] text-sm font-semibold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-cyan)] disabled:opacity-30 disabled:cursor-not-allowed"
        onClick={onNextSong}
        disabled={currentSongIndex >= setListSongs.length - 1}
      >
        Next ▶
      </button>
    </div>
  )
}

