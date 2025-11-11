import { useEffect, useMemo, useState } from 'react'
import { AppProvider } from './AppContext'
import { useApp } from './hooks/useApp'
import { useSupabase } from './context/SupabaseContext'
import './App.css'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import AuthBanner from './components/Auth/AuthBanner'
import AppHeader from './components/layout/AppHeader'
import AppFooter from './components/layout/AppFooter'
import SidebarNav from './components/layout/SidebarNav'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'

// Import views
import PerformanceView from './views/PerformanceView'
import SetListsView from './views/SetListsView'
import SongsView from './views/SongsView'
import MIDILightsView from './views/MIDILightsView'
import MetronomeSettingsView from './views/MetronomeSettingsView'
import StageModeView from './views/StageModeView'

const TABS = [
  { id: 'performance', icon: '🎭', label: 'Performance' },
  { id: 'stage', icon: '🎤', label: 'Stage Mode' },
  { id: 'metronome', icon: '🎛️', label: 'Metronome' },
  { id: 'setlists', icon: '📋', label: 'Set Lists' },
  { id: 'songs', icon: '🎵', label: 'Songs' },
  { id: 'lights', icon: '🎹', label: 'MIDI Lights' }
]

function AppContent() {
  const { currentView, setCurrentView, importData, dbInitialized, ui, dispatchUi } = useApp()
  const { user } = useSupabase()
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Persist and restore currentView
  useEffect(() => {
    const saved = localStorage.getItem('appCurrentView')
    if (saved && ['performance', 'stage', 'metronome', 'setlists', 'songs', 'lights'].includes(saved)) {
      setCurrentView(saved)
    }
  }, [setCurrentView])

  useEffect(() => {
    localStorage.setItem('appCurrentView', currentView)
  }, [currentView])

  // Global keyboard shortcuts handler (? key to show shortcuts)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when typing in inputs
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable ||
        e.target.closest('.modal')
      ) {
        return
      }

      // ? or / to show shortcuts
      if (e.key === '?' || (e.key === '/' && !e.shiftKey)) {
        e.preventDefault()
        setShowShortcuts(true)
        dispatchUi({ type: 'OPEN_SHORTCUTS' })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dispatchUi])

  // Sync shortcuts modal with UI state
  useEffect(() => {
    if (ui.openShortcuts && !showShortcuts) {
      setShowShortcuts(true)
    }
  }, [ui.openShortcuts, showShortcuts])

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

  useEffect(() => {
    const handleNavigate = (event) => {
      const desiredView = event?.detail?.view
      if (desiredView && ['performance', 'stage', 'metronome', 'setlists', 'songs', 'lights'].includes(desiredView)) {
        setCurrentView(desiredView)
      }
    }

    window.addEventListener('app:navigate', handleNavigate)
    return () => window.removeEventListener('app:navigate', handleNavigate)
  }, [setCurrentView])

  const views = useMemo(() => ({
    performance: <PerformanceView />,
    stage: <StageModeView />,
    metronome: <MetronomeSettingsView />,
    setlists: <SetListsView />,
    songs: <SongsView />,
    lights: <MIDILightsView />
  }), [])

  const activeView = views[currentView] || views.performance

    return (
      <>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <a href="#navigation" className="skip-link">Skip to navigation</a>
        <div className="relative min-h-screen flex flex-col text-[var(--color-text-primary)]">
      <AuthBanner />
      
      {/* Desktop Sidebar Navigation */}
      <SidebarNav
        currentView={currentView}
        onSelect={setCurrentView}
      />
      
      {/* Desktop Header (without nav) */}
      <AppHeader />

        <main className={`flex-1 w-full max-w-5xl mx-auto pb-24 md:pb-12 md:ml-[240px] ${user ? 'pt-20 md:pt-24' : 'pt-6 md:pt-12'}`}>
        {activeView}
      </main>

      <AppFooter
        tabs={TABS}
        currentView={currentView}
        onSelect={setCurrentView}
      >
        <span className="tracking-[0.4em] uppercase">Navigate • Perform • Share</span>
      </AppFooter>
      <PWAUpdatePrompt />
      
      {/* Global Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal 
          onClose={() => { 
            setShowShortcuts(false)
            dispatchUi({ type: 'CLOSE_SHORTCUTS' })
          }} 
        />
      )}
    </div>
    </>
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
