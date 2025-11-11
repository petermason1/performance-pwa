import { useState, useMemo } from 'react'
import LoginModal from '../Auth/LoginModal'
import { useSupabase } from '../../context/SupabaseContext'
import { useApp } from '../../hooks/useApp'
import { useRealtimeSession } from '../../hooks/useRealtimeSession'
import RealtimeSessionModal from '../RealtimeSessionModal'
import MainNav from './MainNav'
import './AppHeader.css'

function AppHeader({ tabs = [], groups = [], currentView, onSelect }) {
  const { user, signOut, loading } = useSupabase()
  const { metronome } = useApp()
  const realtimeSession = useRealtimeSession(metronome)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRealtimeModal, setShowRealtimeModal] = useState(false)

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
      <header className="app-header md:ml-[240px]">
        <div className="app-header-content">
          <div className="app-header-title">
            <span className="app-header-subtitle">
              ⏱️ Smart Metronome
            </span>
            <span className="app-header-main-title">
              {activeTab ? activeTab.label : 'Live Performance Control'}
            </span>
          </div>
          
          <div className="app-header-actions">
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

        {tabs.length > 0 && (
          <div className="app-header-nav-section" aria-label="Primary">
            <div className="app-header-nav-shell">
              <MainNav
                tabs={tabs}
                groups={groups}
                currentView={currentView}
                onSelect={onSelect}
                variant="header"
              />
            </div>
          </div>
        )}
      </header>

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
