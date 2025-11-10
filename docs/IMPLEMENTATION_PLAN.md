# Implementation Plan - Next Steps

## Documentation Complete ✅

All planning documents have been created:

1. **README.md** - Project overview, tech stack, getting started guide
2. **STAGE_MODE_SPEC.md** - Detailed UX requirements for stage/live performance mode
3. **SUPABASE_SCHEMA.md** - Complete database schema with RLS policies
4. **SUPABASE_CLIENT_INTEGRATION.md** - Auth and sync strategy
5. **MIDI_PRESET_WORKFLOW.md** - Helix preset automation workflow
6. **VERCEL_DEPLOYMENT.md** - Deployment guide and checklist

## Current State

### ✅ Working Features
- Live performance view with tempo wheel
- Smooth BPM changes without interrupting playback
- Beat accents with visual/audio feedback
- MIDI controller (Helix + lighting)
- IndexedDB storage (songs, setlists)
- PWA support (service worker disabled in dev)
- Responsive mobile-first design

### 🔧 Pending Implementation
- Stage mode UI
- Supabase integration (auth, sync, realtime)
- Multi-user band collaboration
- MIDI preset auto-switching per song
- Drag-and-drop set list management
- Genre tagging and search

## Implementation Sequence

### Phase 1: Supabase Foundation (Week 1)
**Goal**: Get auth working, create band structure

**Tasks**:
1. Install `@supabase/supabase-js`
2. Create Supabase project (separate from SmartRaceCards)
3. Run SQL migrations (schema from SUPABASE_SCHEMA.md)
4. Create `/react-app/src/lib/supabase.js`
5. Build `SupabaseContext` and provider
6. Add `SupabaseProvider` to `main.jsx`
7. Create `LoginModal` component
8. Test signup/login with 3 accounts

**Success Criteria**:
- Users can sign up and log in
- Session persists across page reloads
- 3 test accounts created (drums, bass, guitar)

---

### Phase 2: Band & Data Sync (Week 2)
**Goal**: Link users to bands, sync songs/setlists

**Tasks**:
1. Create `useBand` hook
2. Build band creation/join UI
3. Create `SyncManager` class
4. Update `useSongs` to sync with Supabase
5. Migrate existing IndexedDB data to Supabase
6. Test sync with 2 devices (laptop + phone)
7. Add sync status indicator

**Success Criteria**:
- 3 bandmates linked to 1 band
- Songs sync across devices
- Offline mode works (read-only)
- Changes sync when back online

---

### Phase 3: Stage Mode UI (Week 2-3)
**Goal**: Build large-control performance view

**Tasks**:
1. Create `StageView.jsx` component
2. Build `SetListPanel` with drag-and-drop
3. Add song search/filter
4. Integrate with existing `TempoWheel`
5. Test on mobile (touch gestures)
6. Add mode toggle (Setup ↔ Stage)

**Success Criteria**:
- Stage mode renders correctly
- Large controls work on touch devices
- Set list is visible and navigable
- Mode toggle works without losing state

---

### Phase 4: MIDI Preset Automation (Week 3)
**Goal**: Helix presets switch automatically per song

**Tasks**:
1. Add `helixPreset` field to song schema (already in Supabase)
2. Build `PresetSelector` component
3. Update `SongModal` to include preset selector
4. Add auto-switch logic in `PerformanceView`
5. Build `MIDIControlModal` for manual override
6. Add MIDI status indicator
7. Test with connected Helix

**Success Criteria**:
- Preset assigned to song
- Preset switches when song changes
- Manual override works
- Graceful fallback when MIDI unavailable

---

### Phase 5: Realtime Updates (Week 4)
**Goal**: Live sync during rehearsals

**Tasks**:
1. Enable realtime in Supabase for `songs`, `setlists`, `setlist_songs`
2. Add realtime subscriptions in `SyncManager`
3. Update UI when remote changes detected
4. Test with 3 devices simultaneously
5. Verify conflict resolution (last-write-wins)

**Success Criteria**:
- Drummer changes BPM → other devices update instantly
- Set list reorder propagates to all devices
- No race conditions or duplicate entries

---

### Phase 6: Polish & Testing (Week 4-5)
**Goal**: Production-ready quality

**Tasks**:
1. Write unit tests for `useMetronome`, `useTempoWheel`
2. Add integration tests for accent alignment
3. Accessibility audit (keyboard nav, screen readers)
4. Performance profiling (audio latency, render times)
5. Fix any remaining linter errors
6. Update PWA manifest (icons, colors)
7. Test on multiple devices (iOS, Android, desktop)

**Success Criteria**:
- 80%+ test coverage for hooks/utils
- No accessibility violations
- Lighthouse score 90+
- Works on iOS Safari, Chrome, Firefox

---

### Phase 7: Deployment (Week 5)
**Goal**: Live on Vercel with bandmates testing

**Tasks**:
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy to production
5. Invite bandmates (bass, guitar)
6. Monitor logs for errors
7. Gather feedback

**Success Criteria**:
- Production URL live
- 3 bandmates can log in
- Rehearsal test successful (live sync works)
- No critical bugs reported

---

## Dependencies & Blockers

### Prerequisites
- Supabase project created (do this first)
- Helix available for testing (optional, can mock)
- GitHub repo set up
- Vercel account

### Potential Blockers
1. **Supabase free tier limits**: 500 MB DB, 50k MAU
   - **Mitigation**: Monitor usage, upgrade to Pro if needed ($25/mo)
2. **MIDI browser support**: Not all browsers support Web MIDI API
   - **Mitigation**: Graceful fallback, document supported browsers
3. **Network latency**: Realtime sync may have delays on slow connections
   - **Mitigation**: Show sync status, queue writes for later
4. **Audio timing**: Web Audio API can drift on some devices
   - **Mitigation**: Use high-precision scheduling, test on target devices

## Questions for User

Before starting implementation:

1. **Supabase Project**: Should I guide you through creating the Supabase project, or will you do that separately?
2. **Test Data**: Do you want me to create example songs/setlists for testing, or use your existing data?
3. **Band Name**: What should the test band be called? (e.g., "The Rockers")
4. **Priority**: Which phase is most urgent? (Auth, Stage Mode, MIDI, or Sync?)
5. **Helix Available**: Do you have a Helix connected for testing MIDI presets?

## Current TODO Status

**Completed** (Planning Phase):
- [x] Gather stack information
- [x] Create README with tech stack and roadmap
- [x] Design stage mode UX
- [x] Design Supabase schema (users, bands, songs, setlists, RLS)
- [x] Outline client integration strategy
- [x] Detail MIDI preset workflow
- [x] Document Vercel deployment process

**Pending** (Implementation Phase):
- [ ] Install @supabase/supabase-js
- [ ] Create SupabaseContext and auth provider
- [ ] Build login/signup UI
- [ ] Write Supabase SQL migrations
- [ ] Build stage mode UI
- [ ] Integrate MIDI preset switching
- [ ] Deploy to Vercel

## Next Immediate Steps

1. **You decide**: Which phase should I start with?
2. **Supabase Setup**: Create project, get URL and anon key
3. **Install Dependencies**: `npm install @supabase/supabase-js`
4. **Environment File**: Create `.env` with Supabase credentials
5. **Begin Coding**: Start with Phase 1 (auth) or Phase 3 (stage mode)

Let me know which direction you want to go, and I'll start implementing!

