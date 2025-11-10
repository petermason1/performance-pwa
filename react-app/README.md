# Metronome Suite - Live Performance Control

A Progressive Web App (PWA) for live music performance, featuring:

- 🎵 **Metronome** with visual beat flash, accent patterns, and polyrhythms
- 📋 **Set Lists** for organizing songs and managing live performances
- 🎸 **Stage Mode** with lock mechanism to prevent accidental changes
- 🔴 **Real-time Sync** to sync metronome across multiple devices (bandmates)
- 🎚️ **MIDI Control** for Helix presets and lighting
- 💾 **Preset System** for saving/loading metronome configurations
- 📤 **Export/Import** with QR codes for easy sharing

## Features

### Metronome Settings
- Manual BPM, time signature, and accent pattern controls
- Built-in presets: Rock Backbeat, Waltz, Latin Groove, Jazz Swing, etc.
- Custom accent patterns and polyrhythms
- Visual beat preview
- Audio click track with customizable volumes

### Stage Mode
- Simplified UI for live performance
- "Go Live" lock to prevent accidental changes (long-press to unlock)
- Large, high-contrast controls
- Previous/current/next song display
- Beat visualization and audio toggle

### Real-time Session Sync
- Host a session and broadcast metronome state to bandmates
- Clients join via session ID
- Real-time sync of BPM, playing state, and song changes
- Track connected bandmates via Supabase Presence

### Export & Import
- Export all songs, set lists, and presets as JSON
- QR code generation for easy sharing
- Import from file or paste JSON
- Merge or replace data

## Tech Stack

- **React 19** with hooks
- **Vite** for fast development and build
- **Dexie.js** for IndexedDB local storage
- **Supabase** for authentication and realtime sync
- **Tailwind CSS** for styling
- **Vitest** for testing
- **PWA** with service worker for offline support

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Project Structure

```
src/
├── components/       # React components
│   ├── Auth/        # Login/signup
│   ├── Band/        # Band collaboration
│   ├── layout/      # Header, footer, navigation
│   ├── Metronome/   # BeatPreview, etc.
│   ├── Performance/ # Performance view components
│   └── *.jsx        # Modals and utilities
├── context/         # React context providers
├── hooks/           # Custom React hooks
├── lib/             # External libraries (Supabase, syncManager)
├── utils/           # Utility functions
├── views/           # Top-level view components
└── main.jsx         # App entry point
```

## Documentation

- **ARCHITECTURE.md** - Technical architecture and development guide
- **IMPLEMENTATION_PLAN.md** - Feature planning and roadmap
- **PRODUCT_SPEC.md** - Product requirements and specifications
