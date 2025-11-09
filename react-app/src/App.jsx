import { useEffect, useMemo } from 'react'
import { AppProvider } from './AppContext'
import { useApp } from './hooks/useApp'
import './App.css'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'

// Import views
import PerformanceView from './views/PerformanceView'
import SetListsView from './views/SetListsView'
import SongsView from './views/SongsView'
import MIDILightsView from './views/MIDILightsView'

const TABS = [
  { id: 'performance', icon: '🎭', label: 'Performance' },
  { id: 'setlists', icon: '📋', label: 'Set Lists' },
  { id: 'songs', icon: '🎵', label: 'Songs' },
  { id: 'lights', icon: '🎹', label: 'MIDI Lights' }
]

function AppContent() {
  const { currentView, setCurrentView, importData, dbInitialized } = useApp()

  // Persist and restore currentView
  useEffect(() => {
    const saved = localStorage.getItem('appCurrentView')
    if (saved && ['performance', 'setlists', 'songs', 'lights'].includes(saved)) {
      setCurrentView(saved)
    }
  }, [setCurrentView])

  useEffect(() => {
    localStorage.setItem('appCurrentView', currentView)
  }, [currentView])

  // Handle share link imports
  useEffect(() => {
    if (!dbInitialized) return

    const handleShareLinkImport = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const importParam = urlParams.get('import')
      
      if (importParam) {
        try {
          // Decode the data
          const decoded = decodeURIComponent(atob(importParam))
          const data = JSON.parse(decoded)
          
          const message = `📥 Import data from share link?\n\n` +
                        `${data.songs?.length || 0} songs\n` +
                        `${data.setlists?.length || data.setLists?.length || 0} set lists\n\n` +
                        `This will merge with your existing data.`
          
          if (confirm(message)) {
            // Normalize setlists key
            if (data.setLists && !data.setlists) {
              data.setlists = data.setLists
            }
            
            const result = await importData(data, 'merge')
            
            let resultMessage = `✅ Import complete!\n\n` +
                              `Songs: +${result.songs.added} new`
            if (result.songs.skipped > 0) resultMessage += `, ${result.songs.skipped} skipped`
            resultMessage += `\nSet Lists: +${result.setlists.added} new`
            if (result.setlists.skipped > 0) resultMessage += `, ${result.setlists.skipped} skipped`
            
            alert(resultMessage)
          }
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname)
        } catch (e) {
          console.error('Failed to import from share link:', e)
          alert('❌ Failed to import data from link: ' + e.message)
          // Clean up URL even on error
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    }
    
    handleShareLinkImport()
  }, [dbInitialized, importData])

  const views = useMemo(() => ({
    performance: <PerformanceView />,
    setlists: <SetListsView />,
    songs: <SongsView />,
    lights: <MIDILightsView />
  }), [])

  const renderTabs = (variant) =>
    TABS.map(tab => {
      const isActive = currentView === tab.id
      const baseClasses = variant === 'desktop'
        ? 'flex-1 flex flex-col items-center justify-center min-h-[60px] px-3 py-2 gap-1 text-sm font-semibold'
        : 'flex-1 flex flex-col items-center justify-center min-h-[54px] px-2 py-2 gap-0.5 text-xs font-semibold'

      const activeClasses = variant === 'desktop'
        ? 'text-[var(--color-accent-cyan)] bg-[var(--color-bg-tertiary)] glow-cyan border-b-2 border-[var(--color-accent-cyan)]'
        : 'text-[var(--color-accent-cyan)] bg-[var(--color-bg-tertiary)] glow-cyan border-t-2 border-[var(--color-accent-cyan)]'

      return (
        <button
          type="button"
          key={`${variant}-${tab.id}`}
          onClick={() => setCurrentView(tab.id)}
          className={[
            baseClasses,
            'border-none bg-transparent cursor-pointer transition-all duration-300 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)]',
            isActive ? activeClasses : 'border-transparent'
          ].join(' ')}
          aria-label={tab.label}
          aria-current={isActive ? 'page' : undefined}
          role="tab"
          aria-selected={isActive}
        >
          <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
          <span className="truncate">{tab.label}</span>
        </button>
      )
    })

  const activeView = views[currentView] || views.performance

  return (
    <div className="relative min-h-screen flex flex-col text-[var(--color-text-primary)]">
      {/* Desktop navigation */}
      <header className="hidden md:block sticky top-0 z-40 w-full bg-[var(--color-bg-secondary)]/85 backdrop-blur-lg border-b border-[var(--color-glass-border)] shadow-lg shadow-black/20">
        <nav className="flex max-w-5xl mx-auto" role="tablist" aria-label="Main navigation">
          {renderTabs('desktop')}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pt-6 md:pt-12 pb-24 md:pb-12">
        {activeView}
      </main>

      {/* Mobile navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg-secondary)]/95 border-t border-[var(--color-glass-border)] backdrop-blur-lg px-2 shadow-[0_-6px_18px_rgba(0,0,0,0.6)]"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
        role="tablist"
        aria-label="Main navigation"
      >
        <div className="flex w-full max-w-4xl mx-auto">
          {renderTabs('mobile')}
        </div>
      </nav>

      <PWAUpdatePrompt />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
