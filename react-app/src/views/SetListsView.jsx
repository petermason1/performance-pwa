import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import SetListModal from '../components/SetListModal'
import ExampleSetListsModal from '../components/ExampleSetListsModal'
import './SetListsView.css'

const TIME_SIGNATURE_DISPLAY = {
  '2': '2/4',
  '3': '3/4',
  '4': '4/4',
  '5': '5/4',
  '6': '6/8',
  '7': '7/8',
  '9': '9/8',
  '12': '12/8'
}

const QUICK_EDIT_SIGNATURE_OPTIONS = ['2', '3', '4', '5', '6', '7', '9', '12']

function formatTimeSignature(value) {
  if (!value) return '—'
  if (TIME_SIGNATURE_DISPLAY[value]) return TIME_SIGNATURE_DISPLAY[value]
  if (typeof value === 'string' && value.includes('/')) return value
  return `${value}/4`
}

function calculateSetListDuration(listSongs) {
    let totalSeconds = 0
    
  listSongs.forEach(song => {
    if (!song) return
      if (song.duration) {
        totalSeconds += song.duration * 60
      } else if (song.lyrics && song.lyrics.length > 0) {
        const lastLyric = song.lyrics[song.lyrics.length - 1]
        totalSeconds += lastLyric.time || 0
      } else {
        totalSeconds += 180
      }
    })
    
    return totalSeconds
  }

function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = Math.floor(totalSeconds % 60)
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

function SongQuickEditDrawer({ song, open, onClose, onSave, saving, error }) {
  const [form, setForm] = useState({ bpm: '', timeSignature: '4', metronomePresetName: '' })

  useEffect(() => {
    if (song) {
      setForm({
        bpm: song.bpm ?? '',
        timeSignature: song.timeSignature ? String(song.timeSignature) : '4',
        metronomePresetName: song.metronomePresetName || song.metronomePreset || ''
      })
    }
  }, [song])

  if (!open || !song) {
    return null
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const parsedBpm = Number(form.bpm)
    if (Number.isNaN(parsedBpm) || parsedBpm < 40 || parsedBpm > 300) {
      return
    }

    onSave({
      bpm: parsedBpm,
      timeSignature: form.timeSignature,
      metronomePresetName: form.metronomePresetName?.trim() || null
    })
  }

  return (
    <div className="setlist-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="setlist-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-edit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drawer-header">
          <h2 id="quick-edit-title">Quick Edit</h2>
          <p>{song.name}</p>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close quick edit">
            ×
          </button>
        </header>

        <form className="drawer-form" onSubmit={handleSubmit}>
          <label className="drawer-field">
            <span>BPM</span>
            <input
              type="number"
              name="bpm"
              min="40"
              max="300"
              value={form.bpm}
              onChange={handleChange}
              required
            />
          </label>

          <label className="drawer-field">
            <span>Time Signature</span>
            <select
              name="timeSignature"
              value={form.timeSignature}
              onChange={handleChange}
            >
              {QUICK_EDIT_SIGNATURE_OPTIONS.map(option => (
                <option key={option} value={option}>{formatTimeSignature(option)}</option>
              ))}
            </select>
          </label>

          <label className="drawer-field">
            <span>Metronome Preset</span>
            <input
              type="text"
              name="metronomePresetName"
              placeholder="e.g., Latin Groove"
              value={form.metronomePresetName}
              onChange={handleChange}
            />
            <small>Connects to preset library (coming soon).</small>
          </label>

          {error ? <div className="drawer-error" role="alert">{error}</div> : null}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </aside>
    </div>
  )
}

export default function SetListsView() {
  const {
    setLists,
    songs,
    addSetList,
    getSong,
    deleteSetList,
    refreshData,
    setCurrentView,
    updateSong
  } = useApp()

  const [showModal, setShowModal] = useState(false)
  const [editingSetList, setEditingSetList] = useState(null)
  const [showExamples, setShowExamples] = useState(false)
  const [drawerSong, setDrawerSong] = useState(null)
  const [drawerSaving, setDrawerSaving] = useState(false)
  const [drawerError, setDrawerError] = useState('')

  const totalSongs = useMemo(() => songs.length, [songs])
  const songsById = useMemo(() => {
    const map = new Map()
    songs.forEach(song => {
      if (song?.id) {
        map.set(song.id, song)
      }
    })
    return map
  }, [songs])

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

  const handleNewSetList = () => {
    setEditingSetList(null)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingSetList(null)
    refreshData()
  }

  const handleLoadSetList = (setList, targetView) => {
    if (!setList || !Array.isArray(setList.songIds) || setList.songIds.length === 0) {
      alert('Add at least one song before loading this set list.')
      return
    }

    localStorage.setItem('currentSetListId', setList.id)
    localStorage.setItem('currentSongIndex', '0')
    setCurrentView?.(targetView)
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { view: targetView } }))
  }

  const handleLoadSong = (setList, index, targetView) => {
    if (!setList || !Array.isArray(setList.songIds) || index < 0 || index >= setList.songIds.length) {
      return
    }
    localStorage.setItem('currentSetListId', setList.id)
    localStorage.setItem('currentSongIndex', String(index))
    setCurrentView?.(targetView)
    window.dispatchEvent(new CustomEvent('app:navigate', { detail: { view: targetView } }))
  }

  const handleOpenDrawer = (song) => {
    setDrawerError('')
    setDrawerSong(song)
  }

  const handleCloseDrawer = () => {
    if (drawerSaving) return
    setDrawerSong(null)
    setDrawerError('')
  }

  const handleSaveDrawer = async (values) => {
    if (!drawerSong) return
    try {
      setDrawerSaving(true)
      setDrawerError('')
      await updateSong(drawerSong.id, values)
      await refreshData()
      setDrawerSaving(false)
      setDrawerSong(null)
    } catch (error) {
      console.error(error)
      setDrawerError(error?.message || 'Failed to save song')
      setDrawerSaving(false)
    }
  }

  return (
    <div className="setlists-view">
      <header>
        <div>
        <h1>Set Lists</h1>
          <p className="header-subtitle">{setLists.length} lists • {totalSongs} songs in library</p>
        </div>
        <button className="btn btn-primary" onClick={handleNewSetList}>
          New Set List
        </button>
      </header>
      
      <div className="setlists-container">
        {setLists.length === 0 ? (
          <div className="empty-state" role="status">
            <p className="empty-title">No set lists yet. Get started quickly:</p>
            <div className="empty-actions">
              <button
                className="btn btn-primary"
                onClick={() => setShowExamples(true)}
                aria-label="Browse and import example set lists"
              >
                📋 Import Example Set Lists
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentView?.('songs')}
                aria-label="Go to Songs view to import example songs"
              >
                📥 Import Example Songs
              </button>
              <button
                className="btn"
                onClick={handleNewSetList}
                aria-label="Create a new set list"
              >
                ➕ Create New Set List
              </button>
            </div>
          </div>
        ) : (
          setLists.map(setList => {
            const displaySongs = setList.songIds
              .map(id => songsById.get(id))
              .filter(Boolean)
            const missingSongCount = setList.songIds.length - displaySongs.length
            const isLoadingSongs = setList.songIds.length > 0 && songsById.size === 0
            const setListSongs = displaySongs
            const totalDuration = calculateSetListDuration(setListSongs)
            const avgBPM = setListSongs.length > 0 ?
              Math.round(setListSongs.reduce((sum, song) => sum + (song?.bpm || 0), 0) / setListSongs.length) : 0

            return (
              <div key={setList.id} className="setlist-card">
                <div className="card-header">
                  <div className="card-heading">
                  <h3>{setList.name}</h3>
                    <p className="card-meta">
                      {isLoadingSongs
                        ? 'Loading…'
                        : `${setListSongs.length} song${setListSongs.length === 1 ? '' : 's'}${missingSongCount > 0 ? ` (${missingSongCount} missing)` : ''} • ${formatDuration(totalDuration)}`
                      }
                      {avgBPM > 0 ? ` • Avg ${avgBPM} BPM` : ''}
                    </p>
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn-icon view-setlist"
                      onClick={() => handleLoadSetList(setList, 'performance')}
                      title="Load in Performance"
                      disabled={isLoadingSongs}
                    >
                      🚀
                    </button>
                    <button
                      className="btn-icon edit-setlist"
                      onClick={() => handleEdit(setList)}
                      title="Edit set list"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon delete-setlist"
                      onClick={() => handleDelete(setList)}
                      title="Delete set list"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <div className="setlist-summary">
                    <div className="summary-chip">{isLoadingSongs ? 'Loading…' : `${setListSongs.length} songs`}</div>
                    <div className="summary-chip">{isLoadingSongs ? '…' : formatDuration(totalDuration)}</div>
                    <div className="summary-chip">{isLoadingSongs ? '— Avg BPM' : (avgBPM > 0 ? `${avgBPM} Avg BPM` : '— Avg BPM')}</div>
                  </div>

                  {(!isLoadingSongs && missingSongCount > 0) && (
                    <div className="setlist-warning" role="status">
                      ⚠ Missing {missingSongCount} song{missingSongCount === 1 ? '' : 's'} from your library.
                    </div>
                  )}

                  <div className="setlist-quick-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleLoadSetList(setList, 'performance')}
                      disabled={isLoadingSongs}
                    >
                      Performance View
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleLoadSetList(setList, 'stage')}
                      disabled={isLoadingSongs}
                    >
                      Launch Stage Mode
                    </button>
                  </div>

                  <div className="setlist-song-table" role="list">
                    {isLoadingSongs ? (
                      <div className="song-row empty">Loading songs…</div>
                    ) : setListSongs.length === 0 ? (
                      <div className="song-row empty">Add songs to this set list to prepare it for performance.</div>
                    ) : (
                      setListSongs.map((song, index) => (
                        <div key={song.id || `${index}`} className="song-row" role="listitem">
                          <div className="song-index">{index + 1}</div>
                          <div className="song-title">
                            <span className="song-name">{song?.name || 'Untitled song'}</span>
                            {song?.artist ? <span className="song-artist">{song.artist}</span> : null}
                          </div>
                          <div className="song-metrics">
                            <span className="metric-tag">{song?.bpm ? `${song.bpm} BPM` : '— BPM'}</span>
                            <span className="metric-tag">{formatTimeSignature(song?.timeSignature)}</span>
                            <span className="metric-tag muted">{song?.metronomePresetName || song?.metronomePreset || song?.helixPreset || 'Manual'}</span>
                          </div>
                          <div className="song-actions">
                            <button
                              type="button"
                              className="song-action"
                              onClick={() => handleLoadSong(setList, index, 'performance')}
                              title="Load in Performance"
                            >
                              Play
                            </button>
                            <button
                              type="button"
                              className="song-action"
                              onClick={() => handleLoadSong(setList, index, 'stage')}
                              title="Load in Stage Mode"
                            >
                              Stage
                            </button>
                            <button
                              type="button"
                              className="song-action"
                              onClick={() => handleOpenDrawer(song)}
                              title="Quick edit song"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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

      {showExamples && (
        <ExampleSetListsModal
          songs={songs}
          onImport={addSetList}
          onClose={() => setShowExamples(false)}
        />
      )}

      <SongQuickEditDrawer
        song={drawerSong}
        open={Boolean(drawerSong)}
        onClose={handleCloseDrawer}
        onSave={handleSaveDrawer}
        saving={drawerSaving}
        error={drawerError}
      />
    </div>
  )
}
