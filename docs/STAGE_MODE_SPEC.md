# Stage Mode UX Specification

## Overview
Stage Mode is a performance-optimized view designed for live use during rehearsals and gigs. It prioritizes large, touch-friendly controls and quick song navigation with minimal accidental interactions.

## Design Principles
1. **Large Touch Targets**: All interactive elements sized for gloved hands or quick taps
2. **High Contrast**: Clear visual hierarchy with bold colors and sharp edges
3. **Minimal Clutter**: Hide non-essential controls; focus on tempo, song, and navigation
4. **One-Handed Operation**: Key actions accessible with thumb while holding device
5. **No Accidental Changes**: BPM adjustments require deliberate interaction (not scroll/swipe)

## Layout Structure

### Top Bar (Fixed)
```
┌─────────────────────────────────────────────────┐
│  🎵 Song Name               [⚙️ Settings]       │
│  Set 1 • Song 3/8                               │
└─────────────────────────────────────────────────┘
```
- **Song Name**: Current song, large text (20px+), truncate with ellipsis
- **Set Indicator**: "Set 1" / "Set 2" / "Additional" badge
- **Song Position**: "3/8" counter
- **Settings Button**: Top-right, opens stage mode options (volume, MIDI toggle, accent patterns)

### Central Control Area
```
┌─────────────────────────────────────────────────┐
│                                                 │
│             ┌───────────┐                       │
│             │           │                       │
│             │    140    │  ← BPM Display        │
│             │    BPM    │     (72px font)       │
│             │           │                       │
│             └───────────┘                       │
│                                                 │
│         ┌─────────────────┐                     │
│         │                 │                     │
│         │   TEMPO WHEEL   │  ← Large wheel      │
│         │    (400x400)    │     for adjustment  │
│         │                 │                     │
│         └─────────────────┘                     │
│                                                 │
│      [◀ PREV]  [▶️ PLAY]  [NEXT ▶]              │
│                                                 │
└─────────────────────────────────────────────────┘
```
- **BPM Display**: 72px bold font, centered above wheel
- **Tempo Wheel**: 400x400px minimum on mobile, drag or tap to adjust
- **Play/Pause**: 120x120px central button, green when playing, gray when paused
- **Prev/Next**: 100x60px buttons, disabled (50% opacity) at set boundaries

### Bottom Panel (Collapsible Set List)
```
┌─────────────────────────────────────────────────┐
│  ▼ SET LIST                    [Add Song] [⋯]  │
├─────────────────────────────────────────────────┤
│  1. Song A                     140 BPM   4/4    │ ← Current (highlight)
│  2. Song B                     120 BPM   3/4    │
│  3. Song C                     160 BPM   6/8    │
│  4. Song D                     130 BPM   4/4    │
├─────────────────────────────────────────────────┤
│  ▲ COLLAPSE                                     │
└─────────────────────────────────────────────────┘
```
- **Collapsible**: Tap header to expand/collapse, default collapsed in portrait
- **Current Song**: Bold, highlighted with cyan border/background
- **Song Row**: Tap to select, drag handle (left) to reorder
- **Quick Info**: BPM and time signature visible at a glance
- **Add Song**: Opens search modal to pull from main library
- **Menu (⋯)**: Edit set, switch to Set 2, export, etc.

## Interaction Patterns

### BPM Adjustment
1. **Drag Wheel**: Smooth rotation updates BPM in real-time without stopping playback
2. **Tap Wheel Edge**: Small increments (+1/-1 BPM per tap on edge markers)
3. **Tap Tempo**: Double-tap center button (when paused) to enter tap tempo mode
4. **No Scroll Hijacking**: Page scroll does NOT affect BPM (common mistake in mobile)

### Song Navigation
1. **Prev/Next Buttons**: Large, instant response, disable at boundaries
2. **Set List Tap**: Tap any song to jump directly (confirmation prompt if playing)
3. **Swipe Gestures** (optional future): Swipe left/right on wheel area to change songs
4. **Keyboard Shortcuts**: Arrow keys for prev/next (desktop/tablet with keyboard)

### Set List Management
1. **Drag to Reorder**: Long-press drag handle (left side), visual feedback (shadow, position indicator)
2. **Tap to Select**: Single tap highlights, double-tap opens song details
3. **Search to Add**: Search bar filters main song library, tap "+" to add to current set
4. **Remove**: Swipe left on song row reveals "Remove" button

### MIDI Preset Switching
1. **Automatic**: When song changes, send program change to Helix (if MIDI enabled and preset assigned)
2. **Manual Override**: Tap MIDI icon in top bar to manually select preset (dropdown)
3. **Fallback**: If no preset assigned, show toast: "No preset for this song"
4. **Status Indicator**: MIDI icon in top bar shows green (connected), yellow (no device), red (error)

## Responsive Behavior

### Portrait Mobile (< 768px)
- Set list collapsed by default
- Tempo wheel 320x320px
- Prev/Next buttons stack horizontally
- BPM display 60px font

### Landscape Mobile (768px - 1024px)
- Set list visible on right side (30% width)
- Tempo wheel 400x400px
- Controls in left 70%

### Tablet/Desktop (> 1024px)
- Set list always visible (25% width)
- Tempo wheel 500x500px
- Additional controls (tap tempo, accent editor) visible above wheel

## Accessibility

### Keyboard Navigation
- **Tab**: Cycle through play/pause, prev, next, set list items
- **Space**: Play/pause
- **Arrow Left/Right**: Prev/next song
- **Arrow Up/Down**: BPM +1/-1 (when wheel focused)
- **Enter**: Select focused song

### Screen Reader
- Announce current song, BPM, and time signature on change
- Label all buttons with aria-label
- Set list uses semantic list markup with role="listitem"

### Focus Indicators
- High-contrast focus outline (3px cyan border)
- Focus trap in modals (search, settings)

## Visual Theme

### Colors (Dark Mode)
- **Background**: `#0a0a0f` (near-black)
- **Surface**: `#1a1a2e` (dark blue-gray)
- **Primary (Cyan)**: `#00d9ff` (tempo wheel, current song, play button when active)
- **Secondary (Purple)**: `#a855f7` (accents, hover states)
- **Text Primary**: `#f0f0f5` (white-ish)
- **Text Secondary**: `#9090a0` (muted gray)
- **Border**: `#2a2a3e` (subtle)

### Typography
- **BPM Display**: 72px, bold, monospace
- **Song Name**: 24px, semibold, sans-serif
- **Set List Items**: 18px, regular
- **Buttons**: 16px, semibold, uppercase

### Shadows & Effects
- **Glass Morphism**: Background blur (10px), border (1px rgba(255,255,255,0.1)), subtle gradient
- **Button Hover**: Scale 1.05, glow shadow (0 0 20px rgba(0,217,255,0.5))
- **Active State**: Scale 0.95, inner shadow

## State Management

### URL Params (for deep linking)
- `/performance?mode=stage&set=1&song=3`
- Allows sharing direct link to specific song in stage mode

### Local Storage
- `stageMode.collapsed`: boolean (set list collapsed state)
- `stageMode.lastSet`: string (last active set ID)
- `stageMode.volume`: number (metronome volume 0-100)

### Context/Props
```typescript
interface StageModeProps {
  currentSong: Song | null
  setList: SetList
  songs: Song[]
  isPlaying: boolean
  bpm: number
  onBPMChange: (bpm: number) => void
  onPlayPause: () => void
  onPrevSong: () => void
  onNextSong: () => void
  onSelectSong: (songId: string) => void
  onReorderSong: (fromIndex: number, toIndex: number) => void
}
```

## Component Breakdown

```
StageView.jsx
├── StageHeader.jsx
│   ├── SongInfo (name, set, position)
│   └── SettingsButton
├── CentralControls.jsx
│   ├── BPMDisplay
│   ├── TempoWheel (reuse from LiveView)
│   └── PlaybackControls (prev, play/pause, next)
└── SetListPanel.jsx
    ├── SetListHeader (collapse toggle, add button)
    ├── SongList (draggable items)
    └── SongRow.jsx (name, bpm, time sig, drag handle)
```

## Future Enhancements
- [ ] Metronome visual flash (full-screen pulse on downbeat)
- [ ] Count-in before play (1, 2, 3, 4 visual countdown)
- [ ] Lyrics overlay (toggleable, auto-scroll with song position)
- [ ] Recording mode (capture performance audio with metronome)
- [ ] Setlist templates (save/load common set configurations)
- [ ] Multi-device sync (drummer changes tempo, other devices follow)

---

**Next Steps**: Implement `StageView.jsx` and integrate with existing `PerformanceView` toggle.

