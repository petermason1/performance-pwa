import { useState } from 'react'
import { useRealtimeSession } from '../hooks/useRealtimeSession'

export default function RealtimeSessionModal({ onClose, metronomeHook }) {
  const [joinSessionInput, setJoinSessionInput] = useState('')
  const [showQR, setShowQR] = useState(false)
  
  const {
    isHost,
    isClient,
    sessionId,
    connectedClients,
    connectionStatus,
    lastSync,
    isInSession,
    startHostSession,
    joinSession,
    leaveSession
  } = useRealtimeSession(metronomeHook)

  const handleStartHost = async () => {
    const newSessionId = await startHostSession()
    if (newSessionId) {
      console.log('Started host session:', newSessionId)
    }
  }

  const handleJoinSession = async () => {
    const sessionToJoin = joinSessionInput.trim()
    if (!sessionToJoin) {
      alert('Please enter a session ID')
      return
    }

    const success = await joinSession(sessionToJoin)
    if (success) {
      console.log('Joined session successfully')
      setJoinSessionInput('')
    } else {
      alert('Failed to join session. Please check the session ID and try again.')
    }
  }

  const handleLeave = async () => {
    await leaveSession()
  }

  const handleCopySessionId = async () => {
    if (!sessionId) return

    try {
      await navigator.clipboard.writeText(sessionId)
      alert('✅ Session ID copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy. Please copy manually from the text below.')
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'var(--success-color, #10b981)'
      case 'connecting': return 'var(--warning-color, #f59e0b)'
      case 'error': return 'var(--error-color, #ef4444)'
      default: return 'var(--text-secondary, #6b7280)'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return isHost ? `Hosting (${connectedClients.length} connected)` : 'Connected'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Connection Error'
      default: return 'Not connected'
    }
  }

  const handleClose = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('close')) {
      onClose()
    }
  }

  return (
    <div 
      className="modal" 
      style={{ display: 'block' }} 
      onClick={handleClose}
      role="dialog"
      aria-labelledby="realtime-session-title"
      aria-modal="true"
    >
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={handleClose} aria-label="Close dialog">&times;</span>
        <h2 id="realtime-session-title">🔴 Live Session Sync</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Sync your metronome with bandmates in real-time. One person hosts, others join.
        </p>

        {/* Status Indicator */}
        <div 
          style={{
            padding: '12px',
            background: 'var(--surface-light)',
            borderRadius: '8px',
            border: `2px solid ${getStatusColor()}`,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          role="status"
          aria-live="polite"
        >
          <div 
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: getStatusColor()
            }} 
            aria-hidden="true"
          />
          <div>
            <strong>{getStatusText()}</strong>
            {lastSync && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Last sync: {lastSync.bpm} BPM, {lastSync.isPlaying ? 'Playing' : 'Stopped'}
              </div>
            )}
          </div>
        </div>

        {!isInSession && (
          <div>
            {/* Host Section */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '10px' }}>🎛️ Start as Host</h3>
              <p style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-secondary)', 
                marginBottom: '15px' 
              }}>
                Control the metronome and broadcast to all connected bandmates.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleStartHost}
                disabled={connectionStatus === 'connecting'}
                style={{ width: '100%' }}
              >
                {connectionStatus === 'connecting' ? 'Starting...' : '🚀 Start Host Session'}
              </button>
            </div>

            <hr style={{ 
              border: 'none', 
              borderTop: '1px solid var(--border)', 
              margin: '20px 0' 
            }} />

            {/* Join Section */}
            <div>
              <h3 style={{ marginBottom: '10px' }}>🔗 Join a Session</h3>
              <p style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-secondary)', 
                marginBottom: '15px' 
              }}>
                Enter the session ID shared by your bandleader.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={joinSessionInput}
                  onChange={(e) => setJoinSessionInput(e.target.value)}
                  placeholder="Paste session ID here..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--surface-light)',
                    color: 'var(--text)',
                    fontSize: '0.9rem'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinSession()
                    }
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleJoinSession}
                  disabled={connectionStatus === 'connecting' || !joinSessionInput.trim()}
                  aria-label="Join session with entered ID"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}

        {isInSession && (
          <div>
            {/* Active Session Info */}
            <div style={{
              padding: '15px',
              background: 'var(--surface-light)',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '10px' }}>
                {isHost ? '🎛️ Hosting Session' : '🔗 Connected to Session'}
              </h3>
              
              {isHost && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)',
                    marginBottom: '5px'
                  }}>
                    Share this Session ID:
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <code style={{
                      flex: 1,
                      padding: '8px 10px',
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      wordBreak: 'break-all'
                    }}>
                      {sessionId}
                    </code>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={handleCopySessionId}
                      aria-label="Copy session ID to clipboard"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginTop: '8px'
                  }}>
                    💡 Bandmates can join by entering this ID
                  </p>
                </div>
              )}

              {isClient && sessionId && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)',
                    marginBottom: '5px'
                  }}>
                    Session ID:
                  </label>
                  <code style={{
                    display: 'block',
                    padding: '8px 10px',
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all'
                  }}>
                    {sessionId}
                  </code>
                </div>
              )}

              {isHost && connectedClients.length > 0 && (
                <div style={{ marginTop: '15px' }} role="region" aria-label="Connected bandmates">
                  <strong style={{ fontSize: '0.9rem' }}>
                    Connected Bandmates: {connectedClients.length}
                  </strong>
                  <ul style={{
                    listStyle: 'none',
                    padding: '10px 0 0 0',
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {connectedClients.map((client, idx) => (
                      <li key={idx} style={{ padding: '4px 0' }}>
                        • {client.userId} - {client.onlineAt ? new Date(client.onlineAt).toLocaleTimeString() : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Leave Button */}
            <button
              className="btn btn-danger"
              onClick={handleLeave}
              style={{ width: '100%' }}
              aria-label={isHost ? 'End session and disconnect all bandmates' : 'Leave this session'}
            >
              {isHost ? '🛑 End Session' : '👋 Leave Session'}
            </button>

            {isHost && (
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginTop: '10px',
                textAlign: 'center'
              }}>
                ⚠️ Ending the session will disconnect all bandmates
              </p>
            )}
          </div>
        )}

        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: 'var(--surface-light)',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <strong>How it works:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Host controls the metronome for everyone</li>
            <li>Changes sync in real-time (BPM, start/stop, song)</li>
            <li>Perfect for live gigs or rehearsals</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

