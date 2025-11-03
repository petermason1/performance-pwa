import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import SetListModal from '../components/SetListModal'

export default function SetListsView() {
  const { setLists, getSong, deleteSetList, refreshData } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingSetList, setEditingSetList] = useState(null)

  const calculateSetListDuration = (songs) => {
    let totalSeconds = 0
    
    songs.forEach(song => {
      if (song.duration) {
        // Use manually entered duration (in minutes)
        totalSeconds += song.duration * 60
      } else if (song.lyrics && song.lyrics.length > 0) {
        // Calculate from last lyric timestamp
        const lastLyric = song.lyrics[song.lyrics.length - 1]
        totalSeconds += lastLyric.time || 0
      } else {
        // Default estimate: assume 3 minutes if no duration
        totalSeconds += 180
      }
    })
    
    return totalSeconds
  }

  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = Math.floor(totalSeconds % 60)
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const handleEdit = (setList) => {
    setEditingSetList(setList)
    setShowModal(true)
  }

  const handleDelete = (setList) => {
    if (confirm('Delete this set list?')) {
      deleteSetList(setList.id)
      refreshData()
    }
  }

  const handleView = (setList) => {
    // For now, just show an alert with details
    // TODO: Implement full detail/print view
    const songs = setList.songIds.map(id => getSong(id)).filter(s => s)
    const totalDuration = calculateSetListDuration(songs)
    const avgBPM = songs.length > 0 ? 
      Math.round(songs.reduce((sum, s) => sum + (s.bpm || 0), 0) / songs.length) : 0
    
    let message = `${setList.name}\n\n`
    message += `${songs.length} song${songs.length !== 1 ? 's' : ''}\n`
    message += `Duration: ${formatDuration(totalDuration)}\n`
    if (avgBPM > 0) message += `Avg BPM: ${avgBPM}\n`
    message += `\nSongs:\n`
    songs.forEach((song, index) => {
      message += `${index + 1}. ${song.name}${song.artist ? ` (${song.artist})` : ''} - ${song.bpm} BPM\n`
    })
    
    alert(message)
  }

  const handleNewSetList = () => {
    setEditingSetList(null)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingSetList(null)
    refreshData()
  }

  return (
    <div>
      <header>
        <h1>Set Lists</h1>
        <button className="btn btn-primary" onClick={handleNewSetList}>
          New Set List
        </button>
      </header>
      
      <div className="setlists-container">
        {setLists.length === 0 ? (
          <p className="empty-state">No set lists yet. Create your first set list!</p>
        ) : (
          setLists.map(setList => {
            const songs = setList.songIds.map(id => getSong(id)).filter(s => s)
            const totalDuration = calculateSetListDuration(songs)
            const avgBPM = songs.length > 0 ? 
              Math.round(songs.reduce((sum, s) => sum + (s.bpm || 0), 0) / songs.length) : 0

            return (
              <div key={setList.id} className="setlist-card">
                <div className="card-header">
                  <h3>{setList.name}</h3>
                  <div className="card-actions">
                    <button
                      className="btn-icon view-setlist"
                      onClick={() => handleView(setList)}
                      title="View/Print"
                    >
                      👁️
                    </button>
                    <button
                      className="btn-icon edit-setlist"
                      onClick={() => handleEdit(setList)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon delete-setlist"
                      onClick={() => handleDelete(setList)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <p><strong>{songs.length}</strong> song{songs.length !== 1 ? 's' : ''}</p>
                  <p><strong>Duration:</strong> {formatDuration(totalDuration)}</p>
                  {avgBPM > 0 && <p><strong>Avg BPM:</strong> {avgBPM}</p>}
                  <ul className="song-list-inline">
                    {songs.slice(0, 5).map(s => (
                      <li key={s.id}>{s.name}</li>
                    ))}
                    {songs.length > 5 && (
                      <li><em>...and {songs.length - 5} more</em></li>
                    )}
                  </ul>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showModal && (
        <SetListModal
          setList={editingSetList}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}
