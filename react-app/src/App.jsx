import { useEffect, useMemo } from 'react'
import { AppProvider } from './AppContext'
import { useApp } from './hooks/useApp'
import { useSupabase } from './context/SupabaseContext'
import './App.css'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import AuthBanner from './components/Auth/AuthBanner'
import AppHeader from './components/layout/AppHeader'
import AppFooter from './components/layout/AppFooter'

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
  const { currentView, setCurrentView, importData, dbInitialized } = useApp()
  const { user } = useSupabase()

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
        <AppHeader
          tabs={TABS}
          currentView={currentView}
          onSelect={setCurrentView}
        />

        <main className={`flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pb-24 md:pb-12 ${user ? 'pt-20 md:pt-24' : 'pt-6 md:pt-12'}`}>
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
