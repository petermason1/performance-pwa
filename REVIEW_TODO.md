# Codebase Review & TODO List

**Review Date**: 2024-12-19  
**Project**: Performance PWA - Metronome & Live Performance App

## Executive Summary

The project is a well-structured React PWA for live music performance with metronome, set list management, MIDI integration, and band collaboration features. The codebase shows good organization with TypeScript/JavaScript, comprehensive documentation, and a solid foundation. However, several key features are partially implemented or pending completion.

**Overall Status**: ~60% Complete
- ✅ Core metronome functionality working
- ✅ Stage Mode UI implemented (basic)
- ✅ Supabase integration started (auth, sync manager exists)
- ⚠️ MIDI preset automation incomplete
- ⚠️ Some features need polish and testing
- ⚠️ Production deployment pending

---

## Completed Features ✅

### Core Functionality
- ✅ Live performance view with tempo wheel
- ✅ Smooth BPM changes without interrupting playback
- ✅ Beat accents with visual/audio feedback
- ✅ MIDI controller infrastructure (Helix + lighting)
- ✅ IndexedDB storage (songs, setlists)
- ✅ PWA support (service worker exists)
- ✅ Responsive mobile-first design
- ✅ Stage Mode view with lock mechanism
- ✅ Realtime session sync (metronome state)
- ✅ Preset system for accent patterns
- ✅ Export/Import with QR codes

### Infrastructure
- ✅ Supabase client setup (`lib/supabase.js`)
- ✅ SupabaseContext and auth provider
- ✅ SyncManager class for data sync
- ✅ LoginModal component
- ✅ Band management hooks (`useBand`)
- ✅ Realtime subscriptions infrastructure

---

## Critical Issues & Missing Features 🔴

### 1. Supabase Integration (Partially Complete)
**Status**: Infrastructure exists, needs verification and completion

**Issues**:
- Database schema migrations need to be verified as deployed
- RLS policies need testing with multiple users
- Band collaboration features need end-to-end testing
- Realtime sync needs verification across devices

**Tasks**:
- [ ] Verify all SQL migrations (001-011) are deployed to Supabase
- [ ] Test authentication flow (signup/login/logout)
- [ ] Test band creation and member invitation
- [ ] Verify realtime subscriptions work correctly
- [ ] Test sync with 2+ devices simultaneously

### 2. MIDI Preset Automation (Incomplete)
**Status**: Infrastructure exists, UI and auto-switching missing

**Issues**:
- `PresetSelector` exists but is for accent patterns, not MIDI presets
- No UI in SongModal for assigning Helix presets
- No automatic preset switching on song change
- No MIDI status indicator in views
- No manual override modal

**Tasks**:
- [ ] Create MIDI preset selector component (0-127 range)
- [ ] Add preset selector to SongModal
- [ ] Implement auto-switch logic in PerformanceView/StageModeView
- [ ] Build MIDI status indicator component
- [ ] Create MIDIControlModal for manual override
- [ ] Add preset name storage in preferences

### 3. Stage Mode Polish (Needs Work)
**Status**: Basic implementation exists, missing features from spec

**Issues**:
- Set list panel needs drag-and-drop refinement
- Song search/filter not implemented
- Some UX features from STAGE_MODE_SPEC.md missing
- Touch gesture handling could be improved

**Tasks**:
- [ ] Improve set list drag-and-drop (touch UX, visual feedback)
- [ ] Add song search bar to set list view
- [ ] Verify all features from STAGE_MODE_SPEC.md
- [ ] Test on actual mobile devices
- [ ] Add swipe gesture improvements

### 4. Testing & Quality (Gaps)
**Status**: Some tests exist, coverage incomplete

**Issues**:
- Test files exist but coverage is likely low
- No tests for metronome timing accuracy
- MIDI controller needs mocks for testing
- Integration tests for sync missing

**Tasks**:
- [ ] Add unit tests for `useMetronome` hook
- [ ] Add unit tests for `useTempoWheel` hook
- [ ] Create MIDI controller mocks
- [ ] Add integration tests for sync operations
- [ ] Test accent alignment accuracy
- [ ] Run test coverage report and improve

### 5. Code Quality (Minor Issues)
**Status**: Generally good, some cleanup needed

**Issues**:
- Console.log statements throughout codebase (11+ instances)
- Some error handling could be improved
- Accessibility audit incomplete

**Tasks**:
- [ ] Replace console.log with proper logging utility
- [ ] Improve error handling and user feedback
- [ ] Complete accessibility audit (ARIA, keyboard nav)
- [ ] Add error boundaries for React components

---

## High Priority TODO Items 🎯

### Phase 1: Complete Supabase Integration (Week 1)
1. **Verify Database Schema**
   - Run all migration files in Supabase dashboard
   - Test RLS policies with multiple users
   - Verify triggers and functions work

2. **Test Authentication**
   - Sign up new users
   - Login/logout flow
   - Session persistence
   - Password reset (if needed)

3. **Test Band Collaboration**
   - Create band
   - Invite members
   - Verify member permissions
   - Test data isolation between bands

4. **Test Data Sync**
   - Create song on Device 1
   - Verify appears on Device 2
   - Test offline mode (queue writes)
   - Test conflict resolution

### Phase 2: MIDI Preset Automation (Week 1-2)
1. **Build MIDI Preset Selector**
   - Create component for 0-127 preset selection
   - Add to SongModal
   - Store in song data (helixPresetNumber)

2. **Auto-Switch Implementation**
   - Add useEffect in PerformanceView
   - Add useEffect in StageModeView
   - Send program change when song changes
   - Handle MIDI unavailable gracefully

3. **MIDI Status & Control**
   - Build MIDIStatusIndicator component
   - Add to Stage Mode header
   - Create MIDIControlModal
   - Add manual override button

### Phase 3: Polish & Testing (Week 2-3)
1. **Stage Mode Improvements**
   - Refine drag-and-drop
   - Add song search
   - Test on mobile devices
   - Improve touch gestures

2. **Accessibility**
   - Complete ARIA audit
   - Test with screen readers
   - Verify keyboard navigation
   - Add keyboard shortcuts modal

3. **Testing**
   - Increase test coverage to 80%+
   - Add integration tests
   - Test metronome timing accuracy
   - Performance profiling

### Phase 4: Deployment (Week 3-4)
1. **Production Readiness**
   - Enable service worker for production
   - Configure Vercel deployment
   - Set environment variables
   - Test production build

2. **Device Testing**
   - iOS Safari
   - Android Chrome
   - Desktop browsers
   - Test PWA installation

3. **Documentation**
   - Update README with current status
   - Add deployment guide
   - Document environment setup

---

## Medium Priority TODO Items 📋

### Features
- [ ] Genre tagging system (UI + filtering)
- [ ] Song search/filter in set list view
- [ ] Custom preset names (store in preferences)
- [ ] Timeline-based lighting editor (future)
- [ ] Improved conflict resolution UI
- [ ] Offline write queue status indicator

### Code Quality
- [ ] Remove/replace console.log statements
- [ ] Add error boundaries
- [ ] Improve error messages (user-friendly)
- [ ] Add retry logic for failed syncs
- [ ] Performance optimization (bundle size, render times)

### Documentation
- [ ] Update README with completed features
- [ ] Add API documentation
- [ ] Create user guide
- [ ] Document keyboard shortcuts
- [ ] Add troubleshooting guide

---

## Low Priority / Future Enhancements 🔮

- [ ] MIDI learn feature (capture preset from Helix)
- [ ] Multi-device MIDI support
- [ ] Preset templates
- [ ] Advanced lighting timeline
- [ ] Recording mode
- [ ] Lyrics auto-scroll
- [ ] Set list templates
- [ ] Analytics/usage tracking

---

## Known Issues & Technical Debt

### Issues
1. **Service Worker**: Disabled in dev, needs production testing
2. **Console Logs**: 11+ instances need cleanup
3. **Error Handling**: Some areas lack user-friendly error messages
4. **Accessibility**: Incomplete audit, some views need ARIA improvements
5. **Test Coverage**: Likely below 50%, needs improvement

### Technical Debt
1. **State Management**: Some components have scattered state
2. **TypeScript**: Mix of .ts and .js files, should migrate to TypeScript
3. **Component Size**: Some components could be split (StageModeView is 628 lines)
4. **Code Duplication**: Some logic repeated across views

---

## Testing Checklist

### Manual Testing Needed
- [ ] Sign up new user
- [ ] Create band and invite members
- [ ] Create song and verify sync
- [ ] Test realtime updates (2 devices)
- [ ] Test offline mode
- [ ] Test MIDI preset switching (with Helix)
- [ ] Test stage mode on mobile
- [ ] Test drag-and-drop set lists
- [ ] Test PWA installation
- [ ] Test service worker updates

### Automated Testing Needed
- [ ] Unit tests for hooks
- [ ] Integration tests for sync
- [ ] MIDI controller mocks
- [ ] Accessibility tests (axe-core)
- [ ] E2E tests for critical flows

---

## Deployment Checklist

### Pre-Deployment
- [ ] All migrations deployed to Supabase
- [ ] Environment variables configured
- [ ] Service worker enabled for production
- [ ] Build succeeds without errors
- [ ] No console errors in production build
- [ ] Test coverage acceptable

### Deployment
- [ ] Vercel project connected
- [ ] Environment variables set in Vercel
- [ ] Production build deployed
- [ ] Production URL tested
- [ ] PWA manifest verified
- [ ] Service worker working

### Post-Deployment
- [ ] Test on production URL
- [ ] Verify authentication works
- [ ] Test sync across devices
- [ ] Monitor error logs
- [ ] Gather user feedback

---

## Recommendations

### Immediate Actions (This Week)
1. **Verify Supabase Setup**: Test authentication and sync end-to-end
2. **Complete MIDI Preset UI**: Add selector to SongModal
3. **Implement Auto-Switch**: Add logic to send presets on song change
4. **Clean Console Logs**: Replace with proper logging

### Short Term (Next 2 Weeks)
1. **Polish Stage Mode**: Improve drag-and-drop, add search
2. **Increase Test Coverage**: Add critical unit and integration tests
3. **Accessibility Audit**: Complete ARIA review
4. **Deploy to Vercel**: Get production URL for testing

### Long Term (Next Month)
1. **Performance Optimization**: Profile and optimize
2. **Advanced Features**: Timeline editor, preset names
3. **Documentation**: User guides and API docs
4. **Beta Testing**: Invite bandmates for feedback

---

## File Organization Notes

### Well Organized ✅
- Clear separation of concerns (components, hooks, utils)
- Good documentation structure
- Test files co-located with source
- TypeScript types defined

### Could Improve ⚠️
- Some large components (StageModeView: 628 lines)
- Mix of .ts and .js files
- Some state management could be centralized
- Console logs scattered throughout

---

## Summary Statistics

- **Total TODO Items**: 26
- **Critical**: 5
- **High Priority**: 12
- **Medium Priority**: 6
- **Low Priority**: 3

**Estimated Completion Time**: 3-4 weeks for critical + high priority items

---

**Last Updated**: 2024-12-19  
**Next Review**: After completing Phase 1 (Supabase verification)


