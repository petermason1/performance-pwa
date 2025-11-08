import { useEffect } from 'react'
import { AppProvider } from './AppContext'
import { useApp } from './hooks/useApp'
import './App.css'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'

// Import views
import PerformanceView from './views/PerformanceView'
import SetListsView from './views/SetListsView'
import SongsView from './views/SongsView'
import MIDILightsView from './views/MIDILightsView'

function AppContent() {
  const { currentView, setCurrentView, importData, dbInitialized } = useApp()

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

  const views = {
    performance: <PerformanceView />,
    setlists: <SetListsView />,
    songs: <SongsView />,
    lights: <MIDILightsView />
  }

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${currentView === 'performance' ? 'active' : ''}`}
          onClick={() => setCurrentView('performance')}
        >
          Performance
        </button>
        <button 
          className={`nav-tab ${currentView === 'setlists' ? 'active' : ''}`}
          onClick={() => setCurrentView('setlists')}
        >
          Set Lists
        </button>
        <button 
          className={`nav-tab ${currentView === 'songs' ? 'active' : ''}`}
          onClick={() => setCurrentView('songs')}
        >
          Songs
        </button>
        <button 
          className={`nav-tab ${currentView === 'lights' ? 'active' : ''}`}
          onClick={() => setCurrentView('lights')}
        >
          MIDI Lights
        </button>
      </nav>

      {/* Current View */}
      <div className="view active">
        {views[currentView] || views.performance}
      </div>

      {/* PWA Update Prompt */}
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
