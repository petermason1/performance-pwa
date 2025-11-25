import { useState, useEffect } from 'react'
import { midiController } from '../midi'

export default function MIDIStatusIndicator({ onClick }) {
  const [status, setStatus] = useState('checking')
  const [helixOutput, setHelixOutput] = useState(null)

  useEffect(() => {
    const updateStatus = () => {
      if (!midiController.isSupported) {
        setStatus('not_supported')
        setHelixOutput(null)
        return
      }

      const helix = midiController.getHelixOutput()
      if (helix) {
        setStatus('connected')
        setHelixOutput(helix)
      } else if (midiController.outputs.length > 0) {
        setStatus('no_helix')
        setHelixOutput(null)
      } else {
        setStatus('no_device')
        setHelixOutput(null)
      }
    }

    // Initial check
    updateStatus()

    // Re-check periodically (devices can be connected/disconnected)
    const interval = setInterval(updateStatus, 2000)

    return () => clearInterval(interval)
  }, [])

  const statusConfig = {
    checking: {
      icon: '🔄',
      text: 'Checking...',
      color: 'var(--color-text-secondary)',
      bg: 'transparent'
    },
    connected: {
      icon: '🎹',
      text: helixOutput?.name || 'Helix Connected',
      color: 'var(--accent-green)',
      bg: 'rgba(0, 255, 0, 0.1)'
    },
    no_helix: {
      icon: '⚠️',
      text: 'No Helix Output',
      color: 'var(--warning-color)',
      bg: 'rgba(255, 200, 0, 0.1)'
    },
    no_device: {
      icon: '🎹',
      text: 'No MIDI Device',
      color: 'var(--color-text-secondary)',
      bg: 'transparent'
    },
    not_supported: {
      icon: '❌',
      text: 'MIDI Not Supported',
      color: 'var(--error-color)',
      bg: 'rgba(255, 0, 0, 0.1)'
    }
  }

  const config = statusConfig[status] || statusConfig.checking

  return (
    <button
      type="button"
      onClick={onClick}
      className="midi-status-indicator"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: `1px solid ${config.color}`,
        background: config.bg,
        color: config.color,
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}
      aria-label={`MIDI status: ${config.text}`}
      title={onClick ? 'Click to open MIDI control' : config.text}
    >
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </button>
  )
}

