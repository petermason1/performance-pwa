import { useEffect, useMemo, useState } from 'react'
import { midiController } from '../../midi'

const isValidProgram = (value) => {
  if (value === '' || value === null || value === undefined) return false
  const num = Number(value)
  return Number.isInteger(num) && num >= 0 && num <= 127
}

export default function HelixPresetModal({ currentSong, onClose, onSendPreset }) {
  const [programInput, setProgramInput] = useState(
    currentSong?.helixPresetNumber !== undefined && currentSong?.helixPresetNumber !== null
      ? String(currentSong.helixPresetNumber)
      : ''
  )
  const [outputs, setOutputs] = useState(() => [...(midiController.outputs || [])])
  const [selectedOutputId, setSelectedOutputId] = useState(() => midiController.getHelixOutput()?.id ?? midiController.output?.id ?? null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(midiController.outputs.length > 0)

  const helixConnected = useMemo(() => Boolean(midiController.getHelixOutput()), [outputs, selectedOutputId])

  useEffect(() => {
    let cancelled = false
    const ensureOutputs = async () => {
      if (!midiController.isSupported) return
      if (!initialized) {
        const success = await midiController.initialize()
        if (!success) {
          setError('Could not access MIDI devices. Check browser permissions.')
          return
        }
        if (cancelled) return
        setInitialized(true)
      }
      setOutputs([...(midiController.outputs || [])])
      setSelectedOutputId(midiController.getHelixOutput()?.id ?? midiController.output?.id ?? null)
    }

    ensureOutputs()

    return () => {
      cancelled = true
    }
  }, [initialized])

  const handleSelectOutput = (outputId) => {
    const index = midiController.outputs.findIndex(output => output.id === outputId)
    if (index >= 0) {
      midiController.setHelixOutput(index)
      setSelectedOutputId(outputId)
      setError('')
    }
  }

  const handleRefreshOutputs = async () => {
    if (!midiController.isSupported) {
      setError('Web MIDI is not supported in this browser.')
      return
    }
    setError('')
    const success = await midiController.initialize()
    if (!success) {
      setError('Unable to refresh MIDI devices. Check permissions or reconnect your Helix.')
      return
    }
    setOutputs([...(midiController.outputs || [])])
    setSelectedOutputId(midiController.getHelixOutput()?.id ?? midiController.output?.id ?? null)
  }

  const sendProgram = async (value) => {
    if (!isValidProgram(value)) {
      setError('Program number must be between 0 and 127.')
      return
    }

    if (!midiController.isSupported) {
      setError('Web MIDI is not supported in this browser.')
      return
    }

    if (!midiController.outputs.length) {
      const success = await midiController.initialize()
      if (!success) {
        setError('Unable to access MIDI outputs. Check browser permissions.')
        return
      }
      setOutputs([...(midiController.outputs || [])])
    }

    setIsSending(true)
    setError('')
    try {
      const ok = await onSendPreset(Number(value), { source: 'manual' })
      if (!ok) {
        setError('Failed to send program change. Verify the Helix output device.')
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="modal" style={{ display: 'block' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span role="img" aria-hidden="true">🎛️</span>
          Helix Preset Control
        </h2>

        <p style={{ color: '#666', marginTop: '-8px' }}>
          Manually resend or override the current Helix preset via MIDI program change.
        </p>

        <div style={{
          padding: '12px',
          borderRadius: '12px',
          border: `1px solid ${helixConnected ? 'rgba(40, 167, 69, 0.4)' : 'rgba(220, 53, 69, 0.4)'}`,
          background: helixConnected ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px'
        }}>
          <div>
            <strong>{helixConnected ? 'Helix output ready' : 'Helix output not selected'}</strong>
            <br />
            <small style={{ color: '#666' }}>
              {selectedOutputId ? `Routing to: ${midiController.getHelixOutput()?.name ?? 'Default output'}` : 'Choose an output below to route Helix presets.'}
            </small>
          </div>
          <button className="btn btn-secondary" onClick={handleRefreshOutputs} style={{ whiteSpace: 'nowrap' }}>
            Refresh Devices
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Helix Output Device</h3>
          {outputs.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              No MIDI outputs detected. Connect your Helix and click "Refresh Devices".
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {outputs.map(output => (
                <label key={output.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${selectedOutputId === output.id ? 'var(--color-accent-cyan)' : 'var(--border)'}`,
                  background: selectedOutputId === output.id ? 'rgba(0, 217, 255, 0.12)' : 'var(--surface-light)'
                }}>
                  <input
                    type="radio"
                    name="helix-output"
                    value={output.id}
                    checked={selectedOutputId === output.id}
                    onChange={() => handleSelectOutput(output.id)}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{output.name}</div>
                    <div style={{ color: '#666', fontSize: '0.85rem' }}>{output.manufacturer || 'Unknown manufacturer'}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Send Program Change</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="number"
              value={programInput}
              onChange={(e) => setProgramInput(e.target.value)}
              min="0"
              max="127"
              placeholder="Program # (0-127)"
              style={{
                flex: '1 1 160px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)'
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => sendProgram(programInput)}
              disabled={isSending}
              style={{ minWidth: '140px' }}
            >
              {isSending ? 'Sending…' : 'Send Program'}
            </button>
          </div>
          <small style={{ color: '#666' }}>
            Tip: Program numbers are zero-based. Helix preset 01A is program 0.
          </small>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Current Song</h4>
          {currentSong ? (
            <div style={{
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface-light)'
            }}>
              <div style={{ fontWeight: 600 }}>{currentSong.name}</div>
              <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>
                Assigned preset: {currentSong.helixPreset ?? '—'} ({currentSong.helixPresetNumber ?? 'not set'})
              </div>
              <div style={{ marginTop: '10px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => sendProgram(currentSong.helixPresetNumber)}
                  disabled={currentSong.helixPresetNumber === undefined || currentSong.helixPresetNumber === null || isSending}
                >
                  Resend Assigned Preset
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: '#666' }}>No song selected.</p>
          )}
        </div>

        {error && (
          <div style={{
            marginBottom: '18px',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(220, 53, 69, 0.4)',
            background: 'rgba(220, 53, 69, 0.12)',
            color: '#842029'
          }}>
            {error}
          </div>
        )}

        <div style={{ textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
