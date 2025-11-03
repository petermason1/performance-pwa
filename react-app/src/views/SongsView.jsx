import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import SongModal from '../components/SongModal'
import ImportSongsModal from '../components/ImportSongsModal'
import ExportImportModal from '../components/ExportImportModal'
import { exampleSongsData, parseExampleSongs } from '../utils/exampleSongs'

export default function SongsView() {
  const { songs, deleteSong, addSong, refreshData } = useApp()
  const [showSongModal, setShowSongModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('songSortBy') || 'artist')

  const sortedSongs = [...songs].sort((a, b) => {
    const nameA = (a.name || '').toLowerCase().trim()
    const nameB = (b.name || '').toLowerCase().trim()
    const artistA = (a.artist || '').toLowerCase().trim()
    const artistB = (b.artist || '').toLowerCase().trim()
    
    if (sortBy === 'title') {
      const nameCompare = nameA.localeCompare(nameB)
      if (nameCompare !== 0) return nameCompare
      return artistA.localeCompare(artistB)
    } else {
      if (artistA !== artistB) return artistA.localeCompare(artistB)
      return nameA.localeCompare(nameB)
    }
  })

  const handleSortChange = (e) => {
    const newSort = e.target.value
    setSortBy(newSort)
    localStorage.setItem('songSortBy', newSort)
  }

  const handleImportExamples = () => {
    if (!confirm('Import example songs? This will add 85+ example songs to your library.\n\nDuplicates (by name) will be skipped.')) {
      return
    }
    
    try {
      const exampleSongs = parseExampleSongs(exampleSongsData)
      const existingNames = new Set(songs.map(s => `${s.name}|${s.artist || ''}`.toLowerCase()))
      
      let added = 0
      let skipped = 0
      
      exampleSongs.forEach(song => {
        const key = `${song.name}|${song.artist || ''}`.toLowerCase()
        if (!existingNames.has(key)) {
          addSong(song)
          existingNames.add(key)
          added++
        } else {
          skipped++
        }
      })
      
      refreshData()
      
      let message = `✅ Imported ${added} example song${added !== 1 ? 's' : ''}!`
      if (skipped > 0) {
        message += `\n(${skipped} duplicate${skipped !== 1 ? 's' : ''} skipped)`
      }
      alert(message)
    } catch (e) {
      console.error('Error importing examples:', e)
      alert('❌ Error importing example songs. Please try again.')
    }
  }

  return (
    <>
      <header>
        <h1>Songs</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <label htmlFor="song-sort-select" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sort:</label>
            <select 
              id="song-sort-select" 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px', fontSize: '0.9rem' }}
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="title">By Title</option>
              <option value="artist">By Artist</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingSong(null); setShowSongModal(true) }}>
            New Song
          </button>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
            Import Songs
          </button>
          <button className="btn btn-secondary" onClick={() => setShowExportModal(true)}>
            Export Data
          </button>
          <button className="btn btn-secondary" onClick={() => setShowExportModal(true)}>
            Import Data
          </button>
        </div>
      </header>
      
      <div className="songs-container" id="songs-container">
        {sortedSongs.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ marginBottom: '20px', fontSize: '1.1rem' }}>No songs yet.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '400px', margin: '0 auto' }}>
              <button className="btn btn-primary" onClick={handleImportExamples}>
                📥 Import Example Songs (85+ songs)
              </button>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                Or create your first song manually
              </p>
            </div>
          </div>
        ) : (
          sortedSongs.map(song => (
            <div key={song.id} className="song-card">
              <div className="card-header">
                <h3>{song.name}{song.artist ? <span className="song-artist"> ({song.artist})</span> : ''}</h3>
                <div className="card-actions">
                  <button 
                    className="btn-icon edit-song" 
                    onClick={() => { setEditingSong(song); setShowSongModal(true) }}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-icon delete-song"
                    onClick={() => {
                      if (confirm('Delete this song?')) {
                        deleteSong(song.id)
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="card-body">
                <p><strong>BPM:</strong> {song.bpm}</p>
                <p><strong>Time Signature:</strong> {song.timeSignature || 4}/4</p>
                <p><strong>Helix Preset:</strong> {song.helixPreset || 'None'}</p>
                <p><strong>Lyrics:</strong> {song.lyrics ? song.lyrics.length + ' lines' : 'None'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {showSongModal && (
        <SongModal 
          song={editingSong} 
          onClose={() => { setShowSongModal(false); setEditingSong(null) }} 
        />
      )}
      
      {showImportModal && (
        <ImportSongsModal onClose={() => setShowImportModal(false)} />
      )}
      
      {showExportModal && (
        <ExportImportModal onClose={() => setShowExportModal(false)} />
      )}
    </>
  )
}

