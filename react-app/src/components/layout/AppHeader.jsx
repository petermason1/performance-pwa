import { useState, useMemo } from 'react'
import LoginModal from '../Auth/LoginModal'
import { useSupabase } from '../../context/SupabaseContext'
import { useApp } from '../../hooks/useApp'
import { useRealtimeSession } from '../../hooks/useRealtimeSession'
import RealtimeSessionModal from '../RealtimeSessionModal'
import './AppHeader.css'

function AppHeader({ tabs = [], groups = [], currentView, onSelect }) {
  const { user, signOut, loading } = useSupabase()
  const { metronome } = useApp()
  const realtimeSession = useRealtimeSession(metronome)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRealtimeModal, setShowRealtimeModal] = useState(false)
  const [showNavMenu, setShowNavMenu] = useState(false)

  const handleAuthAction = async () => {
    if (user) {
      await signOut()
    } else {
      setShowLoginModal(true)
    }
  }

  const activeTab = useMemo(() => {
    return tabs.find(tab => tab.id === currentView) || tabs[0] || null
  }, [tabs, currentView])

  return (
    <>
      <header className="app-header">
        <div className="app-header-content">
          <div className="app-header-actions">
            {/* Navigation Menu Button */}
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="app-header-menu-button"
              aria-label="Open navigation menu"
              aria-expanded={showNavMenu}
            >
              <span className="app-header-menu-icon" aria-hidden="true">☰</span>
              <span className="app-header-menu-label">Menu</span>
            </button>
            {/* Session Status Indicator */}
            {realtimeSession.connectionStatus === 'connected' && (
              <button
                onClick={() => setShowRealtimeModal(true)}
                className="app-header-session-indicator"
                aria-label="Live session active. Click to view details."
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: 'var(--accent-green)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-green)',
                  animation: 'pulse 2s ease-in-out infinite'
                }} aria-hidden="true" />
                {realtimeSession.isHost ? `Hosting (${realtimeSession.connectedClients.length})` : 'Synced'}
              </button>
            )}
            {user && (
              <div className="app-header-user">
                <span className="app-header-user-text">
                  <span className="app-header-user-icon">👤</span>
                  {user.user_metadata?.display_name || user.email}
                </span>
              </div>
            )}
            <button
              onClick={handleAuthAction}
              disabled={loading}
              className="app-header-auth-button"
            >
              {loading ? '...' : user ? 'Log Out' : 'Log In'}
            </button>
          </div>
        </div>
      </header>

      {/* Dropdown Navigation Menu */}
      {showNavMenu && (
        <div className="nav-menu-overlay" onClick={() => setShowNavMenu(false)}>
          <div className="nav-menu-dropdown" onClick={(e) => e.stopPropagation()}>
            <div className="nav-menu-header">
              <h3 className="nav-menu-title">Navigation</h3>
              <button
                onClick={() => setShowNavMenu(false)}
                className="nav-menu-close"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="nav-menu-content">
              {groups.map((group) => (
                <div key={group.label} className="nav-menu-group">
                  <div className="nav-menu-group-header">
                    <span className="nav-menu-group-icon" aria-hidden="true">{group.icon}</span>
                    <div className="nav-menu-group-text">
                      <span className="nav-menu-group-label">{group.label}</span>
                      <span className="nav-menu-group-helper">{group.helper}</span>
                    </div>
                  </div>
                  <div className="nav-menu-group-items">
                    {group.tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onSelect(tab.id)
                          setShowNavMenu(false)
                        }}
                        className={`nav-menu-item ${currentView === tab.id ? 'active' : ''} ${tab.priority === 'primary' ? 'primary' : ''}`}
                        aria-current={currentView === tab.id ? 'page' : undefined}
                      >
                        <span className="nav-menu-item-icon" aria-hidden="true">{tab.icon}</span>
                        <div className="nav-menu-item-text">
                          <span className="nav-menu-item-label">{tab.label}</span>
                          <span className="nav-menu-item-description">{tab.description}</span>
                        </div>
                        {tab.actionLabel && (
                          <span className="nav-menu-item-action">{tab.actionLabel}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {showRealtimeModal && (
        <RealtimeSessionModal
          onClose={() => setShowRealtimeModal(false)}
          metronomeHook={metronome}
        />
      )}
    </>
  )
}

export default AppHeader
