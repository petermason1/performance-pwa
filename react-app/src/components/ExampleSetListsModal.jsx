import { useState } from 'react'
import { exampleSetLists, matchSongsForSetList } from '../utils/exampleSongs'

export default function ExampleSetListsModal({ songs, onImport, onClose }) {
  const [selectedSetList, setSelectedSetList] = useState(null)
  const [importing, setImporting] = useState(false)

  const handleImport = async (setList) => {
    setImporting(true)
    try {
      // Match songs from the example set list
      const matchedSongIds = matchSongsForSetList(setList, songs)
      
      if (matchedSongIds.length === 0) {
        alert(`⚠️ No matching songs found!\n\nPlease import example songs first before importing this set list.\n\nGo to Songs → Import Songs to add the example song library.`)
        setImporting(false)
        return
      }
      
      // Create the set list
      const newSetList = {
        name: setList.name,
        songIds: matchedSongIds
      }
      
      await onImport(newSetList)
      
      alert(`✅ Imported "${setList.name}" with ${matchedSongIds.length} song(s)!`)
      onClose()
    } catch (error) {
      console.error('Failed to import set list:', error)
      alert('❌ Failed to import set list. Please try again.')
    }
    setImporting(false)
  }

  return (
    <div className="modal" style={{ display: 'block' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>📋 Import Example Set Lists</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Choose a pre-built set list to get started quickly. Songs will be matched from your library.
        </p>

        <div style={{ display: 'grid', gap: '15px' }}>
          {exampleSetLists.map((setList, index) => {
            const matchedCount = matchSongsForSetList(setList, songs).length
            const totalCount = setList.songNames.length
            const allMatched = matchedCount === totalCount
            
            return (
              <div 
                key={index}
                style={{
                  background: selectedSetList === index ? 'var(--surface-light)' : 'var(--surface)',
                  border: selectedSetList === index ? '2px solid var(--primary-color)' : '2px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedSetList(index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{setList.name}</h3>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleImport(setList)
                    }}
                    disabled={importing || matchedCount === 0}
                    aria-label={`Import ${setList.name}`}
                  >
                    {importing ? '⏳ Importing...' : '➕ Import'}
                  </button>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>
                  {setList.description}
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  fontSize: '0.85rem',
                  color: allMatched ? 'var(--accent-green)' : (matchedCount > 0 ? 'var(--accent-warning)' : 'var(--accent-danger)')
                }}>
                  <span>
                    {allMatched ? '✅' : matchedCount > 0 ? '⚠️' : '❌'} 
                    {matchedCount} of {totalCount} songs available
                  </span>
                  {matchedCount === 0 && (
                    <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                      (Import example songs first)
                    </span>
                  )}
                </div>
                
                {selectedSetList === index && (
                  <details style={{ marginTop: '15px' }}>
                    <summary style={{ 
                      cursor: 'pointer', 
                      fontWeight: 600,
                      color: 'var(--primary-color)',
                      userSelect: 'none'
                    }}>
                      View song list
                    </summary>
                    <ul style={{ 
                      marginTop: '10px', 
                      paddingLeft: '20px',
                      fontSize: '0.85rem',
                      lineHeight: '1.8'
                    }}>
                      {setList.songNames.map((songName, idx) => {
                        const isMatched = songs.some(song => {
                          const fullName = song.artist ? `${song.artist} - ${song.name}` : song.name
                          return fullName === songName || 
                                 fullName.toLowerCase().includes(songName.toLowerCase()) ||
                                 songName.toLowerCase().includes(fullName.toLowerCase())
                        })
                        return (
                          <li key={idx} style={{ color: isMatched ? 'var(--text)' : 'var(--text-tertiary)' }}>
                            {isMatched ? '✓' : '✗'} {songName}
                          </li>
                        )
                      })}
                    </ul>
                  </details>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: 'var(--surface-light)',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <strong>💡 Tip:</strong> If songs aren't available, go to <strong>Songs</strong> view and use 
          <strong> Import Songs</strong> to add the example song library first.
        </div>
      </div>
    </div>
  )
}

