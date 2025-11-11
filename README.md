# Metronome Performance App

A professional metronome and performance management application built for live musicians. Features real-time tempo control, set list management, MIDI integration for Helix preset switching, and collaborative band features.

## 🎯 Project Overview

This app provides a comprehensive performance tool for bands, with a focus on:
- **Live Performance Mode**: Large, touch-friendly tempo wheel with smooth BPM adjustments
- **Set List Management**: Organize songs into multiple set lists with drag-and-drop
- **MIDI Integration**: Automatic Helix preset changes per song, MIDI lighting control
- **Band Collaboration**: Share songs and set lists with bandmates in real-time
- **Offline-First**: Works without internet; syncs when connected

<!-- Trigger rebuild -->

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19.1 with hooks and functional components
- **Build Tool**: Vite 7.1 (fast HMR, ES modules)
- **Language**: TypeScript (strict mode) + JavaScript
- **Styling**: Tailwind CSS 4.0 with custom glass-morphism theme
- **State Management**: React Context API + custom hooks

### Audio & MIDI
- **Audio**: Web Audio API for metronome timing and sound generation
- **MIDI**: Web MIDI API for Helix control and lighting
- **Timing**: High-precision beat scheduling with lookahead

### Data & Storage
- **Local Storage**: IndexedDB via Dexie 4.2 for offline data
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Sync Strategy**: Offline-first with write queue and realtime subscriptions

### Testing & Quality
- **Test Framework**: Vitest 4.0 with React Testing Library
- **Test Environment**: jsdom for DOM simulation
- **Linting**: ESLint 9 with React hooks plugin
- **Coverage**: Built-in vitest coverage reporting

### Deployment
- **Hosting**: Vercel (production builds)
- **PWA**: Progressive Web App with service worker (vite-plugin-pwa)
- **Build**: Static assets, optimized for CDN delivery

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern browser with Web Audio API and Web MIDI API support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd "Metronome App/react-app"

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in `/react-app`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📜 Available Scripts

```bash
npm run dev          # Start Vite dev server (HMR enabled)
npm run build        # Production build to /dist
npm run preview      # Preview production build locally
npm run lint         # Run ESLint checks
npm run test         # Run unit tests with Vitest
npm run test:ui      # Open Vitest UI
npm run test:coverage # Generate test coverage report
```

## 📁 Project Layout

```
react-app/
├── src/
│   ├── components/
│   │   ├── layout/              # AppHeader, MainNav, AppFooter
│   │   ├── Performance/         # Live view components (TempoWheel, ControlStrip, etc.)
│   │   ├── ExportImportModal.jsx
│   │   ├── MIDISettings.jsx
│   │   ├── PWAUpdatePrompt.jsx
│   │   ├── SetListModal.jsx
│   │   └── SongModal.jsx
│   ├── views/
│   │   ├── PerformanceView.jsx  # Main metronome + setup view
│   │   ├── SetListsView.jsx     # Set list creator/manager
│   │   ├── SongsView.jsx        # Song library
│   │   └── MIDILightsView.jsx   # MIDI lighting control
│   ├── hooks/
│   │   ├── useMetronome.ts      # Metronome state and controls
│   │   ├── useTempoWheel.ts     # Tempo wheel drag/touch logic
│   │   ├── useMIDI.js           # MIDI controller hooks
│   │   └── useApp.js            # Global app context hooks
│   ├── utils/
│   │   ├── db.js                # IndexedDB setup (Dexie)
│   │   ├── migrations.js        # Data migration helpers
│   │   ├── audio.js             # Audio helpers
│   │   ├── accessibility.js     # A11y utilities
│   │   └── getTempoMarking.js   # Tempo name (Andante, Allegro, etc.)
│   ├── metronome.ts             # Metronome class (Web Audio API)
│   ├── midi.ts                  # MIDIController class (Web MIDI API)
│   ├── models.ts                # TypeScript interfaces (Song, SetList, etc.)
│   ├── App.jsx                  # Main app shell
│   ├── AppContext.jsx           # Global context provider
│   └── main.jsx                 # React entry point
├── public/                      # Static assets (icons, manifest)
├── vite.config.js               # Vite + PWA configuration
├── tsconfig.json                # TypeScript config (strict mode)
├── eslint.config.js             # ESLint rules
└── package.json
```

## ✅ Current Status

### ✔ Working Features
- **Live Performance View**: Glass-morphism UI with large tempo wheel, BPM display, time signature toggle
- **Smooth Tempo Changes**: Wheel adjustments don't interrupt playback; BPM updates take effect on next beat
- **Beat Accents**: Per-beat accent patterns with visual and audio feedback
- **MIDI Controller**: Send program changes to Helix, control lighting via MIDI notes
- **IndexedDB Storage**: Songs and set lists persist locally with migration support
- **PWA Support**: Install as standalone app, offline-capable (service worker disabled in dev)
- **Responsive Design**: Mobile-first layout with desktop enhancements
- **320px Layout Ready**: Components clamp and center automatically for legacy iPhones and compact Android devices

### 🔧 Known Issues
- Stage mode UI not yet implemented (large controls for live performance)
- Supabase integration pending (auth, band collaboration, realtime sync)
- Set list drag-and-drop needs refinement
- No automated tests for metronome timing accuracy yet
- MIDI preset mapping per song is manual (no UI for assignment)

## 🗺 Roadmap

### Phase 1: Documentation & Planning (Current)
- [x] Document tech stack and architecture
- [x] Define metronome/wheel behavior requirements
- [ ] Design stage mode UX (large controls, set list visibility)
- [ ] Plan Supabase schema (users, bands, songs, setlists, genres)
- [ ] Outline client integration strategy (auth, sync, offline cache)

### Phase 2: Backend Integration
- [ ] Set up Supabase project (separate from SmartRaceCards)
- [ ] Create database schema with RLS policies for 3 bandmates (drums, bass/vox, guitar/vox)
- [ ] Install @supabase/supabase-js and configure environment
- [ ] Build SupabaseContext and auth provider
- [ ] Implement login/signup UI
- [ ] Add band membership/linking system
- [ ] Migrate IndexedDB data to Supabase with offline cache
- [ ] Set up realtime subscriptions for live updates

### Phase 3: Set List & Song Features
- [ ] Multiple set lists with drag-and-drop reordering
- [ ] Song search bar to add from main library
- [ ] Genre tagging and filtering
- [ ] Set 1 / Set 2 / Additional Songs sections
- [ ] MIDI preset mapping UI (assign Helix programs per song)
- [ ] Automatic preset switching on song change

### Phase 4: Stage Mode & Performance UX
- [ ] Build stage mode view (large controls, high contrast)
- [ ] Set list panel with current song highlight
- [ ] Quick song navigation (prev/next with swipe gestures)
- [ ] Tap tempo with visual feedback
- [ ] BPM adjustment overlay (no accidental changes)

### Phase 5: Testing & Quality
- [ ] Unit tests for hooks (useMetronome, useTempoWheel)
- [ ] Integration tests for accent alignment
- [ ] MIDI controller mocks for testing
- [ ] Accessibility audit (keyboard nav, screen readers)
- [ ] Performance profiling (audio latency, render times)

### Phase 6: Deployment & Collaboration
- [ ] Configure Vercel deployment with Supabase env vars
- [ ] Set up CI/CD pipeline
- [ ] Enable service worker for production builds
- [ ] Invite bandmates for beta testing
- [ ] Gather feedback and iterate

## 💡 Why Vite @ localhost:5173 (vs Next.js)?

- **Faster feedback**: Vite's native ES modules + HMR provide near-instant rebuilds—critical for audio timing tweaks and UI iteration
- **Lower overhead**: Single-page app suits this control-heavy interface; no SSR/ISR complexity needed
- **Web Audio/MIDI focus**: Minimal bundle size and predictable build output simplifies browser API integration
- **Deployment flexibility**: Static assets deploy anywhere (Vercel, Netlify, S3 + CloudFront)
- Next.js would add routing/SSR features we don't need; React + Vite delivers the SPA behavior we require

## 🎵 Metronome & Wheel Behavior Spec

### Continuous Playback
- Tempo wheel adjustments must NOT interrupt audio
- BPM changes apply smoothly to the next scheduled beat
- No audible glitches or timing drift during drag

### Accurate Beat Display
- UI beat counter stays aligned with the downbeat (1-based indexing)
- Accent highlighting matches measure accents exactly
- Time signature changes reset the measure cleanly

### Responsive Interaction
- Wheel handles drag and touch without jitter
- Play button clicks within wheel don't trigger drag events
- Tap tempo syncs immediately on 3rd tap

### Visual Feedback
- Wheel rotation speed mirrors BPM
- Play/pause states update instantly
- Accent flash remains synchronized with audio

### Safety Guards
- Enforce BPM limits (40–300)
- Debounce tap tempo to prevent double-taps
- Validate time signature before applying

## 🤝 Contributing

### Code Style
- Use TypeScript for new files with strict mode enabled
- Follow existing component structure (small, reusable components)
- Write tests for new hooks and utilities
- Run `npm run lint` before committing

### Component Guidelines
- Prefer functional components with hooks
- Extract reusable logic into custom hooks
- Keep components under 300 lines; split if larger
- Use Tailwind classes; avoid inline styles unless dynamic

### Testing
- Add unit tests for any hook or utility function
- Use React Testing Library for component tests
- Mock MIDI/Audio APIs in tests (don't rely on browser support)

## 🎸 Band Collaboration Features

### Multi-User Support
- Each bandmate has their own account (Supabase Auth)
- Accounts link to a shared band entity
- Row-level security ensures only band members see shared data

### Real-Time Sync
- Song edits propagate to all connected devices instantly
- Set list changes update live during rehearsal
- Conflict resolution: last-write-wins for simplicity

### Offline Mode
- Read-only access when offline (no writes to Supabase)
- Write queue stores changes locally; syncs when online
- Visual indicator shows sync status

### MIDI Preset Workflow
- Assign Helix preset number per song (stored in Supabase)
- Automatically send program change when song becomes active
- Fallback: manual preset selection if MIDI unavailable

## 📄 License

(Add license details if applicable)

---

**Built with ❤️ for live musicians**
