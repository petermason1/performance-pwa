import { useState } from 'react'
import TempoDisplay from './TempoDisplay'
import ControlStrip from './ControlStrip'
import BeatFlash from './BeatFlash'
import TempoWheel from './TempoWheel'
import BottomControls from './BottomControls'
import SongNavigation from './SongNavigation'
import StageHeader from './StageHeader'
import SetListPanel from './SetListPanel'
import HelixPresetModal from './HelixPresetModal'
import { midiController } from '../../midi'

export default function LiveView({
  bpm,
  timeSignature,
  isPlaying,
  soundEnabled,
  visualEnabled,
  rotation,
  wheelRef,
  tapTempoMessage,
  currentSong,
  setListSongs,
  currentSongIndex,
  currentSetList,
  isBeatFlashing,
  isAccentBeat,
  currentBeatInMeasure,
  showBeatNumber,
  accentPattern,
  onToggleMetronome,
  onSoundToggle,
  onVisualToggle,
  onTimeSignatureChange,
  onTapTempo,
  onPreviousSong,
  onNextSong,
  onSelectSong,
  soundPreset,
  subdivision,
  countInBeats,
  accentVolume,
  regularVolume,
  subdivisionVolume,
  masterVolume,
  onSoundPresetChange,
  onSubdivisionChange,
  onCountInChange,
  onAccentVolumeChange,
  onRegularVolumeChange,
  onSubdivisionVolumeChange,
  onMasterVolumeChange,
  onToggleAccent,
  presetFeedback,
  onSendHelixPreset,
  onReorderSetList
}) {
  const [showSettings, setShowSettings] = useState(false)
  const [showHelixModal, setShowHelixModal] = useState(false)
  const [setListCollapsed, setSetListCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const isPortrait = window.innerHeight > window.innerWidth
      return isPortrait
    }
    return false
  })

  const cycleTimeSignature = () => {
    const nextSig = timeSignature === 4 ? 3 : timeSignature === 3 ? 6 : 4
    onTimeSignatureChange(nextSig)
  }

  const helixConnected = Boolean(midiController.getHelixOutput())

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)]">
      <StageHeader
        currentSong={currentSong}
        currentSongIndex={currentSongIndex}
        setListSongs={setListSongs}
        currentSetList={currentSetList}
        onSettingsClick={() => setShowSettings(true)}
        onOpenHelixModal={onSendHelixPreset ? () => setShowHelixModal(true) : undefined}
        helixConnected={helixConnected}
        presetFeedback={presetFeedback}
      />

      <div className="flex-1 flex flex-col overflow-y-auto">
        <TempoDisplay 
          bpm={bpm} 
          timeSignature={timeSignature} 
          onTimeSignatureClick={cycleTimeSignature}
        />

        <ControlStrip
          soundEnabled={soundEnabled}
          isPlaying={isPlaying}
          visualEnabled={visualEnabled}
          onSoundToggle={onSoundToggle}
          onToggleMetronome={onToggleMetronome}
          onVisualToggle={onVisualToggle}
          soundPreset={soundPreset}
          subdivision={subdivision}
          countInBeats={countInBeats}
          accentVolume={accentVolume}
          regularVolume={regularVolume}
          subdivisionVolume={subdivisionVolume}
          masterVolume={masterVolume}
          onSoundPresetChange={onSoundPresetChange}
          onSubdivisionChange={onSubdivisionChange}
          onCountInChange={onCountInChange}
          onAccentVolumeChange={onAccentVolumeChange}
          onRegularVolumeChange={onRegularVolumeChange}
          onSubdivisionVolumeChange={onSubdivisionVolumeChange}
          onMasterVolumeChange={onMasterVolumeChange}
        />

        {visualEnabled && (
          <BeatFlash
            isFlashing={isBeatFlashing}
            isAccent={isAccentBeat}
            currentBeat={currentBeatInMeasure}
            timeSignature={timeSignature}
            showBeatNumber={showBeatNumber}
            accentPattern={accentPattern}
            editableAccents={Boolean(onToggleAccent)}
            onToggleAccent={onToggleAccent}
          />
        )}

        <TempoWheel
          rotation={rotation}
          wheelRef={wheelRef}
          bpm={bpm}
          isPlaying={isPlaying}
          onToggleMetronome={onToggleMetronome}
        />

        <BottomControls
          timeSignature={timeSignature}
          tapTempoMessage={tapTempoMessage}
          onTimeSignatureChange={onTimeSignatureChange}
          onTapTempo={onTapTempo}
        />

        <SongNavigation
          setListSongs={setListSongs}
          currentSongIndex={currentSongIndex}
          currentSong={currentSong}
          onPreviousSong={onPreviousSong}
          onNextSong={onNextSong}
        />
      </div>

      {currentSetList && setListSongs.length > 0 && (
        <SetListPanel
          setList={currentSetList}
          songs={setListSongs}
          currentSongIndex={currentSongIndex}
          collapsed={setListCollapsed}
          onToggleCollapse={() => setSetListCollapsed(!setListCollapsed)}
          onSelectSong={onSelectSong}
          onReorder={onReorderSetList}
        />
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-glass-border)] rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Stage Mode Settings</h2>
            <p className="text-[var(--color-text-secondary)] mb-4">Settings panel coming soon...</p>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-[var(--color-accent-cyan)] text-black rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showHelixModal && onSendHelixPreset && (
        <HelixPresetModal
          currentSong={currentSong}
          onClose={() => setShowHelixModal(false)}
          onSendPreset={onSendHelixPreset}
        />
      )}
    </div>
  )
}

