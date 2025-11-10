# MIDI Preset Workflow - Helix Integration

## Overview
Automatic Helix preset switching per song, with manual override and fallback when MIDI is unavailable.

## Requirements
1. Each song can have an assigned Helix preset number (0-127)
2. When a song becomes active (selected from setlist or via prev/next), send MIDI program change automatically
3. Manual override: tap MIDI icon to select preset without changing song
4. Visual feedback: MIDI status indicator (connected, no device, error)
5. Graceful fallback: app works normally if MIDI is unavailable

## Data Model

### Song Schema (Updated)
```typescript
interface Song {
  id: string
  name: string
  artist?: string
  bpm: number
  timeSignature: number
  lyrics?: string
  helixPreset?: number // 0-127, or null if not assigned
  accentPattern?: boolean[]
  // ... existing fields
}
```

### Supabase Schema (Already Defined)
```sql
-- In songs table
midi_preset INTEGER CHECK (midi_preset >= 0 AND midi_preset <= 127)
```

### IndexedDB Schema (Already Exists)
```javascript
// In db.js, songs table already has helixPreset field
```

## User Flow

### 1. Assign Preset to Song
**Location**: Song modal (edit song)

```
┌─────────────────────────────────────┐
│  Edit Song: "Sweet Child O' Mine"  │
├─────────────────────────────────────┤
│  Name: [Sweet Child O' Mine]       │
│  Artist: [Guns N' Roses]            │
│  BPM: [125]  Time Sig: [4/4]       │
│                                     │
│  🎹 Helix Preset                    │
│  ┌─────────────────────────────┐   │
│  │ [23] Clean Strat          ▼│   │ ← Dropdown
│  └─────────────────────────────┘   │
│  [ ] Auto-switch when song starts  │ ← Checkbox (default: on)
│                                     │
│  [Cancel]  [Save]                   │
└─────────────────────────────────────┘
```

**Component**: `PresetSelector.jsx`
```javascript
function PresetSelector({ value, onChange, autoSwitch, onAutoSwitchChange }) {
  const presets = [
    { number: 0, name: 'Acoustic' },
    { number: 1, name: 'Clean' },
    { number: 2, name: 'Crunch' },
    // ... load from preferences or hardcoded
  ]

  return (
    <div className="preset-selector">
      <label className="text-sm text-[var(--color-text-secondary)]">
        🎹 Helix Preset
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)]"
      >
        <option value="">No preset</option>
        {presets.map(p => (
          <option key={p.number} value={p.number}>
            [{p.number}] {p.name}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 mt-2 text-sm">
        <input
          type="checkbox"
          checked={autoSwitch}
          onChange={(e) => onAutoSwitchChange(e.target.checked)}
        />
        Auto-switch when song starts
      </label>
    </div>
  )
}
```

### 2. Automatic Preset Switching
**Location**: PerformanceView when song changes

```javascript
// In PerformanceView.jsx
useEffect(() => {
  if (currentSong && currentSong.helixPreset != null && midiController) {
    const autoSwitch = currentSong.autoSwitchPreset !== false // default true
    
    if (autoSwitch && midiController.getHelixOutput()) {
      midiController.sendProgramChange(
        currentSong.helixPreset,
        0, // channel
        true // use Helix output
      )
      
      console.log(`Switched to Helix preset ${currentSong.helixPreset} for "${currentSong.name}"`)
      
      // Optional: Show toast notification
      showToast(`Preset ${currentSong.helixPreset} activated`)
    }
  }
}, [currentSong])
```

### 3. Manual Override
**Location**: Stage mode top bar or performance view settings

```
┌─────────────────────────────────────┐
│  🎵 Sweet Child O' Mine    [🎹 23] │ ← MIDI indicator (tap to open)
└─────────────────────────────────────┘

On tap:
┌─────────────────────────────────────┐
│  MIDI Control                       │
├─────────────────────────────────────┤
│  Status: ✅ Connected (Helix HX)    │
│                                     │
│  Current Preset: 23                 │
│  ┌─────────────────────────────┐   │
│  │ [23] Clean Strat          ▼│   │
│  └─────────────────────────────┘   │
│  [Send Now]                         │
│                                     │
│  [ ] Auto-switch enabled            │
│  [Close]                            │
└─────────────────────────────────────┘
```

**Component**: `MIDIControlModal.jsx`
```javascript
function MIDIControlModal({ currentSong, onClose }) {
  const { midiController, midiStatus } = useMIDI()
  const [selectedPreset, setSelectedPreset] = useState(currentSong?.helixPreset ?? 0)

  const handleSendPreset = () => {
    midiController.sendProgramChange(selectedPreset, 0, true)
    showToast(`Preset ${selectedPreset} sent`)
  }

  return (
    <div className="modal">
      <h3>MIDI Control</h3>
      
      <div className="status">
        <MIDIStatusIndicator status={midiStatus} />
      </div>

      {midiStatus === 'connected' && (
        <>
          <PresetSelector
            value={selectedPreset}
            onChange={setSelectedPreset}
          />
          <button onClick={handleSendPreset}>Send Now</button>
        </>
      )}

      {midiStatus === 'no_device' && (
        <p>No MIDI device detected. Connect your Helix and refresh.</p>
      )}

      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

### 4. MIDI Status Indicator
**Location**: Top bar of stage mode and performance view

```javascript
function MIDIStatusIndicator({ status, helixOutput }) {
  const icons = {
    connected: '🎹',
    no_device: '🎹',
    error: '⚠️'
  }

  const colors = {
    connected: 'text-green-400',
    no_device: 'text-yellow-400',
    error: 'text-red-400'
  }

  const messages = {
    connected: `Connected: ${helixOutput?.name || 'Unknown'}`,
    no_device: 'No MIDI device',
    error: 'MIDI error'
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${colors[status]}`}>
      <span>{icons[status]}</span>
      <span>{messages[status]}</span>
    </div>
  )
}
```

## MIDI Controller Updates

### Enhanced MIDIController Class
`/react-app/src/midi.ts` (already exists, extend):

```typescript
class MIDIController {
  // ... existing code ...

  // Track last sent preset to avoid redundant sends
  private lastPreset: number | null = null

  sendProgramChangeIfNeeded(program: number, channel: number = 0): boolean {
    if (this.lastPreset === program) {
      console.log(`Preset ${program} already active, skipping`)
      return true
    }

    const success = this.sendProgramChange(program, channel, true)
    if (success) {
      this.lastPreset = program
    }
    return success
  }

  resetLastPreset(): void {
    this.lastPreset = null
  }
}
```

## Preferences Storage

### Per-User Preset Names
Store custom preset names in Supabase `preferences` table:

```sql
-- Add preset_names to preferences table
ALTER TABLE public.preferences
ADD COLUMN preset_names JSONB DEFAULT '{}'::jsonb;

-- Example data:
-- {"0": "Acoustic", "1": "Clean", "23": "Sweet Child Lead"}
```

### Load Preset Names
```javascript
// In useMIDI.js or preferences context
const [presetNames, setPresetNames] = useState({})

useEffect(() => {
  if (user && bandId) {
    supabase
      .from('preferences')
      .select('preset_names')
      .eq('user_id', user.id)
      .eq('band_id', bandId)
      .single()
      .then(({ data }) => {
        setPresetNames(data?.preset_names || {})
      })
  }
}, [user, bandId])

const savePresetName = async (presetNumber, name) => {
  const updated = { ...presetNames, [presetNumber]: name }
  setPresetNames(updated)
  
  await supabase
    .from('preferences')
    .upsert({
      user_id: user.id,
      band_id: bandId,
      preset_names: updated
    })
}
```

## Fallback Behavior

### When MIDI is Unavailable
1. Song selection works normally (no errors)
2. MIDI status shows "No device" in yellow
3. Preset selector is still visible (for planning)
4. "Send Now" button is disabled with tooltip: "Connect MIDI device to send presets"
5. All song data (including preset assignments) is saved normally

### Error Handling
```javascript
const handleSongChange = (song) => {
  setCurrentSong(song)

  if (song.helixPreset != null && song.autoSwitchPreset !== false) {
    try {
      const success = midiController.sendProgramChangeIfNeeded(song.helixPreset, 0)
      if (!success) {
        console.warn(`Failed to send preset ${song.helixPreset}`)
        // Don't block UI, just log
      }
    } catch (error) {
      console.error('MIDI error:', error)
      // Graceful degradation - continue without MIDI
    }
  }
}
```

## Testing Plan

### Manual Testing
1. **With Helix Connected**:
   - Assign preset to song
   - Select song, verify preset switches
   - Manual override, verify correct program change sent
   - Prev/next through setlist, verify each preset switches

2. **Without Helix**:
   - App loads normally
   - Status shows "No device"
   - Preset assignment UI works
   - Song selection works (no errors)

3. **Helix Disconnected Mid-Session**:
   - Status updates to "No device"
   - Reconnect: status updates to "Connected"
   - Next song change should work

### Automated Testing (Future)
```javascript
// In midi.test.js
describe('MIDIController preset switching', () => {
  it('sends program change when preset is assigned', () => {
    const mockOutput = { send: vi.fn() }
    midiController.setHelixOutput(0) // mock setup
    
    midiController.sendProgramChange(23, 0, true)
    
    expect(mockOutput.send).toHaveBeenCalledWith([0xC0, 23])
  })

  it('skips redundant preset sends', () => {
    // ... test lastPreset tracking
  })
})
```

## UI Components Summary

### New/Updated Components
1. **PresetSelector.jsx**: Dropdown for selecting Helix preset (0-127) with custom names
2. **MIDIControlModal.jsx**: Manual override modal for preset control
3. **MIDIStatusIndicator.jsx**: Status badge (connected/no device/error)
4. **SongModal.jsx** (update): Add PresetSelector to song edit form

### Integration Points
- `PerformanceView.jsx`: Auto-switch on song change
- `StageView.jsx`: MIDI status indicator in top bar, manual control button
- `SongModal.jsx`: Preset assignment UI
- `useMIDI.js`: Hook for MIDI state and controller access

## Roadmap

### Phase 1: Basic Preset Switching (Week 1)
- [ ] Add helixPreset field to song schema
- [ ] Build PresetSelector component
- [ ] Integrate into SongModal
- [ ] Auto-switch on song change

### Phase 2: Manual Control (Week 1)
- [ ] Build MIDIControlModal
- [ ] Add MIDI status indicator
- [ ] Manual override button in stage mode

### Phase 3: Preset Names (Week 2)
- [ ] Add preset_names to preferences table
- [ ] UI for renaming presets
- [ ] Load/save custom names

### Phase 4: Advanced Features (Week 3+)
- [ ] Preset templates (save/load common setups)
- [ ] MIDI learn (tap preset on Helix to capture number)
- [ ] Multi-device support (multiple Helix units)

---

**Next Steps**: Update SongModal to include PresetSelector and test auto-switching with connected Helix.

