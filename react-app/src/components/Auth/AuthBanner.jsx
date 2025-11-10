import { useState } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import { useBand } from '../../hooks/useBand'
import BandModal from '../Band/BandModal'
import './AuthBanner.css'

export default function AuthBanner() {
  const { user } = useSupabase()
  const { currentBand } = useBand()
  const [showBandModal, setShowBandModal] = useState(false)
  const [bandModalMode, setBandModalMode] = useState('select') // 'select', 'create', 'invite', 'members'

  if (!user) return null

  const openBandModal = (mode = 'select') => {
    setBandModalMode(mode)
    setShowBandModal(true)
  }

  return (
    <>
      <div className="auth-banner">
        <div className="auth-banner-content">
          <div className="auth-user-box">
            <span className="check-icon">✅</span>
            <span className="auth-user-name">
              {user.user_metadata?.display_name || user.email}
            </span>
          </div>
          {currentBand && (
            <>
              <span className="auth-separator">•</span>
              <button
                onClick={() => openBandModal('select')}
                className="auth-button"
              >
                🎸 {currentBand.name}
              </button>
            </>
          )}
        </div>
        <div className="auth-button-group">
          {currentBand ? (
            <button
              onClick={() => openBandModal('invite')}
              className="auth-button"
              title="Invite a bandmate"
            >
              <span className="auth-button-icon">➕</span>
              <span className="auth-button-text">Invite</span>
            </button>
          ) : (
            <button
              onClick={() => openBandModal('create')}
              className="auth-button"
            >
              + Create Band
            </button>
          )}
        </div>
      </div>

      {showBandModal && (
        <BandModal 
          initialMode={bandModalMode}
          onClose={() => {
            setShowBandModal(false)
            setBandModalMode('select')
          }} 
        />
      )}
    </>
  )
}

