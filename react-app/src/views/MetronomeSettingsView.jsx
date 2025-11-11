import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import BeatPreview from '../components/Metronome/BeatPreview'
import { getAccentPresetsForSignature, saveMetronomePresetFromState, initPresets } from '../utils/presets'
import './MetronomeSettingsView.css'

const TIME_SIGNATURE_OPTIONS = [
  { value: 2, label: '2 / 4' },
  { value: 3, label: '3 / 4' },
  { value: 4, label: '4 / 4' },
  { value: 5, label: '5 / 4' },
  { value: 6, label: '6 / 8' },
  { value: 7, label: '7 / 8' },
  { value: 9, label: '9 / 8' },
  { value: 12, label: '12 / 8' }
]

const SUBDIVISION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'eighth', label: 'Eighth Notes' },
  { value: 'triplet', label: 'Triplets' },
  { value: 'sixteenth', label: 'Sixteenth Notes' }
]

const SOUND_PRESETS = [
  { value: 'click', label: 'Studio Click' },
  { value: 'wood', label: 'Wood Block' },
  { value: 'beep', label: 'Analog Beep' },
  { value: 'tick', label: 'Classic Tick' },
  { value: 'electronic', label: 'Electronic Pulse' }
]

const COUNT_IN_OPTIONS = [0, 1, 2, 4]

function buildAccentPattern(length, existing = []) {
  const safeLength = Math.max(length, 0)
  const pattern = new Array(safeLength).fill(false)

  for (let index = 0; index < pattern.length; index += 1) {
    if (Array.isArray(existing) && (existing[index] === true || existing[index] === 1)) {
      pattern[index] = true
    }
  }

  return pattern
}

export default function MetronomeSettingsView() {
  const { metronome: metronomeHook, songs, setLists, updateSong } = useApp()
  const {
    bpm,
    isPlaying,
    updateBPM,
    setTimeSignature: setMetronomeTimeSignature,
    setAccentPattern: setMetronomeAccentPattern,
    setSubdivision: setMetronomeSubdivision,
    setSoundPreset: setMetronomeSoundPreset,
    setCountIn: setMetronomeCountIn,
    setSoundEnabled: setMetronomeSoundEnabled,
    setAccentVolume: setMetronomeAccentVolume,
    setRegularVolume: setMetronomeRegularVolume,
    setSubdivisionVolume: setMetronomeSubdivisionVolume,
    setMasterVolume: setMetronomeMasterVolume,
    metronome
  } = metronomeHook

  const [timeSignature, setTimeSignatureState] = useState(() => metronome?.timeSignature || 4)
  const [accentPattern, setAccentPatternState] = useState(() => buildAccentPattern(metronome?.timeSignature || 4, metronome?.accentPattern || []))
  const [soundEnabled, setSoundEnabledState] = useState(() => metronome?.soundEnabled ?? true)
  const [visualEnabled, setVisualEnabled] = useState(() => localStorage.getItem('metronomeVisualEnabled') !== 'false')
  const [subdivision, setSubdivisionState] = useState(() => metronome?.subdivision || 'none')
  const [soundPreset, setSoundPresetState] = useState(() => 'click')
  const [countIn, setCountInState] = useState(() => metronome?.countInBeats || 0)
  const [accentVolume, setAccentVolumeState] = useState(() => 0.8)
  const [regularVolume, setRegularVolumeState] = useState(() => 0.5)
  const [subdivisionVolume, setSubdivisionVolumeState] = useState(() => 0.3)
  const [masterVolume, setMasterVolumeState] = useState(() => 0.3)

  const previewBeats = useMemo(() => {
    return accentPattern.map((isAccent, index) => ({ beat: index + 1, accent: isAccent }))
  }, [accentPattern])

  useEffect(() => {
    if (metronome?.accentPattern) {
      setAccentPatternState(buildAccentPattern(timeSignature, metronome.accentPattern))
    }
  }, [metronome?.accentPattern, timeSignature])

  useEffect(() => {
    if (metronome?.soundEnabled !== undefined) {
      setSoundEnabledState(metronome.soundEnabled)
    }
  }, [metronome?.soundEnabled])

  useEffect(() => {
    if (metronome?.subdivision) {
      setSubdivisionState(metronome.subdivision)
    }
  }, [metronome?.subdivision])

  useEffect(() => {
    if (metronome?.countInBeats !== undefined) {
      setCountInState(metronome.countInBeats)
    }
  }, [metronome?.countInBeats])

  useEffect(() => {
    localStorage.setItem('metronomeVisualEnabled', visualEnabled ? 'true' : 'false')
  }, [visualEnabled])

  useEffect(() => {
    setMetronomeTimeSignature?.(timeSignature)
  }, [setMetronomeTimeSignature, timeSignature])

  useEffect(() => {
    const hasAccents = accentPattern.some(Boolean)
    setMetronomeAccentPattern?.(hasAccents ? accentPattern : null)
  }, [accentPattern, setMetronomeAccentPattern])

  useEffect(() => {
    setMetronomeSubdivision?.(subdivision)
  }, [setMetronomeSubdivision, subdivision])

  useEffect(() => {
    setMetronomeSoundPreset?.(soundPreset)
  }, [setMetronomeSoundPreset, soundPreset])

  useEffect(() => {
    setMetronomeCountIn?.(countIn)
  }, [setMetronomeCountIn, countIn])

  useEffect(() => {
    setMetronomeAccentVolume?.(accentVolume)
  }, [accentVolume, setMetronomeAccentVolume])

  useEffect(() => {
    setMetronomeRegularVolume?.(regularVolume)
  }, [regularVolume, setMetronomeRegularVolume])

  useEffect(() => {
    setMetronomeSubdivisionVolume?.(subdivisionVolume)
  }, [setMetronomeSubdivisionVolume, subdivisionVolume])

  useEffect(() => {
    setMetronomeMasterVolume?.(masterVolume)
  }, [masterVolume, setMetronomeMasterVolume])

  const handleBPMChange = useCallback((nextValue) => {
    if (Number.isNaN(nextValue)) return
    updateBPM(nextValue)
  }, [updateBPM])

  const handleTimeSignatureChange = useCallback((value) => {
    const nextSignature = Number(value)
    setTimeSignatureState(nextSignature)
    setAccentPatternState((prev) => buildAccentPattern(nextSignature, prev))
  }, [])

  const handleAccentToggle = useCallback((index) => {
    setAccentPatternState((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [])

  const handleClearAccents = useCallback(() => {
    setAccentPatternState(new Array(timeSignature).fill(false))
  }, [timeSignature])

  const handleSoundToggle = useCallback((enabled) => {
    setSoundEnabledState(enabled)
    setMetronomeSoundEnabled?.(enabled)
    localStorage.setItem('metronomeSoundEnabled', enabled ? 'true' : 'false')
  }, [setMetronomeSoundEnabled])

  return (
    <div className="view metronome-settings-view" aria-labelledby="metronome-settings-title">
      <header className="view-header">
        <div>
          <h1 id="metronome-settings-title">Metronome Settings</h1>
          <p className="view-subtitle">
            Dial-in tempo, accents, and sound before rehearsal or performance. Changes apply to the global metronome.
          </p>
        </div>
        <div className="status-pill" role="status" aria-live="polite">
          {isPlaying ? 'Playing' : 'Stopped'} • {bpm} BPM
        </div>
      </header>

      <section className="settings-section" aria-labelledby="manual-controls-heading">
        <div className="section-header">
          <h2 id="manual-controls-heading">Manual Controls</h2>
          <p className="section-description">Set the foundational tempo and pulse that every view will use.</p>
        </div>

        <div className="settings-grid">
          <label className="settings-field">
            <span className="settings-label">Tempo (BPM)</span>
            <input
              type="number"
              min={40}
              max={300}
              value={bpm}
              onChange={(event) => handleBPMChange(Number(event.target.value))}
              className="settings-input"
              aria-describedby="tempo-help-text"
            />
            <small id="tempo-help-text" className="settings-help">
              Enter an exact BPM or nudge later inside Performance view.
            </small>
          </label>

          <label className="settings-field">
            <span className="settings-label">Time Signature</span>
            <select
              value={timeSignature}
              onChange={(event) => handleTimeSignatureChange(event.target.value)}
              className="settings-select"
            >
              {TIME_SIGNATURE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="settings-field">
            <span className="settings-label">Count In Beats</span>
            <select
              value={countIn}
              onChange={(event) => setCountInState(Number(event.target.value))}
              className="settings-select"
            >
              {COUNT_IN_OPTIONS.map(option => (
                <option key={option} value={option}>{option === 0 ? 'Disabled' : option}</option>
              ))}
            </select>
          </label>

          <label className="settings-field toggle-field">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => handleSoundToggle(event.target.checked)}
            />
            <span>Enable Click Sound</span>
          </label>

          <label className="settings-field toggle-field">
            <input
              type="checkbox"
              checked={visualEnabled}
              onChange={(event) => setVisualEnabled(event.target.checked)}
            />
            <span>Enable Visual Flash</span>
          </label>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="accent-grid-heading">
        <div className="section-header">
          <h2 id="accent-grid-heading">Accent Grid</h2>
          <p className="section-description">Tap the beats that should punch. These settings sync across every view.</p>
        </div>

        <div className="accent-grid" role="group" aria-label="Accent pattern editor">
          {accentPattern.map((isAccent, index) => (
            <button
              key={`accent-${index}`}
              type="button"
              className={`accent-cell ${isAccent ? 'accented' : ''}`}
              onClick={() => handleAccentToggle(index)}
              aria-pressed={isAccent}
              aria-label={`Beat ${index + 1} ${isAccent ? 'accented' : 'not accented'}. Tap to toggle.`}
            >
              <span className="accent-number">{index + 1}</span>
              {isAccent && <span className="accent-dot" aria-hidden="true">•</span>}
            </button>
          ))}
        </div>

        <div className="accent-actions">
          <button type="button" className="btn btn-secondary btn-small" onClick={handleClearAccents}>
            Clear Accents
          </button>
          <div className="accent-preview" aria-live="polite">
            <span className="accent-preview-label">Preview Beats:</span>
            <span className="accent-preview-values">
              {previewBeats.filter(beat => beat.accent).length > 0
                ? previewBeats.filter(beat => beat.accent).map(beat => beat.beat).join(', ')
                : 'No accents'}
            </span>
          </div>
        </div>

        <div className="preview-wrapper" aria-hidden={!visualEnabled}>
          <BeatPreview
            bpm={bpm}
            timeSignature={timeSignature}
            accentPattern={accentPattern}
            showBeatNumber={true}
            visualEnabled={visualEnabled}
            playing={false}
          />
        </div>
      </section>

      <section className="settings-section" aria-labelledby="sound-design-heading">
        <div className="section-header">
          <h2 id="sound-design-heading">Sound & Feel</h2>
          <p className="section-description">Fine-tune how the click sounds in in-ears, wedges, or the house.</p>
        </div>

        <div className="settings-grid sound-grid">
          <label className="settings-field">
            <span className="settings-label">Sound Preset</span>
            <select
              value={soundPreset}
              onChange={(event) => setSoundPresetState(event.target.value)}
              className="settings-select"
            >
              {SOUND_PRESETS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="settings-field">
            <span className="settings-label">Subdivision Feel</span>
            <select
              value={subdivision}
              onChange={(event) => setSubdivisionState(event.target.value)}
              className="settings-select"
            >
              {SUBDIVISION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="settings-field">
            <span className="settings-label">Accent Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={accentVolume}
              onChange={(event) => setAccentVolumeState(Number(event.target.value))}
            />
          </label>

          <label className="settings-field">
            <span className="settings-label">Regular Beat Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={regularVolume}
              onChange={(event) => setRegularVolumeState(Number(event.target.value))}
            />
          </label>

          <label className="settings-field">
            <span className="settings-label">Subdivision Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={subdivisionVolume}
              onChange={(event) => setSubdivisionVolumeState(Number(event.target.value))}
            />
          </label>

          <label className="settings-field">
            <span className="settings-label">Master Output</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={masterVolume}
              onChange={(event) => setMasterVolumeState(Number(event.target.value))}
            />
          </label>
        </div>

        <details className="inline-help">
          <summary>Need guidance? Quick tips</summary>
          <ul>
            <li>Count-in clicks give everyone a cue before the first downbeat.</li>
            <li>Enable subdivisions when tempos climb past 140 BPM.</li>
            <li>Lower master volume if the click is routed to the main PA.</li>
          </ul>
        </details>
      </section>

      <section className="settings-section" aria-labelledby="workflow-heading">
        <div className="section-header">
          <h2 id="workflow-heading">Workflow Shortcuts</h2>
          <p className="section-description">Move to the right surface without digging into menus.</p>
        </div>

        <div className="tip-card-grid">
          <article className="tip-card">
            <h3>Performance View</h3>
            <p>Full rehearsal control including tap tempo, lyrics, and editing.</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { view: 'performance' } }))}
            >
              Open Performance
            </button>
          </article>

          <article className="tip-card">
            <h3>Stage Mode</h3>
            <p>High-contrast controls with minimal distractions when it is showtime.</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => window.dispatchEvent(new CustomEvent('app:navigate', { detail: { view: 'stage' } }))}
            >
              Prepare Stage Mode
            </button>
          </article>

          <article className="tip-card">
            <h3>Need Help?</h3>
            <p>Review configuration ideas for rock, worship, theatre, or jazz setups.</p>
            <a
              className="btn btn-link"
              href="https://github.com/petermason1/performance-pwa/wiki/Metronome"
              target="_blank"
              rel="noreferrer"
            >
              Metronome Guide
            </a>
          </article>
        </div>
      </section>
    </div>
  )
}

