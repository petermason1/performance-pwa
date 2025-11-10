import { useEffect } from 'react'

const shortcuts = [
  {
    category: 'Metronome Control',
    items: [
      { key: 'Space', description: 'Play/Pause metronome' },
      { key: 'Escape', description: 'Stop metronome' },
      { key: '+ or =', description: 'Increase BPM by 1' },
      { key: '- or _', description: 'Decrease BPM by 1' },
    ]
  },
  {
    category: 'Song Navigation',
    items: [
      { key: '← Left Arrow', description: 'Previous song' },
      { key: '→ Right Arrow', description: 'Next song' },
    ]
  },
  {
    category: 'General',
    items: [
      { key: '? or /', description: 'Show keyboard shortcuts (this help)' },
    ]
  }
]

export default function KeyboardShortcutsModal({ onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div 
      className="modal" 
      style={{ display: 'block' }} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div 
        className="modal-content" 
        style={{ maxWidth: '600px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <span 
          className="close" 
          onClick={onClose}
          aria-label="Close keyboard shortcuts help"
        >
          &times;
        </span>
        <h2 id="shortcuts-title">⌨️ Keyboard Shortcuts</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Press <kbd style={{ 
            padding: '4px 8px', 
            background: 'var(--surface-light)', 
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>?</kbd> or <kbd style={{ 
            padding: '4px 8px', 
            background: 'var(--surface-light)', 
            border: '1px solid var(--border)',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>/</kbd> anytime to show this help.
        </p>

        <div style={{ display: 'grid', gap: '25px' }}>
          {shortcuts.map((category, catIndex) => (
            <div key={catIndex}>
              <h3 style={{ 
                marginBottom: '12px', 
                fontSize: '1.1rem',
                color: 'var(--primary-color)',
                borderBottom: '2px solid var(--border)',
                paddingBottom: '8px'
              }}>
                {category.category}
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {category.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      background: 'var(--surface-light)',
                      borderRadius: '8px',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.description}
                    </span>
                    <kbd style={{
                      padding: '6px 12px',
                      background: 'var(--surface)',
                      border: '2px solid var(--border)',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: 'var(--text)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: '25px', 
          padding: '15px', 
          background: 'var(--surface-light)',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <strong>💡 Tip:</strong> Keyboard shortcuts are disabled when typing in input fields. 
          Press <kbd style={{ 
            padding: '2px 6px', 
            background: 'var(--surface)', 
            border: '1px solid var(--border)',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }}>Escape</kbd> to close this help.
        </div>
      </div>
    </div>
  )
}
