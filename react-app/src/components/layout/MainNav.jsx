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

function MainNav({ tabs, currentView, onSelect, variant = 'desktop', className = '', style, groups }) {
  const { dispatchUi, focusMode } = useContext(AppContext)
  const { navClass, navStyle } = VARIANT_CONFIG[variant] || VARIANT_CONFIG.desktop
  const [showMore, setShowMore] = useState(false)

  // For mobile variant, show all tabs (they'll wrap/scroll if needed)
  let visibleTabs = tabs
  let extraTabs = []
  if (variant === 'mobile') {
    // Show all tabs on mobile - they'll fit or scroll horizontally
    visibleTabs = tabs
    extraTabs = []
  }

  const navVariantClass = `main-nav--${variant}`

  const renderButton = (tab) => {
    const isActive = currentView === tab.id
    return (
      <button
        type="button"
        key={`${variant}-${tab.id}`}
        onClick={() => {
          onSelect(tab.id)
          setShowMore(false)
        }}
        className={`main-nav-button main-nav-button--${variant} ${isActive ? 'active' : 'inactive'}`}
        aria-label={tab.label}
        aria-current={isActive ? 'page' : undefined}
        role="tab"
        aria-selected={isActive}
      >
        <span className="main-nav-icon" aria-hidden="true">{tab.icon}</span>
        <span className="main-nav-label">{tab.label}</span>
      </button>
    )
  }

  let navBody

  if (variant === 'header' && Array.isArray(groups) && groups.length) {
    navBody = (
      <div className="main-nav-container main-nav-container--grouped">
        {groups.map(group => (
          <div className="main-nav-group" key={`group-${group.label}`}>
            <span className="main-nav-group-label">{group.label}</span>
            <div className="main-nav-group-items">
              {group.tabs.map(renderButton)}
            </div>
          </div>
        ))}
      </div>
    )
  } else {
    navBody = (
      <div className="main-nav-container">
        {visibleTabs.map(renderButton)}
      </div>
    )
  }

  return (
    <nav
      className={`main-nav ${navVariantClass} ${navClass} ${className}`.trim()}
      style={{ ...navStyle, ...style }}
      role="tablist"
      aria-label="Main navigation"
    >
      {navBody}
    </nav>
  )
}

export default MainNav
