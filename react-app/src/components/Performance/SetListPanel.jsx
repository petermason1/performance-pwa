import { useEffect, useMemo, useState } from 'react'
import DraggableSongList from './DraggableSongList'

export default function SetListPanel({
  setList,
  songs,
  currentSongIndex,
  collapsed,
  onToggleCollapse,
  onSelectSong,
  onReorder
}) {
  const [localSongs, setLocalSongs] = useState(songs)
  const [dirty, setDirty] = useState(false)
  const canonicalOrder = useMemo(() => songs.map(song => song?.id).filter(Boolean), [songs])

  useEffect(() => {
    setLocalSongs(songs)
    setDirty(false)
  }, [songs])

  const markDirty = (updatedList) => {
    const updatedIds = updatedList.map(song => song?.id).filter(Boolean)
    const hasChanges = updatedIds.length === canonicalOrder.length && updatedIds.some((id, idx) => id !== canonicalOrder[idx])
    setDirty(hasChanges)
  }

  const handleReorder = (updatedSongs) => {
    setLocalSongs(updatedSongs)
    markDirty(updatedSongs)
    onReorder?.(updatedSongs)
  }

  const handleUndo = () => {
    setLocalSongs(songs)
    setDirty(false)
    onReorder?.(songs)
  }

  const handleSelectSong = (index) => {
    onSelectSong?.(index)
  }

  if (!songs?.length) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-[var(--color-bg-secondary)] border-t border-[var(--color-glass-border)] backdrop-blur-xl transition-all duration-300 ${
      collapsed ? 'max-h-16' : 'max-h-[60vh]'
    }`}>
      <button
        onClick={onToggleCollapse}
        className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left hover:bg-[var(--color-bg-tertiary)] transition-colors"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand set list' : 'Collapse set list'}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg leading-none transition-transform duration-300" style={{
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)'
          }}>
            ▼
          </span>
          <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">
            SET LIST: {setList.name}
          </h3>
          <span className="text-xs text-[var(--color-text-secondary)]">
            ({songs.length} {songs.length === 1 ? 'song' : 'songs'})
          </span>
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)]">
              Drag to reorder • Tap song to select
            </span>
          </div>
        )}
      </button>

      {!collapsed && (
        <div className="overflow-y-auto max-h-[calc(60vh-64px)] px-4 sm:px-6 pb-4">
          <DraggableSongList
            songs={localSongs}
            currentIndex={currentSongIndex}
            onReorder={handleReorder}
            onSelect={handleSelectSong}
          />

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-[var(--color-text-secondary)]">
              {dirty ? 'Unsaved order changes' : 'Order matches saved set list'}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleUndo}
              disabled={!dirty}
            >
              Undo Reorder
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

