import { useMemo } from 'react'
import { useApp } from '../hooks/useApp'
import { useSupabase } from '../context/SupabaseContext'
import { midiController } from '../midi'
import DashboardNavTile from '../components/dashboard/DashboardNavTile'
import DashboardStatusCard from '../components/dashboard/DashboardStatusCard'
import './DashboardView.css'

const NAV_TILES = [
  {
    id: 'performance',
    icon: '🎛️',
    title: 'Performance Control',
    description: 'Full rehearsal workstation with tap tempo, lyrics, and MIDI switching.'
  },
  {
    id: 'stage',
    icon: '🎤',
    title: 'Stage Mode',
    description: 'High-contrast interface for live shows, designed for quick hits.'
  },
  {
    id: 'metronome',
    icon: '⏱️',
    title: 'Metronome Setup',
    description: 'Dial in tempo, accents, and presets before rehearsal.'
  },
  {
    id: 'setlists',
    icon: '📋',
    title: 'Set Lists',
    description: 'Build and reorder your show flow with drag-and-drop.'
  },
  {
    id: 'songs',
    icon: '🎵',
    title: 'Song Library',
    description: 'Manage BPMs, time signatures, lyrics, and Helix programs.'
  },
  {
    id: 'lights',
    icon: '✨',
    title: 'MIDI Lights',
    description: 'Program lighting cues that stay locked to the click.'
  }
]

export default function DashboardView() {
  const {
    songs,
    setLists,
    currentView,
    setCurrentView,
    metronome: metronomeHook,
    focusMode
  } = useApp()
  const { user } = useSupabase()
  const { bpm, isPlaying, metronome } = metronomeHook
  const metronomeTimeSignature = metronome?.timeSignature ?? null
  const metronomeAccentPattern = Array.isArray(metronome?.accentPattern) ? metronome.accentPattern : null

  const stats = useMemo(() => {
    const setListCount = setLists.length
    const songCount = songs.length
    const helixConnected = Boolean(midiController.getHelixOutput())
    const accentCount = Array.isArray(metronomeAccentPattern) ? metronomeAccentPattern.filter(Boolean).length : 0

    return {
      setListCount,
      songCount,
      helixConnected,
      accentCount
    }
  }, [setLists, songs, metronomeAccentPattern])

  const heroSubtitle = useMemo(() => {
    if (!user) {
      return 'Signed out • Tap Log In to sync across your band.'
    }

    return `Welcome back${focusMode ? ' • Focus Mode' : ''}`
  }, [user, focusMode])

  const heroStatus = useMemo(() => {
    const parts = []
    parts.push(isPlaying ? `Metronome running ${bpm} BPM` : `Metronome idle ${bpm} BPM`)
    if (metronomeTimeSignature) {
      parts.push(`${metronomeTimeSignature}/4`)
    }
    if (stats.accentCount > 0) {
      parts.push(`${stats.accentCount} accents`)
    }
    return parts.join(' • ')
  }, [isPlaying, bpm, metronomeTimeSignature, stats.accentCount])

  const statusCards = useMemo(() => [
    {
      id: 'songs',
      title: 'Song Library',
      value: `${stats.songCount}`,
      meta: stats.songCount === 1 ? 'song loaded' : 'songs loaded',
      tone: stats.songCount > 0 ? 'success' : 'muted',
      actionLabel: stats.songCount === 0 ? 'Add songs' : 'View songs',
      onClick: () => setCurrentView('songs')
    },
    {
      id: 'setlists',
      title: 'Set Lists',
      value: `${stats.setListCount}`,
      meta: stats.setListCount === 1 ? 'set list ready' : 'set lists ready',
      tone: stats.setListCount > 0 ? 'success' : 'warning',
      actionLabel: stats.setListCount === 0 ? 'Create set list' : 'Manage set lists',
      onClick: () => setCurrentView('setlists')
    },
    {
      id: 'helix',
      title: 'Helix Output',
      value: stats.helixConnected ? 'Connected' : 'Offline',
      meta: stats.helixConnected ? 'Ready to switch presets' : 'Select MIDI output',
      tone: stats.helixConnected ? 'success' : 'warning',
      actionLabel: 'Open MIDI',
      onClick: () => setCurrentView('performance')
    }
  ], [setCurrentView, stats])

  return (
    <div className="dashboard-view" role="region" aria-label="Metronome suite overview">
      <section className="dashboard-hero">
        <div className="dashboard-hero-body">
          <div className="dashboard-hero-text">
            <span className="dashboard-hero-subtitle">{heroSubtitle}</span>
            <h1 className="dashboard-hero-title">Metronome Suite Control Center</h1>
            <p className="dashboard-hero-description">
              Jump into performance, prep your set, and verify every device is locked to the click.
            </p>
          </div>

          <div className="dashboard-hero-actions">
            <button
              type="button"
              className="btn btn-primary dashboard-primary-cta"
              onClick={() => setCurrentView('performance')}
            >
              {isPlaying ? 'Return to Performance' : 'Enter Performance View'}
            </button>
            <button
              type="button"
              className="btn btn-secondary dashboard-secondary-cta"
              onClick={() => setCurrentView('stage')}
            >
              Launch Stage Mode
            </button>
          </div>
        </div>
        <div className="dashboard-hero-status" role="status" aria-live="polite">
          <span className="dashboard-status-indicator" aria-hidden="true" />
          {heroStatus}
        </div>
      </section>

      <section className="dashboard-nav-section" aria-label="Primary actions">
        <div className="dashboard-nav-grid">
          {NAV_TILES.map(tile => (
            <DashboardNavTile
              key={tile.id}
              icon={tile.icon}
              title={tile.title}
              description={tile.description}
              actionLabel={currentView === tile.id ? 'Currently viewing' : 'Open'}
              active={currentView === tile.id}
              onClick={() => setCurrentView(tile.id)}
              stats={
                tile.id === 'songs'
                  ? `${stats.songCount} ${stats.songCount === 1 ? 'song' : 'songs'}`
                  : tile.id === 'setlists'
                    ? `${stats.setListCount} set lists`
                    : undefined
              }
            />
          ))}
        </div>
      </section>

      <section className="dashboard-status-section" aria-label="System readiness">
        <div className="dashboard-status-grid">
          {statusCards.map(card => (
            <DashboardStatusCard key={card.id} {...card} />
          ))}
        </div>
      </section>
    </div>
  )
}

