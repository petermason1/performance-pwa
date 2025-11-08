# Performance Metronome PWA - Product Specification

## Overview
A cross-platform Progressive Web App for live performance, providing a professional metronome, set list management, and MIDI control capabilities. Designed for iOS/Android/Desktop with offline-first architecture.

## Core Features

### 1. Metronome Engine
**Timing Requirements:**
- Accuracy: ±1ms timing precision using WebAudio scheduler
- BPM Range: 40-300 (single 360° wheel rotation)
- Time Signatures: 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, etc.
- Subdivisions: Quarter, eighth, sixteenth notes
- Accent patterns: Customizable per song

**Audio:**
- Click samples (high/low for accents)
- Oscillator fallback with envelope (no clicks)
- Volume control per click type
- User gesture required to start (iOS requirement)

**Visual:**
- Synchronized beat flash
- Beat counter display
- Current subdivision indicator

**Tap Tempo:**
- Minimum 2 taps, optimal at 4-8 taps
- 3-second decay window
- Visual feedback on each tap
- Average calculation with outlier detection

### 2. Performance View (Stage Mode)
**Layout:**
- Large tempo wheel (centered, responsive)
- Current song title above wheel
- Prev/Next navigation (2-column grid below wheel)
- Song list (scrollable, numbered)
- BPM display in wheel center
- Play/Pause integrated in wheel

**Interaction Rules:**
- Tap any song → starts metronome with that song's BPM
- Tap playing song → stops metronome
- Tap different song while playing → switches to that song
- Prev/Next buttons navigate set list
- Optional: long-press to stop (setting)

**Responsive Design:**
- 320px+ mobile (iPhone SE)
- 375px+ standard mobile
- 768px+ tablet
- 1024px+ desktop
- Text scales appropriately
- Touch targets minimum 44x44px

### 3. Set Lists
**Management:**
- Create/edit/delete set lists
- Add songs via search (filters available songs only)
- Drag-and-drop reordering (dedicated page)
- Auto-numbering
- Multiple set lists support

**Sharing:**
- Export as `.metronome.json` file
- Import from file or clipboard
- Share URL with base64 encoded data: `?import=<data>`
- Merge strategy: add missing songs, preserve IDs, avoid duplicates

**Builder Modal:**
- Search bar (filters unselected songs)
- Selected songs always at top
- Result count display
- Add/remove toggle per song

### 4. Song Library
**Song Data Model:**
```javascript
{
  id: string,           // UUID
  title: string,        // "Bet You Look Good on the Dance Floor"
  artist: string,       // "Arctic Monkeys"
  bpm: number,          // 204
  timeSignature: string, // "4/4"
  notes: string,        // Free-form notes
  tags: string[],       // ["indie", "fast"]
  midi: {
    program: number,    // Program change (0-127)
    cc: object         // Control changes {ccNumber: value}
  },
  lyrics: [
    {
      time: number,     // Seconds from start
      text: string      // Line of lyrics
    }
  ],
  createdAt: string,    // ISO timestamp
  updatedAt: string     // ISO timestamp
}
```

**Features:**
- Add/edit/delete songs
- Bulk import from example songs
- Lyrics with timestamps (LRC format)
- MIDI program/CC per song

### 5. MIDI Control (Progressive Enhancement)
**Detection:**
- Check Web MIDI API availability on load
- Graceful fallback message if unavailable
- iOS note: Limited support, recommend BLE MIDI

**Mappings:**
- Play/Pause
- Next/Previous song
- Tap Tempo
- BPM nudge ±1, ±5, ±10
- Per-device persistence

**Learn Mode:**
- "Press any MIDI control" interface
- Shows incoming MIDI messages
- Assign to action
- Test mapping

**Settings UI:**
- Enable/disable MIDI
- Connected device list
- Mapping editor
- Clear mappings

### 6. Data & Storage
**Primary Storage: IndexedDB (via Dexie)**
- Reliable, large capacity
- Versioned schema with migrations
- Tables: `songs`, `setlists`, `meta`

**Backup: localStorage**
- Small flags and preferences only
- Last view, display settings

**Import/Export:**
- Full data bundle: `{songs, setlists, prefs, version}`
- Partial import (merge)
- File upload or paste JSON
- Validation before import

**Versioning:**
- `appSchemaVersion` in meta table
- Migration scripts for each version
- Backup before migrations
- Rollback capability

### 7. PWA Features
**Installation:**
- Add to Home Screen prompts
- Standalone display mode
- Custom splash screen
- App icons (multiple sizes)

**Updates:**
- Service worker with Workbox
- `promptUpdate` mode (user confirms)
- Manual "Check for Updates" button
- Skip waiting on user action
- Version display in app

**Offline:**
- Full offline functionality
- Assets pre-cached
- Data stored locally
- No network required for core features

**Performance:**
- Fast load (<3s on 3G)
- Wake Lock API (prevent sleep during performance)
- Background audio (keep AudioContext alive)

### 8. Optional: Firebase Sync
**Toggle-gated feature:**
- Disabled by default
- Enable in settings

**Authentication:**
- Anonymous auth (device-specific)
- Optional email/password

**Sync Strategy:**
- Local-first writes (no blocking)
- Background sync every 5 minutes
- Manual "Sync Now" button
- Last-write-wins with timestamps
- Conflict viewer (show both versions, choose)

**Firestore Structure:**
```
users/{userId}/
  songs/{songId}
  setlists/{setlistId}
  prefs/settings
```

### 9. Accessibility
**Visual:**
- High contrast mode toggle
- Large text option
- Focus indicators on all controls
- ARIA labels and roles
- Semantic HTML

**Motor:**
- Large touch targets (min 44x44px)
- No precise gestures required
- Keyboard navigation support
- Long-press alternatives for critical actions

**Feedback:**
- Haptic/vibration on beat (toggle)
- Audio + visual redundancy
- Clear state indicators
- Confirmation for destructive actions

### 10. Settings
**Metronome:**
- Sound on/off
- Visual flash on/off
- Click volume
- Accent volume
- Click sound selection

**Display:**
- Show beat number
- High contrast mode
- Large text mode
- Stage mode (minimal UI)

**Behavior:**
- Long-press to stop
- Auto-start on song select
- Keep screen awake
- Haptic feedback

**Data:**
- Export all data
- Import data
- Clear all data (with confirmation)
- Sync toggle (if Firebase enabled)

## Platform-Specific Notes

### iOS Safari PWA
- User gesture required for AudioContext
- Limited Web MIDI (suggest BLE MIDI)
- Background audio constraints (show warning if suspended)
- Install via Share → Add to Home Screen

### Android Chrome PWA
- Full Web MIDI support
- Better background audio
- Install prompt automatic

### Desktop (All Browsers)
- Full feature support
- Keyboard shortcuts
- Window resizing handled
- Optional: Electron wrapper for native feel

## Testing Checklist
- [ ] Timing accuracy test (compare to hardware metronome)
- [ ] Offline functionality (airplane mode)
- [ ] Install as PWA on iOS
- [ ] Install as PWA on Android
- [ ] Lock screen behavior (keep running)
- [ ] Background tab behavior
- [ ] Import/export round-trip
- [ ] Migration from v1 → v2 schema
- [ ] MIDI mapping on supported device
- [ ] High contrast mode readability
- [ ] Touch target sizes (44x44px min)
- [ ] 3G load performance (<3s)

## Future Enhancements (Post-MVP)
- Multi-device sync via Firebase
- Collaborative set lists (share with band)
- Polyrhythm support (multiple subdivisions)
- Recording integration (click track export)
- Bluetooth metronome pedal support
- Integration with digital sheet music apps
- Analytics: most-played songs, tempo drift tracking
- Cloud backup to Google Drive/Dropbox

