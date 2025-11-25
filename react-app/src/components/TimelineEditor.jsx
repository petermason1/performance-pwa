import { useState } from 'react'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function formatNoteName(note) {
  if (!Number.isFinite(note)) return ''
  const octave = Math.floor(note / 12) - 1
  const name = NOTE_NAMES[note % 12] || 'Note'
  return `${name}${octave}`
}

export default function TimelineEditor({
  events,
  onAddEvent,
  onRemoveEvent,
  onClear,
  onPlay,
  onStop,
  isPlaying
}) {
  const [newEvent, setNewEvent] = useState({
    label: '',
    time: '',
    note: '',
    duration: '0.5',
    color: '#00d9ff'
  })

  const handleAdd = (e) => {
    e.preventDefault()
    const time = Number.parseFloat(newEvent.time)
    const note = Number.parseInt(newEvent.note, 10)
    const duration = Number.parseFloat(newEvent.duration)

    if (!Number.isFinite(time) || time < 0) {
      alert('Enter a valid start time in seconds (>= 0)')
      return
    }
    if (!Number.isFinite(note) || note < 0 || note > 127) {
      alert('Enter a MIDI note number between 0 and 127')
      return
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      alert('Enter a valid duration in seconds')
      return
    }

    onAddEvent?.({
      label: newEvent.label?.trim() || formatNoteName(note),
      time,
      note,
      duration,
      color: newEvent.color || '#00d9ff'
    })

    setNewEvent({
      label: '',
      time: '',
      note: '',
      duration: '0.5',
      color: newEvent.color
    })
  }

  return (
    <section
      aria-labelledby="timeline-editor-heading"
      style={{
        marginTop: '30px',
        padding: '20px',
        background: 'var(--surface-light)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 id="timeline-editor-heading" style={{ margin: 0 }}>🎬 Timeline Editor</h3>
          <p style={{ margin: '4px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Program lighting/MIDI cues by time. Timeline is saved locally.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={isPlaying ? onStop : onPlay}
            disabled={!events?.length}
          >
            {isPlaying ? '⏹ Stop Timeline' : '▶ Play Timeline'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClear}
            disabled={!events?.length}
          >
            🗑 Clear Events
          </button>
        </div>
      </div>

      <form onSubmit={handleAdd} style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', alignItems: 'end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', gap: '4px' }}>
          Label
          <input
            type="text"
            value={newEvent.label}
            onChange={(e) => setNewEvent(prev => ({ ...prev, label: e.target.value }))}
            placeholder="Lead solo"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', gap: '4px' }}>
          Start (s)
          <input
            type="number"
            step="0.1"
            min="0"
            value={newEvent.time}
            onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
            placeholder="e.g., 12.5"
            required
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', gap: '4px' }}>
          MIDI Note
          <input
            type="number"
            min="0"
            max="127"
            value={newEvent.note}
            onChange={(e) => setNewEvent(prev => ({ ...prev, note: e.target.value }))}
            placeholder="0-127"
            required
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', gap: '4px' }}>
          Duration (s)
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={newEvent.duration}
            onChange={(e) => setNewEvent(prev => ({ ...prev, duration: e.target.value }))}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', gap: '4px' }}>
          Color
          <input
            type="color"
            value={newEvent.color}
            onChange={(e) => setNewEvent(prev => ({ ...prev, color: e.target.value }))}
            style={{ height: '38px', padding: 0 }}
          />
        </label>
        <button type="submit" className="btn btn-primary">
          ➕ Add Event
        </button>
      </form>

      <div
        role="list"
        aria-label="Timeline events"
        style={{
          marginTop: '24px',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px',
          background: '#04050b'
        }}
      >
        {events?.length ? (
          <>
            <div style={{ position: 'relative', height: '160px', marginBottom: '16px' }}>
              <div style={{
                position: 'absolute',
                inset: '0 0 0 0',
                borderRadius: '6px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '40px 100%',
                opacity: 0.5
              }} />
              {events.map(event => (
                <div
                  key={event.id}
                  role="listitem"
                  style={{
                    position: 'absolute',
                    left: `${Math.min(event.time * 40, 1000)}px`,
                    top: `${20 + (event.note % 12) * 9}px`,
                    minWidth: '40px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: event.color || '#00d9ff',
                    color: '#02030a',
                    fontSize: '0.75rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  {event.label || formatNoteName(event.note)}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {events.map(event => (
                <div
                  key={event.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{event.label || formatNoteName(event.note)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Start {event.time.toFixed(2)}s • Duration {event.duration.toFixed(2)}s • Note {event.note} ({formatNoteName(event.note)})
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onRemoveEvent?.(event.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            No timeline events yet. Add cues above to start programming your show.
          </p>
        )}
      </div>
    </section>
  )
}

