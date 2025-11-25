import { useState, useEffect } from 'react'
import { midiController } from '../midi'

export default function MIDIControlModal({ currentSong, onClose }) {
  const [selectedPreset, setSelectedPreset] = useState(currentSong?.helixPresetNumber ?? '')
  const [status, setStatus] = useState('checking')
  const [helixOutput, setHelixOutput] = useState(null)
  const [sendFeedback, setSendFeedback] = useState(null)

  useEffect(() => {
    const updateStatus = async () => {
      if (!midiController.isSupported) {
        setStatus('not_supported')
        return
      }

      if (midiController.outputs.length === 0) {
        const initialized = await midiController.initialize()
        if (!initialized || midiController.outputs.length === 0) {
          setStatus('no_device')
          return
        }
      }

      const helix = midiController.getHelixOutput()
      if (helix) {
        setStatus('connected')
        setHelixOutput(helix)
      } else {
        setStatus('no_helix')
      }
    }

    updateStatus()
  }, [])

  const handleSendPreset = () => {
    if (selectedPreset === '' || selectedPreset === null) {
      setSendFeedback({ message: 'Please select a preset number', variant: 'error' })
      setTimeout(() => setSendFeedback(null), 3000)
      return
    }

    const presetNumber = Number.parseInt(selectedPreset, 10)
    if (!Number.isFinite(presetNumber) || presetNumber < 0 || presetNumber > 127) {
      setSendFeedback({ message: 'Preset must be between 0 and 127', variant: 'error' })
      setTimeout(() => setSendFeedback(null), 3000)
      return
    }

    if (status !== 'connected') {
      setSendFeedback({ message: 'Helix not connected. Check MIDI settings.', variant: 'error' })
      setTimeout(() => setSendFeedback(null), 3000)
      return
    }

    const success = midiController.sendProgramChange(presetNumber, 0, true)
    if (success) {
      setSendFeedback({ 
        message: `Preset ${presetNumber} sent successfully`, 
        variant: 'success' 
      })
      setTimeout(() => setSendFeedback(null), 3000)
    } else {
      setSendFeedback({ 
        message: 'Failed to send preset. Check MIDI connection.', 
        variant: 'error' 
      })
      setTimeout(() => setSendFeedback(null), 3000)
    }
  }

  const statusMessages = {
    checking: 'Checking MIDI status...',
    connected: `Connected: ${helixOutput?.name || 'Helix'}`,
    no_helix: 'No Helix output selected. Go to MIDI Settings to configure.',
    no_device: 'No MIDI devices found. Connect your Helix and refresh.',
    not_supported: 'Web MIDI API not supported in this browser.'
  }

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>MIDI Control</h2>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            background: status === 'connected' 
              ? 'rgba(0, 255, 0, 0.1)' 
              : 'rgba(255, 200, 0, 0.1)',
            border: `1px solid ${status === 'connected' ? 'var(--accent-green)' : 'var(--warning-color)'}`,
            marginBottom: '16px'
          }}>
            <strong>Status:</strong> {statusMessages[status]}
          </div>

          {currentSong && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-bg-tertiary)', borderRadius: '8px' }}>
              <strong>Current Song:</strong> {currentSong.name}
              {currentSong.helixPresetNumber !== null && currentSong.helixPresetNumber !== undefined && (
                <div style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Assigned Preset: {currentSong.helixPresetNumber}
                  {currentSong.helixPreset && ` (${currentSong.helixPreset})`}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="midi-preset-select">Helix Preset Number (0-127)</label>
          <input
            type="number"
            id="midi-preset-select"
            min="0"
            max="127"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value === '' ? '' : Number.parseInt(e.target.value, 10))}
            placeholder="Enter preset number"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid var(--border)',
              fontSize: '1rem',
              marginBottom: '8px'
            }}
          />
          <small>Send a program change to your Helix without changing the song</small>
        </div>

        {sendFeedback && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: sendFeedback.variant === 'success' 
              ? 'rgba(0, 255, 0, 0.1)' 
              : 'rgba(255, 0, 0, 0.1)',
            border: `1px solid ${sendFeedback.variant === 'success' ? 'var(--accent-green)' : 'var(--error-color)'}`,
            color: sendFeedback.variant === 'success' ? 'var(--accent-green)' : 'var(--error-color)'
          }}>
            {sendFeedback.message}
          </div>
        )}

        <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSendPreset}
            disabled={status !== 'connected' || selectedPreset === ''}
          >
            Send Preset
          </button>
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

