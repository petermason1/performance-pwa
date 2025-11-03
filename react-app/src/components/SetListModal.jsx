import { useState, useEffect, useRef } from 'react'
import { useApp } from '../hooks/useApp'

export default function SetListModal({ setList, onClose }) {
  const { songs, addSetList, updateSetList, getSong } = useApp()
  const [name, setName] = useState('')
  const [selectedSongIds, setSelectedSongIds] = useState([])
  const [songOrder, setSongOrder] = useState([])
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [editingPosition, setEditingPosition] = useState(null)
  const [positionValue, setPositionValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const songsListRef = useRef(null)

  useEffect(() => {
    if (setList) {
      setName(setList.name || '')
      setSelectedSongIds(setList.songIds || [])
      setSongOrder(setList.songIds || [])
    } else {
      setName('')
      setSelectedSongIds([])
      setSongOrder([])
    }
  }, [setList])

  // Sort songs alphabetically
  const sortedSongs = [...songs].sort((a, b) => {
    const nameA = (a.name || '').toLowerCase()
    const nameB = (b.name || '').toLowerCase()
    const artistA = (a.artist || '').toLowerCase()
    const artistB = (b.artist || '').toLowerCase()
    
    if (artistA !== artistB) {
      return artistA.localeCompare(artistB)
    }
    return nameA.localeCompare(nameB)
  })

  // Get ordered songs (selected first in saved order, then unselected - filtered by search if active)
  const orderedSongs = (() => {
    // Always show selected songs first, in their saved order (not filtered by search)
    const selectedSongs = songOrder
      .map(id => sortedSongs.find(s => s.id === id))
      .filter(s => s !== undefined)
    
    // Get unselected songs (available to add)
    const unselectedSongs = sortedSongs.filter(s => !selectedSongIds.includes(s.id))
    
    // Filter unselected songs by search query if search is active
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const filteredUnselected = unselectedSongs.filter(song => {
        const name = (song.name || '').toLowerCase()
        const artist = (song.artist || '').toLowerCase()
        return name.includes(query) || artist.includes(query)
      })
      return [...selectedSongs, ...filteredUnselected]
    }
    
    // No search - show all unselected songs
    return [...selectedSongs, ...unselectedSongs]
  })()

  const handleToggleSong = (songId) => {
    if (selectedSongIds.includes(songId)) {
      // Remove
      setSelectedSongIds(prev => prev.filter(id => id !== songId))
      setSongOrder(prev => prev.filter(id => id !== songId))
    } else {
      // Add
      setSelectedSongIds(prev => [...prev, songId])
      setSongOrder(prev => [...prev, songId])
    }
  }

  // Move song up in order
  const handleMoveUp = (songId) => {
    const currentIndex = songOrder.indexOf(songId)
    if (currentIndex <= 0) return
    
    const newOrder = [...songOrder]
    newOrder[currentIndex] = newOrder[currentIndex - 1]
    newOrder[currentIndex - 1] = songId
    setSongOrder(newOrder)
  }

  // Move song down in order
  const handleMoveDown = (songId) => {
    const currentIndex = songOrder.indexOf(songId)
    if (currentIndex < 0 || currentIndex >= songOrder.length - 1) return
    
    const newOrder = [...songOrder]
    newOrder[currentIndex] = newOrder[currentIndex + 1]
    newOrder[currentIndex + 1] = songId
    setSongOrder(newOrder)
  }

  // Move song to specific position
  const handleMoveToPosition = (songId, newPosition) => {
    const currentIndex = songOrder.indexOf(songId)
    if (currentIndex < 0) return
    
    const pos = Math.max(1, Math.min(newPosition, songOrder.length)) - 1 // Convert to 0-indexed
    
    const newOrder = [...songOrder]
    const [moved] = newOrder.splice(currentIndex, 1)
    newOrder.splice(pos, 0, moved)
    setSongOrder(newOrder)
    setEditingPosition(null)
  }

  // Start editing position
  const handleEditPosition = (songId, currentPos) => {
    setEditingPosition(songId)
    setPositionValue(currentPos.toString())
  }

  // Handle position input change
  const handlePositionInputChange = (e) => {
    const value = e.target.value
    if (value === '' || /^\d+$/.test(value)) {
      setPositionValue(value)
    }
  }

  // Handle position input blur/enter
  const handlePositionInputConfirm = (songId) => {
    const numValue = parseInt(positionValue)
    if (!isNaN(numValue) && numValue > 0) {
      handleMoveToPosition(songId, numValue)
    } else {
      setEditingPosition(null)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, songId) => {
    const index = songOrder.indexOf(songId)
    setDraggingIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', songId)
  }

  const handleDragOver = (e, targetSongId) => {
    e.preventDefault()
    if (draggingIndex === null) return

    const draggedSongId = songOrder[draggingIndex]
    if (draggedSongId === targetSongId) return

    const newOrder = [...songOrder]
    const targetIndex = newOrder.indexOf(targetSongId)
    const draggedIndex = newOrder.indexOf(draggedSongId)
    
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedSongId)
    
    setSongOrder(newOrder)
    setDraggingIndex(newOrder.indexOf(draggedSongId))
  }

  const handleDragEnd = () => {
    setDraggingIndex(null)
  }

  const handleSortAlphabetical = () => {
    const selectedIds = [...selectedSongIds]
    const unselectedIds = sortedSongs
      .filter(s => !selectedIds.includes(s.id))
      .map(s => s.id)
    
    setSongOrder([...selectedIds, ...unselectedIds])
  }

  // Export single set list
  const handleExportSetList = async () => {
    if (!setList) return
    
    const setListData = {
      name: name.trim() || setList.name,
      songIds: songOrder.filter(id => selectedSongIds.includes(id)),
      songs: songOrder
        .filter(id => selectedSongIds.includes(id))
        .map(id => {
          const song = getSong(id)
          return song ? {
            name: song.name,
            artist: song.artist,
            bpm: song.bpm,
            timeSignature: song.timeSignature
          } : null
        })
        .filter(s => s !== null),
      version: '1.0',
      exportDate: new Date().toISOString(),
      metadata: {
        songCount: selectedSongIds.length,
        createdAt: setList.createdAt || new Date().toISOString()
      }
    }
    
    const jsonData = JSON.stringify(setListData, null, 2)
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonData)
        alert(`✅ Set list "${setListData.name}" copied to clipboard!\n\nYou can share this with others or save it as a backup.`)
      } else {
        // Fallback
        const textarea = document.createElement('textarea')
        textarea.value = jsonData
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        alert(`✅ Set list "${setListData.name}" copied to clipboard!`)
      }
    } catch (e) {
      console.error('Copy failed:', e)
      alert('Failed to copy. Showing export data in an alert...')
      prompt('Copy this set list data:', jsonData)
    }
  }

  // Import single set list
  const handleImportSetList = () => {
    const importText = prompt('Paste set list data here (from Export):')
    if (!importText || !importText.trim()) return
    
    try {
      const importedData = JSON.parse(importText.trim())
      
      if (!importedData.name || !Array.isArray(importedData.songIds)) {
        throw new Error('Invalid set list format')
      }
      
      // Check if songs exist in our library
      const missingSongs = []
      const foundSongIds = []
      
      importedData.songIds.forEach(songId => {
        const song = getSong(songId)
        if (song) {
          foundSongIds.push(songId)
        } else {
          // Try to find by name/artist if we have metadata
          if (importedData.songs) {
            const metadata = importedData.songs.find(s => s.id === songId)
            if (metadata) {
              // Search by name/artist
              const match = songs.find(s => 
                s.name.toLowerCase() === metadata.name?.toLowerCase() &&
                (s.artist || '').toLowerCase() === (metadata.artist || '').toLowerCase()
              )
              if (match) {
                foundSongIds.push(match.id)
              } else {
                missingSongs.push(metadata.name || 'Unknown')
              }
            } else {
              missingSongs.push('Unknown')
            }
          } else {
            missingSongs.push('Unknown')
          }
        }
      })
      
      if (missingSongs.length > 0) {
        alert(`⚠️ Warning: ${missingSongs.length} song(s) not found in your library:\n${missingSongs.slice(0, 5).join(', ')}${missingSongs.length > 5 ? '...' : ''}\n\nOnly matching songs will be added.`)
      }
      
      if (foundSongIds.length === 0) {
        alert('❌ No matching songs found in your library. Make sure you have the same songs imported first.')
        return
      }
      
      // Update form with imported data
      setName(importedData.name)
      setSelectedSongIds(foundSongIds)
      setSongOrder(foundSongIds) // Preserve order from import
      
      alert(`✅ Imported "${importedData.name}" with ${foundSongIds.length} song(s)!`)
    } catch (e) {
      alert(`❌ Error importing set list: ${e.message}\n\nMake sure you copied the complete set list data.`)
      console.error('Import error:', e)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Please enter a set list name')
      return
    }

    const setListData = {
      name: name.trim(),
      songIds: songOrder.filter(id => selectedSongIds.includes(id))
    }

    if (setList) {
      updateSetList(setList.id, setListData)
    } else {
      addSetList(setListData)
    }

    onClose()
  }

  const handleClose = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('close')) {
      onClose()
    }
  }

  const selectedCount = selectedSongIds.length
  const selectedSongsOnly = orderedSongs.filter(song => selectedSongIds.includes(song.id))

  return (
    <div className="modal" style={{ display: 'block' }} onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={handleClose}>&times;</span>
        <h2>{setList ? 'Edit Set List' : 'New Set List'}</h2>
        
        {/* Export/Import buttons for existing set lists */}
        {setList && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={handleExportSetList}
              title="Copy set list to share with others"
            >
              📤 Export/Share
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={handleImportSetList}
              title="Import a set list from someone else"
            >
              📥 Import Set List
            </button>
          </div>
        )}
        
        <form id="setlist-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="setlist-name">Set List Name</label>
            <input
              type="text"
              id="setlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="setlist-songs">Songs</label>
            <div className="setlist-controls-bar">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={handleSortAlphabetical}
              >
                Sort A-Z
              </button>
              <span className="song-count">{selectedCount} song{selectedCount !== 1 ? 's' : ''}</span>
            </div>
            
            {/* Search bar */}
            <div style={{ marginBottom: '15px', position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Search available songs to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 15px',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  background: 'var(--surface-light)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-color)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--surface)'
                    e.target.style.color = 'var(--text)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                    e.target.style.color = 'var(--text-secondary)'
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              {searchQuery && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic'
                }}>
                  Found {orderedSongs.filter(s => !selectedSongIds.includes(s.id)).length} available song{orderedSongs.filter(s => !selectedSongIds.includes(s.id)).length !== 1 ? 's' : ''} matching "{searchQuery}"
                </div>
              )}
            </div>
            
            {/* Selected songs with reordering controls */}
            {selectedSongsOnly.length > 0 && (
              <div style={{
                background: 'var(--surface-light)',
                padding: '15px',
                borderRadius: '12px',
                marginBottom: '15px',
                border: '2px solid var(--primary-color)'
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--primary-color)' }}>
                  📋 Set List Order ({selectedCount} song{selectedCount !== 1 ? 's' : ''})
                </h4>
                <div className="selected-songs-list">
                  {selectedSongsOnly.map((song, displayIndex) => {
                    const songId = song.id
                    const position = songOrder.indexOf(songId) + 1
                    const isDragging = draggingIndex !== null && draggingIndex === position - 1
                    const isEditing = editingPosition === songId
                    
                    return (
                      <div
                        key={songId}
                        className={`sortable-song-item selected ${isDragging ? 'dragging' : ''}`}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, songId)}
                        onDragOver={(e) => handleDragOver(e, songId)}
                        onDragEnd={handleDragEnd}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px',
                          marginBottom: '8px',
                          background: isDragging ? 'var(--surface)' : 'var(--background)',
                          border: `2px solid ${isDragging ? 'var(--primary-color)' : 'transparent'}`,
                          borderRadius: '8px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Position number */}
                        <div style={{
                          minWidth: '50px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}>
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={positionValue}
                                onChange={handlePositionInputChange}
                                onBlur={() => handlePositionInputConfirm(songId)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handlePositionInputConfirm(songId)
                                  } else if (e.key === 'Escape') {
                                    setEditingPosition(null)
                                  }
                                }}
                                autoFocus
                                style={{
                                  width: '40px',
                                  textAlign: 'center',
                                  padding: '4px',
                                  border: '2px solid var(--primary-color)',
                                  borderRadius: '4px',
                                  fontSize: '0.9rem',
                                  fontWeight: 'bold'
                                }}
                              />
                            </>
                          ) : (
                            <span
                              className="song-number-modal"
                              onClick={() => handleEditPosition(songId, position)}
                              style={{
                                cursor: 'pointer',
                                userSelect: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: 'var(--primary-color)',
                                color: 'var(--text)',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                minWidth: '32px',
                                textAlign: 'center'
                              }}
                              title="Click to set position"
                            >
                              {position}
                            </span>
                          )}
                        </div>
                        
                        {/* Drag handle */}
                        <span className="drag-handle" style={{ cursor: 'grab' }}>☰</span>
                        
                        {/* Song info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                            {song.name}
                            {song.artist && (
                              <span style={{ color: 'var(--text-secondary)', fontWeight: '400', marginLeft: '8px' }}>
                                ({song.artist})
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {song.bpm} BPM
                          </div>
                        </div>
                        
                        {/* Reorder buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleMoveUp(songId)}
                            disabled={position === 1}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.9rem',
                              opacity: position === 1 ? 0.3 : 1,
                              cursor: position === 1 ? 'not-allowed' : 'pointer'
                            }}
                            title="Move up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleMoveDown(songId)}
                            disabled={position === selectedCount}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.9rem',
                              opacity: position === selectedCount ? 0.3 : 1,
                              cursor: position === selectedCount ? 'not-allowed' : 'pointer'
                            }}
                            title="Move down"
                          >
                            ▼
                          </button>
                        </div>
                        
                        {/* Remove button */}
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleToggleSong(songId)}
                          style={{
                            padding: '6px 10px',
                            fontSize: '1rem'
                          }}
                          title="Remove from set list"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* All songs list */}
            <div
              id="available-songs-list"
              className="song-checkbox-list sortable-song-list"
              ref={songsListRef}
              style={{ maxHeight: selectedSongsOnly.length > 0 ? '300px' : '500px', overflowY: 'auto' }}
            >
              {orderedSongs.map((song, index) => {
                const isSelected = selectedSongIds.includes(song.id)
                const selectedIndex = isSelected ? songOrder.indexOf(song.id) : -1
                const isDragging = isSelected && draggingIndex === selectedIndex

                if (isSelected) {
                  // Already shown in selected songs section
                  return null
                }

                return (
                  <div
                    key={song.id}
                    className={`sortable-song-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                  >
                    <span className="song-number-modal" style={{ opacity: 0.3 }}>—</span>
                    <input
                      type="checkbox"
                      id={`song-${song.id}`}
                      value={song.id}
                      checked={isSelected}
                      onChange={() => handleToggleSong(song.id)}
                    />
                    <label htmlFor={`song-${song.id}`} className="song-checkbox-label">
                      {song.name}
                      {song.artist && (
                        <span className="song-artist-small"> ({song.artist})</span>
                      )}
                    </label>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                      {song.bpm} BPM
                    </span>
                  </div>
                )
              })}
            </div>
            
            <div style={{
              background: 'var(--surface-light)',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '15px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--primary-color)' }}>💡 Reordering Tips:</strong>
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li><strong>Click the number</strong> to type a position (e.g., type "5" to move to 5th position)</li>
                <li><strong>Use ↑/↓ arrows</strong> to move up or down one position</li>
                <li><strong>Drag ☰ handle</strong> on desktop to reorder (may not work on mobile)</li>
                <li><strong>Checkbox</strong> adds/removes songs from the set list</li>
              </ul>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
