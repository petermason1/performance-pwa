import { useState, useContext } from 'react'
import './MainNav.css'
import { AppContext } from '../../context/AppContext'

const VARIANT_CONFIG = {
  desktop: {
    navClass: 'hidden md:block sticky top-0 z-40 w-full',
    navStyle: {
      background: 'rgba(18, 24, 39, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(0, 217, 255, 0.2)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
    }
  },
  header: {
    navClass: '',
    navStyle: {
      background: 'rgba(26, 35, 50, 0.3)',
      borderTop: '1px solid rgba(0, 217, 255, 0.2)'
    }
  },
  mobile: {
    navClass: 'md:hidden fixed bottom-0 left-0 right-0 z-40',
    navStyle: {
      background: 'rgba(18, 24, 39, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(0, 217, 255, 0.2)',
      boxShadow: '0 -6px 18px rgba(0, 0, 0, 0.6)',
      padding: '0 0.5rem'
    }
  }
}

function MainNav({ tabs, currentView, onSelect, variant = 'desktop', className = '', style }) {
  const { dispatchUi, focusMode } = useContext(AppContext)
  const { navClass, navStyle } = VARIANT_CONFIG[variant] || VARIANT_CONFIG.desktop
  const [showMore, setShowMore] = useState(false)

  // For mobile variant, reduce to core tabs and add a More button
  let visibleTabs = tabs
  let extraTabs = []
  if (variant === 'mobile') {
    const core = ['stage', 'metronome', 'setlists', 'songs']
    visibleTabs = tabs.filter(t => core.includes(t.id))
    extraTabs = tabs.filter(t => !core.includes(t.id))
  }

  return (
    <nav
      className={`main-nav ${navClass} ${className}`.trim()}
      style={{ ...navStyle, ...style }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="main-nav-container">
        {visibleTabs.map(tab => {
          const isActive = currentView === tab.id
          return (
            <button
              type="button"
              key={`${variant}-${tab.id}`}
              onClick={() => {
                onSelect(tab.id)
                setShowMore(false)
              }}
              className={`main-nav-button ${isActive ? 'active' : 'inactive'}`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              role="tab"
              aria-selected={isActive}
            >
              <span className="main-nav-icon" aria-hidden="true">{tab.icon}</span>
              <span className="main-nav-label">{tab.label}</span>
            </button>
          )
        })}
        {variant === 'mobile' && (
          <button
            type="button"
            className={`main-nav-button ${showMore ? 'active' : 'inactive'}`}
            onClick={() => setShowMore(s => !s)}
            aria-expanded={showMore}
            aria-label="More"
          >
            <span className="main-nav-icon" aria-hidden="true">⋯</span>
            <span className="main-nav-label">More</span>
          </button>
        )}
      </div>

      {variant === 'mobile' && showMore && (
        <div className="more-drawer" role="menu" aria-label="More actions" onClick={() => setShowMore(false)}>
          <div className="more-drawer-content" onClick={(e) => e.stopPropagation()}>
            {extraTabs.map(t => (
              <button
                key={`more-${t.id}`}
                className="more-item"
                onClick={() => { onSelect(t.id); setShowMore(false) }}
                role="menuitem"
              >
                <span className="more-icon" aria-hidden="true">{t.icon}</span>
                <span className="more-label">{t.label}</span>
              </button>
            ))}
            <hr className="more-sep" />
            <button
              className="more-item"
              onClick={() => { dispatchUi({ type: 'OPEN_REALTIME' }); setShowMore(false) }}
              role="menuitem"
            >
              <span className="more-icon" aria-hidden="true">🔴</span>
              <span className="more-label">Live Sync</span>
            </button>
            <button
              className="more-item"
              onClick={() => { dispatchUi({ type: 'OPEN_SHORTCUTS' }); setShowMore(false) }}
              role="menuitem"
            >
              <span className="more-icon" aria-hidden="true">⌨️</span>
              <span className="more-label">Shortcuts</span>
            </button>
            <button
              className="more-item"
              onClick={() => { dispatchUi({ type: 'TOGGLE_FOCUS_MODE' }); setShowMore(false) }}
              role="menuitem"
            >
              <span className="more-icon" aria-hidden="true">🎯</span>
              <span className="more-label">{focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default MainNav
