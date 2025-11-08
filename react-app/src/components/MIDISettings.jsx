// MIDI Settings Component
import { useState } from 'react'
import { useMIDI, useMIDIControl } from '../hooks/useMIDI'

const MIDI_ACTIONS = [
  { value: 'toggle', label: 'Play/Pause (Toggle)' },
  { value: 'play', label: 'Play' },
  { value: 'pause', label: 'Pause' },
  { value: 'tap', label: 'Tap Tempo' },
  { value: 'bpm+1', label: 'BPM +1' },
  { value: 'bpm-1', label: 'BPM -1' },
  { value: 'bpm+5', label: 'BPM +5' },
  { value: 'bpm-5', label: 'BPM -5' },
  { value: 'bpm+10', label: 'BPM +10' },
  { value: 'bpm-10', label: 'BPM -10' }
]

export default function MIDISettings({ metronomeHook, onClose }) {
  const midiHook = useMIDI()
  const midiControl = useMIDIControl(metronomeHook, midiHook)
  const [learningForAction, setLearningForAction] = useState(null)

  const handleEnable = async () => {
    const success = await midiHook.initMIDI()
    if (!success && midiHook.error) {
      alert(`Failed to enable MIDI: ${midiHook.error}`)
    }
  }

  const handleLearn = (action) => {
    setLearningForAction(action)
    midiHook.startLearning((message) => {
      // Add mapping
      const mapping = {
        type: message.type,
        channel: message.channel,
        note: message.note,
        controller: message.controller,
        program: message.program,
        action
      }
      midiControl.addMapping(mapping)
      setLearningForAction(null)
    })
  }

  const formatMapping = (mapping) => {
    let str = `${mapping.type.toUpperCase()}`
    
    if (mapping.note !== null && mapping.note !== undefined) {
      str += ` Note ${mapping.note}`
    }
    if (mapping.controller !== null && mapping.controller !== undefined) {
      str += ` CC ${mapping.controller}`
    }
    if (mapping.program !== null && mapping.program !== undefined) {
      str += ` PC ${mapping.program}`
    }
    if (mapping.channel !== null && mapping.channel !== undefined) {
      str += ` Ch ${mapping.channel + 1}`
    }
    
    return str
  }

  return (
    <div className="modal" style={{ display: 'block' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>🎹 MIDI Settings</h2>

        {!midiHook.isSupported && (
          <div style={{
            padding: '15px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <strong>⚠️ Web MIDI not supported</strong>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              Your browser does not support the Web MIDI API. Try using Chrome, Edge, or Opera on desktop.
              <br />
              <small><strong>Note:</strong> iOS Safari does not support Web MIDI. Consider using a BLE MIDI app.</small>
            </p>
          </div>
        )}

        {midiHook.isSupported && !midiHook.isEnabled && (
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={handleEnable}>
              🎹 Enable MIDI
            </button>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>
              Click to request MIDI access
            </p>
          </div>
        )}

        {midiHook.isEnabled && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '10px' }}>Connected Devices</h3>
              {midiHook.devices.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No MIDI devices connected</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {midiHook.devices.map(device => (
                    <li key={device.id} style={{
                      padding: '8px 12px',
                      background: 'var(--surface-light)',
                      borderRadius: '6px',
                      marginBottom: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong>{device.name}</strong>
                        <br />
                        <small style={{ color: '#666' }}>
                          {device.manufacturer} • {device.state}
                        </small>
                      </div>
                      <span style={{
                        padding: '4px 8px',
                        background: device.state === 'connected' ? '#28a745' : '#6c757d',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {device.state}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>MIDI Mappings</h3>
                {midiControl.mappings.length > 0 && (
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                    onClick={midiControl.clearMappings}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {midiControl.mappings.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No mappings configured. Click "Learn" below to map MIDI controls.
                </p>
              ) : (
                <div style={{ marginBottom: '15px' }}>
                  {midiControl.mappings.map(mapping => (
                    <div key={mapping.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--surface-light)',
                      borderRadius: '6px',
                      marginBottom: '6px'
                    }}>
                      <div>
                        <strong>{formatMapping(mapping)}</strong>
                        <br />
                        <small style={{ color: '#666' }}>
                          → {MIDI_ACTIONS.find(a => a.value === mapping.action)?.label || mapping.action}
                        </small>
                      </div>
                      <button
                        className="btn btn-danger"
                        style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                        onClick={() => midiControl.removeMapping(mapping.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ marginBottom: '10px' }}>Add MIDI Mapping</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>
                Click "Learn" then press any key, button, or control on your MIDI device
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {MIDI_ACTIONS.map(action => (
                  <button
                    key={action.value}
                    className="btn btn-secondary"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '12px',
                      background: learningForAction === action.value ? '#007bff' : undefined,
                      color: learningForAction === action.value ? 'white' : undefined
                    }}
                    onClick={() => handleLearn(action.value)}
                    disabled={midiHook.isLearning && learningForAction !== action.value}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      {action.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                      {learningForAction === action.value ? 'Listening...' : 'Learn'}
                    </span>
                  </button>
                ))}
              </div>

              {midiHook.isLearning && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  background: '#007bff',
                  color: 'white',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <strong>🎹 Listening for MIDI input...</strong>
                  <br />
                  <small>Press any key or control on your MIDI device</small>
                  <br />
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: '8px', fontSize: '0.85rem' }}
                    onClick={() => {
                      midiHook.stopLearning()
                      setLearningForAction(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-secondary" onClick={midiHook.disable}>
                Disable MIDI
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

