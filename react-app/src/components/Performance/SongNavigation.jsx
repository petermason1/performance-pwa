export default function SongNavigation({ setListSongs, currentSongIndex, currentSong, onPreviousSong, onNextSong }) {
  if (setListSongs.length === 0) return null

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 pt-6 pb-4">
      <button
        className="min-w-[100px] sm:min-w-[120px] px-6 py-4 sm:px-8 sm:py-5 rounded-xl bg-[var(--color-bg-tertiary)] border-2 border-[var(--color-glass-border)] text-base sm:text-lg font-bold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-cyan)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
        onClick={onPreviousSong}
        disabled={currentSongIndex === 0}
        aria-label="Previous song"
      >
        ◀ PREV
      </button>
      <div className="flex-1 text-center px-3 sm:px-4 min-w-0">
        <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-1 font-medium">
          {currentSongIndex + 1} / {setListSongs.length}
        </div>
        <div className="text-sm sm:text-base md:text-lg font-bold text-[var(--color-text-primary)] truncate">
          {currentSong ? currentSong.name : 'No song'}
        </div>
      </div>
      <button
        className="min-w-[100px] sm:min-w-[120px] px-6 py-4 sm:px-8 sm:py-5 rounded-xl bg-[var(--color-bg-tertiary)] border-2 border-[var(--color-glass-border)] text-base sm:text-lg font-bold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent-cyan)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
        onClick={onNextSong}
        disabled={currentSongIndex >= setListSongs.length - 1}
        aria-label="Next song"
      >
        NEXT ▶
      </button>
    </div>
  )
}

