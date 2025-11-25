import { useEffect, useMemo, useState, useCallback } from 'react'
import { AppProvider } from './AppContext'
import { useApp } from './hooks/useApp'
import { useSupabase } from './context/SupabaseContext'
import './App.css'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import AuthBanner from './components/Auth/AuthBanner'
import AppHeader from './components/layout/AppHeader'
import AppFooter from './components/layout/AppFooter'
import PageHeader from './components/layout/PageHeader'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineQueueIndicator from './components/OfflineQueueIndicator'

// Import views
import DashboardView from './views/DashboardView'
import PerformanceView from './views/PerformanceView'
import SetListsView from './views/SetListsView'
import SongsView from './views/SongsView'
import MIDILightsView from './views/MIDILightsView'
import MetronomeSettingsView from './views/MetronomeSettingsView'
import StageModeView from './views/StageModeView'

const NAV_GROUPS = [
  {
    icon: '🏠',
    label: 'Overview',
    helper: 'System status & quick actions',
    tabs: [
      { id: 'dashboard', icon: '⚡', label: 'Control Center', description: 'Mission control hub' }
    ]
  },
  {
    icon: '🎭',
    label: 'Perform',
    helper: 'Live & rehearsal tools',
    tabs: [
      { id: 'performance', icon: '🎛️', label: 'Rehearse', description: 'Full workstation', priority: 'primary', actionLabel: '▶ Start Session' },
      { id: 'stage', icon: '🎤', label: 'Go Live', description: 'Stage mode', actionLabel: '🚀 Launch' }
    ]
  },
  {
    icon: '🛠️',
    label: 'Prepare',
    helper: 'Build sets & configure tempo',
    tabs: [
      { id: 'metronome', icon: '⏱️', label: 'Tempo', description: 'Adjust BPM & accents' },
      { id: 'setlists', icon: '📋', label: 'Set Lists', description: 'Plan your shows', actionLabel: '➕ New Set' },
      { id: 'songs', icon: '🎵', label: 'Library', description: 'Manage songs & presets' }
    ]
  },
  {
    icon: '💡',
    label: 'Control',
    helper: 'Automation & lighting',
    tabs: [
      { id: 'lights', icon: '🌈', label: 'Lights', description: 'MIDI lighting cues' }
    ]
  }
]

const TABS = NAV_GROUPS.flatMap(group => group.tabs)

function AppContent() {
  const { currentView, setCurrentView, importData, dbInitialized, ui, dispatchUi } = useApp()
  const { user } = useSupabase()
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Persist and restore currentView
  useEffect(() => {
    const saved = localStorage.getItem('appCurrentView')
    if (saved && ['dashboard', 'performance', 'stage', 'metronome', 'setlists', 'songs', 'lights'].includes(saved)) {
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
      if (desiredView && ['dashboard', 'performance', 'stage', 'metronome', 'setlists', 'songs', 'lights'].includes(desiredView)) {
        setCurrentView(desiredView)
      }
    }

    window.addEventListener('app:navigate', handleNavigate)
    return () => window.removeEventListener('app:navigate', handleNavigate)
  }, [setCurrentView])

  const views = useMemo(() => ({
    dashboard: <DashboardView />,
    performance: <PerformanceView />,
    stage: <StageModeView />,
    metronome: <MetronomeSettingsView />,
    setlists: <SetListsView />,
    songs: <SongsView />,
    lights: <MIDILightsView />
  }), [])

  const activeView = views[currentView] || views.dashboard
  const activeTabMeta = useMemo(() => TABS.find(tab => tab.id === currentView), [currentView])

  const statusText = useMemo(() => {
    switch (currentView) {
      case 'performance':
        return 'Live controls standing by'
      case 'stage':
        return 'Stage view armed for showtime'
      case 'metronome':
        return 'Metronome ready to edit'
      case 'setlists':
        return 'Set lists synced'
      case 'songs':
        return 'Library loaded'
      case 'lights':
        return 'Lighting cues available'
      default:
        return 'All systems synced'
    }
  }, [currentView])

  const handleOpenSettings = useCallback(() => {
    setCurrentView('metronome')
  }, [setCurrentView])

    return (
      <>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <a href="#navigation" className="skip-link">Skip to navigation</a>
        <div className="app-shell">
      <AuthBanner />

      {/* Integrated Header with Menu + Branding */}
      <AppHeader
        tabs={TABS}
        groups={NAV_GROUPS}
        currentView={currentView}
        onSelect={setCurrentView}
        activeTab={activeTabMeta}
        statusText={statusText}
        onOpenSettings={handleOpenSettings}
      />

        <main className={`app-shell-main ${user ? 'has-user' : ''}`}>
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
    <ErrorBoundary>
      <AppProvider>
        <ErrorBoundary>
          <AppContent />
          <OfflineQueueIndicator />
        </ErrorBoundary>
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App
