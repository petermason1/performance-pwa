import { useState, useEffect } from 'react'
import { useApp } from '../hooks/useApp'
import { parseLyrics, formatLyrics } from '../models'

export default function SongModal({ song, onClose }) {
  const { addSong, updateSong } = useApp()
  
  const [formData, setFormData] = useState({
    name: '',
    bpm: 120,
    timeSignature: 4,
    helixPreset: '',
    helixPresetNumber: '',
    duration: '',
    lyrics: '',
    midiNotes: '',
    accentPattern: null,
    polyrhythm: null
  })

  useEffect(() => {
    if (song) {
      setFormData({
        name: song.name || '',
        bpm: song.bpm || 120,
        timeSignature: song.timeSignature || 4,
        helixPreset: song.helixPreset || '',
        helixPresetNumber: song.helixPresetNumber !== undefined ? song.helixPresetNumber : '',
        duration: song.duration ? song.duration.toString() : '',
        lyrics: formatLyrics(song.lyrics || []),
        midiNotes: song.midiNotes ? song.midiNotes.join(',') : '',
        accentPattern: song.accentPattern || null,
        polyrhythm: song.polyrhythm || null
      })
    } else {
      // Reset to defaults for new song
      setFormData({
        name: '',
        bpm: 120,
        timeSignature: 4,
        helixPreset: '',
        helixPresetNumber: '',
        duration: '',
        lyrics: '',
        midiNotes: '',
        accentPattern: null,
        polyrhythm: null
      })
    }
  }, [song])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'bpm' || name === 'timeSignature' ? parseInt(value) || 0 :
              name === 'helixPresetNumber' || name === 'duration' ? value :
              value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const lyrics = parseLyrics(formData.lyrics)
    const midiNotes = formData.midiNotes
      .split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n))
    
    const songData = {
      name: formData.name,
      bpm: formData.bpm,
      timeSignature: formData.timeSignature,
      helixPreset: formData.helixPreset || null,
      helixPresetNumber: formData.helixPresetNumber !== '' ? parseInt(formData.helixPresetNumber) : null,
      lyrics,
      midiNotes,
      accentPattern: formData.accentPattern,
      polyrhythm: formData.polyrhythm,
      duration: formData.duration ? parseFloat(formData.duration) : 
                (lyrics.length > 0 ? lyrics[lyrics.length - 1].time / 60 : null)
    }

    if (song?.id) {
      updateSong(song.id, songData)
    } else {
      addSong(songData)
    }
    
    onClose()
  }

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>{song ? 'Edit Song' : 'New Song'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="song-name">Song Name</label>
            <input
              type="text"
              id="song-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-bpm">BPM</label>
            <input
              type="number"
              id="song-bpm"
              name="bpm"
              min="40"
              max="300"
              value={formData.bpm}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-duration">Duration (minutes)</label>
            <input
              type="number"
              id="song-duration"
              name="duration"
              min="0"
              max="60"
              step="0.1"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 3.5"
            />
            <small>Leave empty to calculate from lyrics timestamps</small>
          </div>

          <div className="form-group">
            <label htmlFor="song-time-signature">Time Signature</label>
            <select
              id="song-time-signature"
              name="timeSignature"
              value={formData.timeSignature}
              onChange={handleChange}
            >
              <option value="4">4/4</option>
              <option value="3">3/4</option>
              <option value="2">2/4</option>
              <option value="6">6/8</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="song-helix-preset">Helix Preset Name</label>
            <input
              type="text"
              id="song-helix-preset"
              name="helixPreset"
              value={formData.helixPreset}
              onChange={handleChange}
              placeholder="e.g., Clean Chorus"
            />
          </div>

          <div className="form-group">
            <label htmlFor="song-helix-preset-number">Helix Preset Number (0-127)</label>
            <input
              type="number"
              id="song-helix-preset-number"
              name="helixPresetNumber"
              min="0"
              max="127"
              value={formData.helixPresetNumber}
              onChange={handleChange}
              placeholder="Auto-send preset change via MIDI"
            />
            <small>Program number to send when song loads (via MIDI). Leave empty to disable auto-switching.</small>
          </div>

          <div className="form-group">
            <label htmlFor="song-lyrics">Lyrics (with timestamps)</label>
            <textarea
              id="song-lyrics"
              name="lyrics"
              rows="10"
              value={formData.lyrics}
              onChange={handleChange}
              placeholder="Format: [00:00.00] Line 1&#10;[00:04.00] Line 2&#10;[00:08.00] Line 3"
            />
            <small>Format: [MM:SS.mm] Your lyrics here</small>
          </div>

          <div className="form-group">
            <label htmlFor="song-midi-notes">MIDI Light Notes (comma-separated)</label>
            <input
              type="text"
              id="song-midi-notes"
              name="midiNotes"
              value={formData.midiNotes}
              onChange={handleChange}
              placeholder="e.g., 36,40,44"
            />
            <small>MIDI note numbers for lighting cues</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
