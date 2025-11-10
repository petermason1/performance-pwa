import { useState, useEffect } from 'react'
import { getAccentPresets, savePreset } from '../utils/presets'

export default function PresetSelector({ 
  timeSignature, 
  currentPattern, 
  onApplyPreset,
  onSaveAsPreset 
}) {
  const [presets, setPresets] = useState([])
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState('')

  useEffect(() => {
    loadPresets()
  }, [timeSignature])

  const loadPresets = async () => {
    const all = await getAccentPresets()
    // Filter by matching time signature
    const matching = all.filter(p => p.timeSignature === timeSignature)
    setPresets(matching)
  }

  const handleApplyPreset = async (presetId) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setSelectedPresetId(presetId)
      onApplyPreset(preset.pattern, preset.name)
    }
  }

  const handleSaveCurrent = async () => {
    if (!presetName.trim()) return
    
    const newPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      pattern: currentPattern,
      timeSignature,
      scope: 'global',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await savePreset(newPreset)
    await loadPresets()
    setShowSaveDialog(false)
    setPresetName('')
    setSelectedPresetId(newPreset.id)
  }

  const canSaveCurrent = currentPattern && currentPattern.some(p => p === true)

  return (
    <div className="preset-selector" style={{ marginTop: '15px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="preset-select" style={{ fontWeight: '600' }}>
          Quick Presets:
        </label>
        <select
          id="preset-select"
          value={selectedPresetId}
          onChange={(e) => {
            if (e.target.value) {
              handleApplyPreset(e.target.value)
            } else {
              setSelectedPresetId('')
            }
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '2px solid var(--border)',
            background: 'var(--surface-light)',
            color: 'var(--text)',
            fontSize: '0.9rem',
            minWidth: '200px'
          }}
          aria-label="Select accent pattern preset"
        >
          <option value="">Choose a preset...</option>
          {presets.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name} {preset.description ? `- ${preset.description}` : ''}
            </option>
          ))}
        </select>

        {canSaveCurrent && (
          <>
            {!showSaveDialog ? (
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setShowSaveDialog(true)}
                aria-label="Save current pattern as preset"
              >
                💾 Save Current as Preset
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '2px solid var(--primary-color)',
                    background: 'var(--surface-light)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    minWidth: '150px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveCurrent()
                    } else if (e.key === 'Escape') {
                      setShowSaveDialog(false)
                      setPresetName('')
                    }
                  }}
                  autoFocus
                />
                <button
                  className="btn btn-primary btn-small"
                  onClick={handleSaveCurrent}
                  disabled={!presetName.trim()}
                >
                  Save
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setShowSaveDialog(false)
                    setPresetName('')
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
