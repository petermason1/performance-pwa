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
  const { currentView, setCurrentView } = useApp()

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
