import { useState } from 'react'
import { useApp } from '../hooks/useApp'

export default function ImportSongsModal({ onClose }) {
  const { addSong, refreshData } = useApp()
  const [importData, setImportData] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!importData.trim()) {
      alert('Please paste song data')
      return
    }

    setIsImporting(true)
    const lines = importData.split('\n').filter(line => line.trim())
    const imported = []
    const errors = []

    lines.forEach((line, index) => {
      try {
        // Parse line - could be tab or space separated
        const parts = line.split(/\t|\s{2,}/).filter(p => p.trim())
        
        if (parts.length < 2) {
          // Try splitting by single space if no tabs found
          const spaceParts = line.trim().split(/\s+/)
          if (spaceParts.length >= 2) {
            // Last number is likely BPM
            const bpmMatch = spaceParts[spaceParts.length - 1].match(/\d+/)
            if (bpmMatch) {
              const bpm = parseInt(bpmMatch[0])
              const songName = spaceParts.slice(0, -1).join(' ').replace(/^\d+:\d+:\d+\s+(AM|PM)\s+/i, '').trim()
              
              if (songName && bpm >= 40 && bpm <= 300) {
                // Extract artist if format is "Artist - Song"
                let artist = ''
                let title = songName
                if (songName.includes(' - ')) {
                  const artistParts = songName.split(' - ')
                  artist = artistParts[0].trim()
                  title = artistParts.slice(1).join(' - ').trim()
                }
                
                // Get key if present
                let key = ''
                const keyParts = line.match(/\b([A-G](?:\s*(?:major|minor|maj|min))?)\b/i)
                if (keyParts) {
                  key = keyParts[1]
                }
                
                const song = {
                  name: title,
                  artist: artist,
                  bpm: bpm,
                  timeSignature: 4,
                  helixPreset: key || '',
                  lyrics: [],
                  midiNotes: []
                }
                
                addSong(song)
                imported.push(song)
                return
              }
            }
          }
          errors.push(`Line ${index + 1}: Could not parse - ${line.substring(0, 50)}...`)
          return
        }
        
        // Standard parsing: song name, BPM, optional key
        let songName = parts[0].trim()
        let bpm = null
        let key = ''
        
        // Find BPM (last numeric value between 40-300)
        for (let i = parts.length - 1; i >= 0; i--) {
          const num = parseInt(parts[i])
          if (!isNaN(num) && num >= 40 && num <= 300) {
            bpm = num
            // Everything before this is song name
            songName = parts.slice(0, i).join(' ').trim()
            // Check if there's a key after BPM
            if (i + 1 < parts.length) {
              const keyCandidate = parts[i + 1].trim().toUpperCase()
              if (/^[A-G](?:major|minor|maj|min)?$/i.test(keyCandidate)) {
                key = keyCandidate
              }
            }
            break
          }
        }
        
        // Clean song name - remove time stamps if present
        songName = songName.replace(/^\d+:\d+:\d+\s+(AM|PM)\s+/i, '').trim()
        
        if (!songName || !bpm) {
          errors.push(`Line ${index + 1}: Missing song name or BPM - ${line.substring(0, 50)}...`)
          return
        }
        
        // Extract artist if format is "Artist - Song"
        let artist = ''
        let title = songName
        if (songName.includes(' - ')) {
          const artistParts = songName.split(' - ')
          artist = artistParts[0].trim()
          title = artistParts.slice(1).join(' - ').trim()
        }
        
        const song = {
          name: title,
          artist: artist,
          bpm: bpm,
          timeSignature: 4,
          helixPreset: key || '',
          lyrics: [],
          midiNotes: []
        }
        
        addSong(song)
        imported.push(song)
        
      } catch (e) {
        errors.push(`Line ${index + 1}: Error - ${e.message}`)
      }
    })

    setIsImporting(false)

    let message = `Imported ${imported.length} song${imported.length !== 1 ? 's' : ''}.`
    if (errors.length > 0) {
      message += `\n\n${errors.length} error${errors.length !== 1 ? 's' : ''}:\n${errors.slice(0, 5).join('\n')}`
      if (errors.length > 5) {
        message += `\n...and ${errors.length - 5} more`
      }
    }
    
    alert(message)
    
    // Refresh data to show new songs
    refreshData()
    
    // Clear and close
    setImportData('')
    onClose()
  }

  const handleClose = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('close')) {
      onClose()
    }
  }

  return (
    <div className="modal" style={{ display: 'block' }} onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={handleClose}>&times;</span>
        <h2>Import Songs</h2>
        <p style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
          Paste your song list below. Each line should contain: Song Name, BPM, and optionally Key/Notes.
        </p>
        <form id="import-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="import-data">Song Data</label>
            <textarea
              id="import-data"
              rows={15}
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Arctic Monkeys - Bet You Look Good on the Dance Floor	204&#10;Arctic Monkeys - Mardy Bum	112&#10;Blink 182 - All The Small Things	152"
              disabled={isImporting}
            />
            <small>Format: Song Title (tab or space) BPM (tab or space) Key/Notes (optional)</small>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isImporting}>
              {isImporting ? 'Importing...' : 'Import'}
            </button>
            <button type="button" className="btn btn-secondary cancel-btn" onClick={onClose} disabled={isImporting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
