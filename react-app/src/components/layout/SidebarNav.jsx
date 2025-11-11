import { useState, useContext, useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import './SidebarNav.css'

// Group tabs logically
const NAV_GROUPS = [
  {
    label: 'Overview',
    tabs: [
      { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
      { id: 'performance', icon: '🎭', label: 'Performance' },
      { id: 'stage', icon: '🎤', label: 'Stage Mode' }
    ]
  },
  {
    label: 'Setup',
    tabs: [
      { id: 'metronome', icon: '🎛️', label: 'Metronome' },
      { id: 'setlists', icon: '📋', label: 'Set Lists' },
      { id: 'songs', icon: '🎵', label: 'Songs' }
    ]
  },
  {
    label: 'Control',
    tabs: [
      { id: 'lights', icon: '🎹', label: 'MIDI Lights' }
    ]
  }
]

function SidebarNav({ currentView, onSelect }) {
  const { dispatchUi, focusMode } = useContext(AppContext)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  })

  const toggleCollapse = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', newState.toString())
  }

  // Update body class for CSS targeting
  useEffect(() => {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed')
    } else {
      document.body.classList.remove('sidebar-collapsed')
    }
    return () => {
      document.body.classList.remove('sidebar-collapsed')
    }
  }, [collapsed])

  return (
    <aside 
      className={`sidebar-nav ${collapsed ? 'collapsed' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="sidebar-nav-header">
        {!collapsed && (
          <div className="sidebar-nav-title">
            <span className="sidebar-nav-logo">🎵</span>
            <span className="sidebar-nav-brand">Metronome</span>
          </div>
        )}
        <button
          className="sidebar-nav-toggle"
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav-content" role="tablist">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.label} className="sidebar-nav-group">
            {!collapsed && (
              <div className="sidebar-nav-group-label">{group.label}</div>
            )}
            {group.tabs.map(tab => {
              const isActive = currentView === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelect(tab.id)}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                  role="tab"
                  aria-selected={isActive}
                  title={collapsed ? tab.label : undefined}
                >
                  <span className="sidebar-nav-icon" aria-hidden="true">{tab.icon}</span>
                  {!collapsed && (
                    <span className="sidebar-nav-label">{tab.label}</span>
                  )}
                  {isActive && <span className="sidebar-nav-indicator" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-nav-footer">
          <button
            className="sidebar-nav-action"
            onClick={() => dispatchUi({ type: 'OPEN_REALTIME' })}
            aria-label="Open live session sync"
          >
            <span className="sidebar-nav-icon" aria-hidden="true">🔴</span>
            <span className="sidebar-nav-label">Live Sync</span>
          </button>
          <button
            className="sidebar-nav-action"
            onClick={() => dispatchUi({ type: 'OPEN_SHORTCUTS' })}
            aria-label="Show keyboard shortcuts"
          >
            <span className="sidebar-nav-icon" aria-hidden="true">⌨️</span>
            <span className="sidebar-nav-label">Shortcuts</span>
          </button>
          <button
            className="sidebar-nav-action"
            onClick={() => dispatchUi({ type: 'TOGGLE_FOCUS_MODE' })}
            aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">🎯</span>
            <span className="sidebar-nav-label">{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
          </button>
        </div>
      )}
    </aside>
  )
}

export default SidebarNav

