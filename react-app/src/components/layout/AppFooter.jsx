import MainNav from './MainNav'

function AppFooter({ tabs, currentView, onSelect, children }) {
  return (
    <footer className="relative">
      <MainNav
        tabs={tabs}
        currentView={currentView}
        onSelect={onSelect}
        variant="mobile"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      />
      {children ? (
        <div className="hidden md:flex justify-center py-4 text-xs text-[var(--color-text-tertiary)]">
          {children}
        </div>
      ) : null}
    </footer>
  )
}

export default AppFooter
