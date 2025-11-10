import { useState } from 'react'
import MainNav from './MainNav'
import LoginModal from '../Auth/LoginModal'
import { useSupabase } from '../../context/SupabaseContext'
import './AppHeader.css'

function AppHeader({ tabs, currentView, onSelect }) {
  const { user, signOut, loading } = useSupabase()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const handleAuthAction = async () => {
    if (user) {
      await signOut()
    } else {
      setShowLoginModal(true)
    }
  }

  return (
    <>
      <header className="app-header hidden md:block">
        <div className="app-header-content">
          <div className="app-header-title">
            <span className="app-header-subtitle">Metronome Suite</span>
            <span className="app-header-main-title">Live Performance Control</span>
          </div>
          
          <div className="app-header-actions">
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
        <div className="app-header-nav-section">
          <MainNav
            tabs={tabs}
            currentView={currentView}
            onSelect={onSelect}
            variant="header"
            className="px-2"
          />
        </div>
      </header>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  )
}

export default AppHeader
