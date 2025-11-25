import { useEffect, useRef, useState } from 'react'

/**
 * Drag-and-drop list for songs in a set list.
 * 
 * Features:
 * - Mouse drag-and-drop
 * - Touch drag-and-drop with improved UX
 * - Keyboard navigation (Alt + Arrow keys)
 * - Visual feedback during drag
 * - Prevents accidental reorders
 */
export default function DraggableSongList({ songs, currentIndex, onReorder, onSelect, setIsDragging }) {
  const [dragIndex, setDragIndex] = useState(null)
  const [hoverIndex, setHoverIndex] = useState(null)
  const songsRef = useRef(songs)
  const listRef = useRef(null)
  const touchStateRef = useRef(null)
  const itemRefs = useRef([])

  useEffect(() => {
    songsRef.current = songs
  }, [songs])

  if (!songs?.length) return null

  const performReorder = (fromIndex, toIndex, options = {}) => {
    if (fromIndex === toIndex) return
    const list = songsRef.current || []
    const clampedTarget = Math.max(0, Math.min(list.length - 1, toIndex))
    if (clampedTarget === fromIndex) return

    const updated = [...list]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(clampedTarget, 0, moved)
    onReorder?.(updated)

    if (typeof options.onCompleted === 'function') {
      options.onCompleted(updated)
    }

    if (typeof options.focusIndex === 'number') {
      requestAnimationFrame(() => {
        itemRefs.current[options.focusIndex]?.focus()
      })
    }

    return clampedTarget
  }

  const handleDragStart = (index) => () => {
    setDragIndex(index)
    setHoverIndex(index)
    setIsDragging?.(true)
  }

  const handleDragEnter = (index) => (event) => {
    event.preventDefault()
    setHoverIndex(index)
    if (dragIndex === null || dragIndex === index) return
    const newIndex = performReorder(dragIndex, index)
    if (typeof newIndex === 'number') {
      setDragIndex(newIndex)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setHoverIndex(null)
    setIsDragging?.(false)
  }

  const getIndexFromClientY = (clientY) => {
    const container = listRef.current
    if (!container) return null
    const nodes = container.querySelectorAll('[data-song-index]')
    let targetIndex = null
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect()
      if (clientY >= rect.top && clientY <= rect.bottom) {
        const idx = Number(node.dataset.songIndex)
        if (!Number.isNaN(idx)) {
          targetIndex = idx
        }
      }
    })
    return targetIndex
  }

  const handleTouchStart = (index) => (event) => {
    const touch = event.touches[0]
    if (!touch) return
    
    // Prevent scrolling during drag
    if (listRef.current) {
      listRef.current.style.overflowY = 'hidden'
    }
    
    setDragIndex(index)
    setHoverIndex(index)
    setIsDragging?.(true)
    touchStateRef.current = {
      currentIndex: index,
      pointerId: touch.identifier,
      startY: touch.clientY,
      startTime: Date.now()
    }
  }

  const handleTouchMove = (event) => {
    const state = touchStateRef.current
    if (!state) return
    const touch = Array.from(event.touches).find(t => t.identifier === state.pointerId) || event.touches[0]
    if (!touch) return
    
    // Require minimum drag distance to prevent accidental reorders
    const dragDistance = Math.abs(touch.clientY - state.startY)
    const minDragDistance = 20 // pixels
    
    if (dragDistance < minDragDistance) {
      return // Don't start drag until user moves enough
    }
    
    event.preventDefault()
    event.stopPropagation()
    
    const targetIndex = getIndexFromClientY(touch.clientY)
    if (targetIndex !== null) {
      setHoverIndex(targetIndex)
    }
    if (targetIndex === null || targetIndex === state.currentIndex) return
    
    const newIndex = performReorder(state.currentIndex, targetIndex)
    if (typeof newIndex === 'number') {
      touchStateRef.current = {
        ...state,
        currentIndex: newIndex
      }
      setDragIndex(newIndex)
    }
  }

  const handleTouchEnd = () => {
    // Restore scrolling
    if (listRef.current) {
      listRef.current.style.overflowY = 'auto'
    }
    
    touchStateRef.current = null
    setDragIndex(null)
    setHoverIndex(null)
    setIsDragging?.(false)
  }

  const handleKeyDown = (index) => (event) => {
    if (!event.altKey) return
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const target = Math.max(0, index - 1)
      setHoverIndex(target)
      const newIndex = performReorder(index, target, { focusIndex: target })
      if (typeof newIndex === 'number') {
        setDragIndex(newIndex)
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const target = Math.min((songsRef.current?.length || 1) - 1, index + 1)
      setHoverIndex(target)
      const newIndex = performReorder(index, target, { focusIndex: target })
      if (typeof newIndex === 'number') {
        setDragIndex(newIndex)
      }
    }
  }

  return (
    <div
      ref={listRef}
      className="space-y-2"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {songs.map((song, index) => {
        const isCurrent = index === currentIndex
        const isHover = hoverIndex === index
        const isDragging = dragIndex === index
        return (
          <div
            key={song.id || `${song.name}-${index}`}
            data-song-index={index}
            draggable
            onDragStart={handleDragStart(index)}
            onDragEnter={handleDragEnter(index)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart(index)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-move bg-[var(--color-bg-tertiary)] relative overflow-hidden ${
              isCurrent ? 'border-[var(--color-accent-cyan)] shadow-[0_0_20px_rgba(0,217,255,0.25)]' : 'border-[var(--color-glass-border)] hover:border-[var(--color-accent-cyan)]/60'
            } ${isHover && dragIndex !== null && dragIndex !== index ? 'ring-2 ring-[var(--color-accent-cyan)]/40 ring-offset-2 ring-offset-[var(--color-bg-secondary)] transform translate-y-1' : ''} ${isDragging ? 'opacity-60 scale-105 shadow-lg z-10' : ''}`}
            style={{
              transform: isDragging ? 'scale(1.05) rotate(2deg)' : isHover && dragIndex !== null && dragIndex !== index ? 'translateY(4px)' : undefined,
              transition: isDragging ? 'none' : 'all 0.2s ease'
            }}
          >
            <div className="flex flex-col items-center text-[var(--color-text-secondary)]">
              <span className="text-lg leading-none" aria-hidden="true">⋮⋮</span>
              <span className="text-xs" aria-hidden="true">{index + 1}</span>
            </div>
            <button
              type="button"
              ref={(el) => { itemRefs.current[index] = el }}
              className="flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] rounded-lg"
              onClick={() => onSelect?.(index)}
              onKeyDown={handleKeyDown(index)}
              aria-label={`Song ${index + 1}: ${song.name || 'Untitled song'}. Alt + Arrow keys to reorder.`}
            >
              <div className={`font-semibold ${isCurrent ? 'text-[var(--color-accent-cyan)]' : 'text-[var(--color-text-primary)]'}`}>
                {song.name || 'Untitled song'}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                {song.artist || 'Unknown artist'} • {song.bpm || '--'} BPM
              </div>
            </button>

            {isHover && dragIndex !== null && (
              <div className="absolute inset-0 pointer-events-none bg-[var(--color-accent-cyan)]/10" aria-hidden="true" />
            )}
          </div>
        )
      })}
    </div>
  )
}
