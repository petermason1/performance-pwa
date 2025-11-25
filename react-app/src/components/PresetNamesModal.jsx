import { useState, useEffect } from 'react'
import { getPresetNames, setPresetName, deletePresetName, clearPresetNames } from '../utils/presetNames'

export default function PresetNamesModal({ onClose }) {
  const [presetNames, setPresetNamesState] = useState({})
  const [editingPreset, setEditingPreset] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newPresetNumber, setNewPresetNumber] = useState('')
  const [newPresetName, setNewPresetName] = useState('')
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    loadPresetNames()
  }, [])

  const loadPresetNames = () => {
    setPresetNamesState(getPresetNames())
  }

  const handleSave = (presetNumber, name) => {
    try {
      setPresetName(presetNumber, name)
      loadPresetNames()
      setEditingPreset(null)
      setEditValue('')
      setFeedback({ message: 'Preset name saved', variant: 'success' })
      setTimeout(() => setFeedback(null), 2000)
    } catch (error) {
      setFeedback({ message: `Error: ${error.message}`, variant: 'error' })
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const handleDelete = (presetNumber) => {
    if (!confirm(`Delete name for preset ${presetNumber}?`)) return
    try {
      deletePresetName(presetNumber)
      loadPresetNames()
      setFeedback({ message: 'Preset name deleted', variant: 'success' })
      setTimeout(() => setFeedback(null), 2000)
    } catch (error) {
      setFeedback({ message: `Error: ${error.message}`, variant: 'error' })
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const handleAddNew = () => {
    const presetNum = Number.parseInt(newPresetNumber, 10)
    if (!Number.isFinite(presetNum) || presetNum < 0 || presetNum > 127) {
      setFeedback({ message: 'Preset number must be between 0 and 127', variant: 'error' })
      setTimeout(() => setFeedback(null), 3000)
      return
    }
    if (!newPresetName.trim()) {
      setFeedback({ message: 'Please enter a name', variant: 'error' })
      setTimeout(() => setFeedback(null), 3000)
      return
    }
    handleSave(presetNum, newPresetName)
    setNewPresetNumber('')
    setNewPresetName('')
  }

  const handleClearAll = () => {
    if (!confirm('Clear all preset names? This cannot be undone.')) return
    try {
      clearPresetNames()
      loadPresetNames()
      setFeedback({ message: 'All preset names cleared', variant: 'success' })
      setTimeout(() => setFeedback(null), 2000)
    } catch (error) {
      setFeedback({ message: `Error: ${error.message}`, variant: 'error' })
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const sortedPresets = Object.entries(presetNames)
    .map(([num, name]) => ({ number: Number.parseInt(num, 10), name }))
    .sort((a, b) => a.number - b.number)

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>🎹 Helix Preset Names</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          Assign custom names to your Helix presets (0-127) for easier identification.
        </p>

        {feedback && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: feedback.variant === 'success' 
              ? 'rgba(0, 255, 0, 0.1)' 
              : 'rgba(255, 0, 0, 0.1)',
            border: `1px solid ${feedback.variant === 'success' ? 'var(--accent-green)' : 'var(--error-color)'}`,
            color: feedback.variant === 'success' ? 'var(--accent-green)' : 'var(--error-color)'
          }}>
            {feedback.message}
          </div>
        )}

        {/* Add New Preset Name */}
        <div style={{ 
          padding: '16px', 
          background: 'var(--color-bg-tertiary)', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Add New Preset Name</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 120px' }}>
              <label htmlFor="new-preset-number" style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                Preset Number
              </label>
              <input
                type="number"
                id="new-preset-number"
                min="0"
                max="127"
                value={newPresetNumber}
                onChange={(e) => setNewPresetNumber(e.target.value)}
                placeholder="0-127"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '2px solid var(--border)',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ flex: '1' }}>
              <label htmlFor="new-preset-name" style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>
                Name
              </label>
              <input
                type="text"
                id="new-preset-name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g., Clean Strat, Sweet Child Lead"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNew()
                  }
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '2px solid var(--border)',
                  fontSize: '1rem'
                }}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddNew}
              disabled={!newPresetNumber || !newPresetName.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {/* Existing Preset Names */}
        {sortedPresets.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: '8px'
          }}>
            No preset names configured yet. Add one above to get started.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Configured Presets ({sortedPresets.length})</h3>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearAll}
                style={{ fontSize: '0.9rem', padding: '6px 12px' }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {sortedPresets.map(({ number, name }) => (
                <div
                  key={number}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-glass-border)'
                  }}
                >
                  <div style={{ 
                    flex: '0 0 60px', 
                    fontWeight: 'bold', 
                    color: 'var(--color-accent-cyan)' 
                  }}>
                    #{number}
                  </div>
                  {editingPreset === number ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSave(number, editValue)
                          } else if (e.key === 'Escape') {
                            setEditingPreset(null)
                            setEditValue('')
                          }
                        }}
                        autoFocus
                        style={{
                          flex: '1',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '2px solid var(--color-accent-cyan)',
                          fontSize: '1rem'
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleSave(number, editValue)}
                        style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingPreset(null)
                          setEditValue('')
                        }}
                        style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: '1', fontWeight: '500' }}>{name}</div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingPreset(number)
                          setEditValue(name)
                        }}
                        style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleDelete(number)}
                        style={{ fontSize: '0.9rem', padding: '6px 12px' }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

