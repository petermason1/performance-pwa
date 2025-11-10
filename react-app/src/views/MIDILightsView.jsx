import { useState, useEffect } from 'react'
import { midiController } from '../midi'
import './MIDILightsView.css'

export default function MIDILightsView() {
  const [outputs, setOutputs] = useState([])
  const [selectedOutput, setSelectedOutput] = useState(null)
  const [selectedHelixOutput, setSelectedHelixOutput] = useState(null)
  const [selectedLightsOutput, setSelectedLightsOutput] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [midiSupported, setMidiSupported] = useState(false)

  // Initialize MIDI on mount
  useEffect(() => {
    checkMIDISupport()
    initializeMIDI()
  }, [])

  const checkMIDISupport = () => {
    const supported = navigator.requestMIDIAccess !== undefined
    setMidiSupported(supported)
    if (!supported) {
      console.warn('Web MIDI API not supported in this browser')
    }
  }

  const initializeMIDI = async () => {
    if (!midiSupported) return

    try {
      const success = await midiController.initialize()
      if (success) {
        setIsInitialized(true)
        updateOutputsList()
        
        // Set up listener for MIDI state changes
        // Note: This would need to be implemented in midi.js
      }
    } catch (error) {
      console.error('Failed to initialize MIDI:', error)
    }
  }

  const updateOutputsList = () => {
    const outputList = midiController.getOutputs()
    setOutputs(outputList || [])
  }

  const handleRefreshDevices = async () => {
    await initializeMIDI()
  }

  const handleOutputChange = (e) => {
    const index = parseInt(e.target.value)
    if (!isNaN(index) && index >= 0 && index < outputs.length) {
      midiController.setOutput(index)
      setSelectedOutput(index)
      console.log('Default MIDI output set to:', outputs[index].name)
    }
  }

  const handleHelixOutputChange = (e) => {
    const index = parseInt(e.target.value)
    if (!isNaN(index) && index >= 0 && index < outputs.length) {
      midiController.setHelixOutput(index)
      setSelectedHelixOutput(index)
      console.log('Helix output set to:', outputs[index].name)
    } else if (e.target.value === '') {
      midiController.helixOutput = null
      setSelectedHelixOutput(null)
    }
  }

  const handleLightsOutputChange = (e) => {
    const index = parseInt(e.target.value)
    if (!isNaN(index) && index >= 0 && index < outputs.length) {
      midiController.setLightsOutput(index)
      setSelectedLightsOutput(index)
      console.log('Lights output set to:', outputs[index].name)
    } else if (e.target.value === '') {
      midiController.lightsOutput = null
      setSelectedLightsOutput(null)
    }
  }

  const handleTestLights = () => {
    // TODO: Implement test lights functionality
    console.log('Test lights - functionality to be implemented')
    // Example: Send a test note
    // midiController.sendNoteOnToLights(60, 127, 0) // Middle C, full velocity, channel 0
  }

  const handleNoteClick = (note) => {
    // TODO: Implement note testing
    console.log('Note clicked:', note)
    // midiController.sendNoteOnToLights(note, 127, 0)
  }

  // Generate MIDI note grid (C0 to C8 = notes 0-108, but we'll show commonly used range)
  const generateNoteGrid = () => {
    const notes = []
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    
    // Generate from C3 (note 48) to C7 (note 96) - common range for lighting
    for (let octave = 3; octave <= 7; octave++) {
      for (let note = 0; note < 12; note++) {
        const midiNote = octave * 12 + note
        if (midiNote <= 127) {
          notes.push({
            midiNote,
            name: `${noteNames[note]}${octave}`,
            displayName: noteNames[note] === 'C#' ? 'C♯' : noteNames[note] === 'F#' ? 'F♯' : noteNames[note] === 'G#' ? 'G♯' : noteNames[note] === 'A#' ? 'A♯' : noteNames[note]
          })
        }
      }
    }
    return notes
  }

  const noteGrid = generateNoteGrid()

  return (
    <>
      <header>
        <h1>MIDI Lights & Helix Control</h1>
      </header>

      {!midiSupported && (
        <div className="alert alert-warning" style={{
          padding: '16px',
          marginBottom: '20px',
          background: 'var(--surface-light)',
          border: '1px solid var(--warning-color, #ff9800)',
          borderRadius: '8px',
          color: 'var(--text)'
        }}>
          <strong>⚠️ Web MIDI API not supported</strong>
          <p>Your browser doesn't support Web MIDI API. Please use Chrome, Edge, or Opera for MIDI functionality.</p>
        </div>
      )}

      <div className="helix-connection-info" style={{
        background: 'var(--surface)',
        padding: '20px',
        borderRadius: '16px',
        marginBottom: '20px',
        border: '1px solid var(--border-color)'
      }}>
        <h3>🎸 Helix & Audio Connection Guide</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Connect your Helix Line 6 and lighting equipment via MIDI to enable automated preset changes and light control.
        </p>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <p><strong>Note:</strong> See MIDI_SETUP.md for detailed setup instructions and equipment requirements.</p>
        </div>
      </div>

      <div className="midi-controls">
        <div className="control-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="midi-output-select">Default MIDI Output Device</label>
          <select 
            id="midi-output-select"
            value={selectedOutput !== null ? selectedOutput : ''}
            onChange={handleOutputChange}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-light)',
              color: 'var(--text)',
              marginBottom: '10px'
            }}
          >
            <option value="">No device selected</option>
            {outputs.map((output, index) => (
              <option key={index} value={index}>
                {output.name}
              </option>
            ))}
          </select>
          <button 
            className="btn btn-secondary" 
            onClick={handleRefreshDevices}
            style={{ width: '100%' }}
          >
            🔄 Refresh Devices
          </button>
        </div>

        <div className="control-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="helix-output-select">Helix Output (Preset Changes)</label>
          <select 
            id="helix-output-select"
            value={selectedHelixOutput !== null ? selectedHelixOutput : ''}
            onChange={handleHelixOutputChange}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-light)',
              color: 'var(--text)'
            }}
          >
            <option value="">Auto-detect or use default</option>
            {outputs.map((output, index) => (
              <option key={index} value={index}>
                {output.name}
              </option>
            ))}
          </select>
          <small style={{ display: 'block', marginTop: '8px', color: 'var(--text-secondary)' }}>
            Select specific device for Helix preset changes. Leave empty to use default.
          </small>
        </div>

        <div className="control-group" style={{ marginBottom: '20px' }}>
          <label htmlFor="lights-output-select">Lights Output (Lighting Control)</label>
          <select 
            id="lights-output-select"
            value={selectedLightsOutput !== null ? selectedLightsOutput : ''}
            onChange={handleLightsOutputChange}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-light)',
              color: 'var(--text)'
            }}
          >
            <option value="">Auto-detect or use default</option>
            {outputs.map((output, index) => (
              <option key={index} value={index}>
                {output.name}
              </option>
            ))}
          </select>
          <small style={{ display: 'block', marginTop: '8px', color: 'var(--text-secondary)' }}>
            Select specific device for lighting control. Leave empty to use default.
          </small>
        </div>

        <div className="control-group" style={{ marginBottom: '20px' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleTestLights}
            style={{ width: '100%' }}
            disabled={!isInitialized}
          >
            🧪 Test Lights
          </button>
          <small style={{ display: 'block', marginTop: '8px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Functionality to be implemented
          </small>
        </div>

        <div className="midi-notes" style={{
          marginTop: '30px',
          padding: '20px',
          background: 'var(--surface-light)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>MIDI Notes Reference</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Click a note to test (functionality to be implemented). Common lighting notes are typically in the C3-C6 range (48-84).
          </p>
          <div className="note-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '10px'
          }}>
            {noteGrid.map((note) => (
              <button
                key={note.midiNote}
                className="btn btn-secondary"
                onClick={() => handleNoteClick(note.midiNote)}
                style={{
                  padding: '10px 8px',
                  fontSize: '0.75rem',
                  minHeight: '50px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
                title={`Note ${note.midiNote}: ${note.name}`}
              >
                <span style={{ fontWeight: '600' }}>{note.displayName}</span>
                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{note.midiNote}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'var(--surface-light)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Light Programming</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Timeline-based light programming functionality will be implemented here.
          </p>
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            border: '2px dashed var(--border-color)',
            borderRadius: '8px'
          }}>
            <p>Light Timeline Editor</p>
            <small>(To be implemented)</small>
          </div>
        </div>
      </div>
    </>
  )
}
