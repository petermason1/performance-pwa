import './MainNav.css'

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
  const { navClass, navStyle } = VARIANT_CONFIG[variant] || VARIANT_CONFIG.desktop

  return (
    <nav
      className={`main-nav ${navClass} ${className}`.trim()}
      style={{ ...navStyle, ...style }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="main-nav-container">
        {tabs.map(tab => {
          const isActive = currentView === tab.id
          return (
            <button
              type="button"
              key={`${variant}-${tab.id}`}
              onClick={() => onSelect(tab.id)}
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
      </div>
    </nav>
  )
}

export default MainNav
