import { useState, useEffect } from 'react'
import { useApp } from '../hooks/useApp'
import { getGenres } from '../utils/genres'

function sanitizeInteger(value, { min, max, fallback }) {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  let next = parsed

  if (typeof min === 'number') {
    next = Math.max(next, min)
  }

  if (typeof max === 'number') {
    next = Math.min(next, max)
  }

  return next
}

export default function SongModal({ song, onClose }) {
  const { addSong, updateSong } = useApp()
  
  const [formData, setFormData] = useState({
    name: '',
    bpm: 120,
    timeSignature: 4,
    helixPreset: '',
    genre: '',
    helixPresetNumber: '',
    duration: '',
    lyrics: '',
    midiNotes: '',
    accentPattern: null,
    polyrhythm: null
  })

  useEffect(() => {
    if (song) {
      const safeBpm = sanitizeInteger(song.bpm, { min: 40, max: 300, fallback: 120 })
      const safeTimeSignature = sanitizeInteger(song.timeSignature, { min: 1, max: 16, fallback: 4 })
      const presetNumberRaw = song.helixPresetNumber
      const safePresetNumber = Number.isFinite(presetNumberRaw)
        ? sanitizeInteger(presetNumberRaw, { min: 0, max: 127, fallback: null })
        : ''

      setFormData({
        name: song.name || song.title || '',
        bpm: safeBpm,
        timeSignature: safeTimeSignature,
        helixPreset: song.helixPreset || '',
        helixPresetNumber: safePresetNumber ?? '',
        duration: song.duration ? song.duration.toString() : '',
        lyrics: song.lyrics || '',
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

    setFormData(prev => {
      if (name === 'bpm' || name === 'timeSignature') {
        if (value === '') {
          return { ...prev, [name]: '' }
        }

        const parsed = Number.parseInt(value, 10)
        return Number.isFinite(parsed)
          ? { ...prev, [name]: parsed }
          : prev
      }

      if (name === 'helixPresetNumber') {
        if (value === '') {
          return { ...prev, helixPresetNumber: '' }
        }

        const parsed = Number.parseInt(value, 10)
        return Number.isFinite(parsed)
          ? { ...prev, helixPresetNumber: parsed }
          : prev
      }

      if (name === 'duration') {
        if (value === '') {
          return { ...prev, duration: '' }
        }

        const parsed = Number.parseFloat(value)
        return Number.isFinite(parsed)
          ? { ...prev, duration: value }
          : prev
      }

      return {
        ...prev,
        [name]: value
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const midiNotes = formData.midiNotes
      .split(',')
      .map(n => Number.parseInt(n.trim(), 10))
      .filter(n => !Number.isNaN(n))

    const bpmValue = sanitizeInteger(formData.bpm, { min: 40, max: 300, fallback: 120 })
    const timeSignatureValue = sanitizeInteger(formData.timeSignature, { min: 1, max: 16, fallback: 4 })
    const helixPresetNumberValue = formData.helixPresetNumber !== ''
      ? sanitizeInteger(formData.helixPresetNumber, { min: 0, max: 127, fallback: null })
      : null
    const parsedDuration = formData.duration === '' ? null : Number.parseFloat(formData.duration)
    const durationValue = parsedDuration !== null && Number.isFinite(parsedDuration) && parsedDuration >= 0 && parsedDuration <= 60
      ? parsedDuration
      : null
    const trimmedName = formData.name.trim()
    
    const songData = {
      name: trimmedName,
      title: trimmedName,
      bpm: bpmValue,
      timeSignature: timeSignatureValue,
      helixPreset: formData.helixPreset || null,
      helixPresetNumber: helixPresetNumberValue,
      lyrics: formData.lyrics.trim() || null,
      lyricsFormat: 'plain',
      midiNotes,
      accentPattern: formData.accentPattern,
      polyrhythm: formData.polyrhythm,
      duration: durationValue
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
            <small>Optional: Song duration for setlist planning</small>
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
            <label htmlFor="song-helix-preset-number" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎹</span>
              <span>Helix Preset</span>
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ flex: '1' }}>
                <input
                  type="number"
                  id="song-helix-preset-number"
                  name="helixPresetNumber"
                  min="0"
                  max="127"
                  value={formData.helixPresetNumber}
                  onChange={handleChange}
                  placeholder="0-127"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid var(--border)',
                    fontSize: '1rem'
                  }}
                />
                <small style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                  Program number (0-127) to auto-send when song loads
                </small>
                {formData.helixPresetNumber !== '' && formData.helixPresetNumber !== null && (() => {
                  try {
                    const { getPresetName } = require('../utils/presetNames')
                    const name = getPresetName(Number.parseInt(formData.helixPresetNumber, 10))
                    return name ? (
                      <small style={{ display: 'block', marginTop: '2px', color: 'var(--color-accent-cyan)', fontStyle: 'italic' }}>
                        Named: {name}
                      </small>
                    ) : null
                  } catch {
                    return null
                  }
                })()}
              </div>
              <div style={{ flex: '1' }}>
                <input
                  type="text"
                  id="song-helix-preset"
                  name="helixPreset"
                  value={formData.helixPreset}
                  onChange={handleChange}
                  placeholder="Preset name (optional)"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid var(--border)',
                    fontSize: '1rem'
                  }}
                />
                <small style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                  Optional: Name for this preset (e.g., "Clean Chorus")
                </small>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="song-genre">
              <span>🎵</span>
              <span>Genre</span>
            </label>
            <select
              id="song-genre"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '2px solid var(--border)',
                fontSize: '1rem'
              }}
            >
              <option value="">No genre</option>
              {availableGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
            <small style={{ display: 'block', marginTop: '4px', color: 'var(--color-text-secondary)' }}>
              Optional: Categorize songs for easier filtering
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="song-lyrics">Lyrics (optional)</label>
            <textarea
              id="song-lyrics"
              name="lyrics"
              rows="10"
              value={formData.lyrics}
              onChange={handleChange}
              placeholder="Enter song lyrics, one line per verse/chorus&#10;&#10;Verse 1&#10;Line 1&#10;Line 2&#10;&#10;Chorus&#10;Line 1&#10;Line 2"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.95rem',
                lineHeight: '1.6'
              }}
            />
            <small>Enter plain text lyrics for reference during performance</small>
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
