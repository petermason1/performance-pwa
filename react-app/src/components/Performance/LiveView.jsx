import TempoDisplay from './TempoDisplay'
import ControlStrip from './ControlStrip'
import BeatFlash from './BeatFlash'
import TempoWheel from './TempoWheel'
import BottomControls from './BottomControls'
import SongNavigation from './SongNavigation'

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
  onToggleAccent
}) {
  const cycleTimeSignature = () => {
    const nextSig = timeSignature === 4 ? 3 : timeSignature === 3 ? 6 : 4
    onTimeSignatureChange(nextSig)
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col bg-[var(--color-bg-primary)] pb-8">
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
  )
}

