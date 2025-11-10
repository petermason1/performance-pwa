# Performance PWA - Architecture & Development Guide

## Project Overview

The Performance PWA is designed for live music performance and show control, integrating:
- **Set Lists**: Song organization and sequencing
- **Songs**: Tempo, time signatures, lyrics, MIDI presets
- **MIDI Device Control**: Helix presets, lighting control
- **Future Features**: Timeline-based programming, advanced show control

## Current State Assessment

### ✅ Implemented Modules

#### UI Navigation
- Set Lists view (create, edit, reorder)
- Songs view (library management)
- MIDI/Lights Control view (device selection, testing)
- Performance view (live metronome, beat visualization)

#### Device Control
- MIDI device dropdown selectors
- Helix preset selection
- Lighting output configuration
- Placeholder/test functionality for lighting control
- Note testing interface
- Timeline editor (placeholder)

#### Accessibility (Recent Improvements)
- ARIA labels on Performance view controls
- Screen reader announcements for tempo/song changes
- Keyboard shortcuts hook (`useKeyboardShortcuts`)
- Enhanced beat visualization with measure progress
- Improved empty states with actionable guidance

### ⚠️ Areas Needing Attention

#### Accessibility Gaps
- MIDI/Lights Control view needs full ARIA review
- Timeline editor accessibility (when implemented)
- Interactive testing interfaces need keyboard navigation
- Complete keyboard shortcut integration across all views

#### Empty States
- "Functionality to be implemented" messages need replacement
- Missing onboarding flows for new features
- Need demo data or sample presets

#### Code Organization
- Some components are tightly coupled
- State management scattered across components
- Need reusable UI components (dropdowns, control panels)

## Priority Roadmap

### Priority 1: UI Feedback & Accessibility ✅ (In Progress)

**Status**: Partially complete - Performance view done, other views pending

**Tasks**:
- [x] Enhanced beat visualization with measure progress
- [x] ARIA labels and screen reader support (Performance view)
- [ ] Real-time visual/audio feedback for MIDI/light actions
- [ ] Complete ARIA audit across ALL views
- [ ] Keyboard navigation for all interactive modules
- [ ] Accessibility testing with screen readers

### Priority 2: Onboarding & Messaging ✅ (In Progress)

**Status**: Partially complete - Empty states improved, example set lists added

**Tasks**:
- [x] Improved empty state messages with guidance
- [x] Example set lists for quick start
- [ ] Replace "functionality to be implemented" placeholders
- [ ] Demo data for MIDI/Lights view
- [ ] Sample presets for lighting/MIDI configurations
- [ ] Contextual help tooltips

### Priority 3: Customization (Presets System)

**Status**: Not started - Architecture needed

**Requirements**:
- **Global Presets**: Reusable across songs (e.g., "Jazz Setup", "Rock Show")
- **Per-Song Presets**: Song-specific configurations
- **Preset Types**: Accent/Polyrhythm patterns, MIDI/Helix configs, Lighting sequences, Metronome settings

**Implementation Tasks**:
- [ ] Create preset storage system (IndexedDB + Supabase)
- [ ] Build preset manager UI component
- [ ] Add "Save as Preset" buttons
- [ ] Add "Load Preset" dropdowns
- [ ] Sync presets with Supabase for band collaboration

### Priority 4: Keyboard Shortcuts

**Status**: Hook created, needs full integration

**Tasks**:
- [ ] Complete integration in PerformanceView
- [ ] Add shortcuts to MIDI/Lights view
- [ ] Create KeyboardShortcutsModal component
- [ ] Add shortcut hints in UI (tooltips, help overlay)
- [ ] Make shortcuts discoverable (`?` key to show help)

### Priority 5: Light Programming Timeline

**Status**: Placeholder exists, needs architecture

**Requirements**:
- Timeline-based editor for lighting sequences
- Drag-and-drop event blocks
- Timeline syncing with metronome
- Save/load to presets
- Real-time preview

**Implementation Tasks**:
- [ ] Design timeline data structure
- [ ] Build drag-and-drop canvas
- [ ] Create event block components
- [ ] Implement playback engine
- [ ] Sync with metronome
- [ ] Add preset save/load

### Priority 6: Code Quality & Refactoring

**Status**: Ongoing - Refactor as features expand

**Refactoring Tasks**:
- [ ] Extract reusable components (ToggleButton, Dropdown, EmptyState)
- [ ] Create PerformanceContext for global state
- [ ] Add strict TypeScript types
- [ ] Comprehensive testing (unit/integration/E2E)

## Technical Architecture

### Component Structure

```
src/
├── components/
│   ├── common/              # Reusable components
│   ├── Performance/         # Performance view components
│   ├── MIDI/                # MIDI/Lights view components
│   └── Timeline/            # Timeline editor components
├── context/
│   ├── AppContext.jsx       # Global app state
│   ├── PerformanceContext.jsx  # Performance state
│   └── DeviceContext.jsx    # MIDI/Lighting state
├── hooks/
│   ├── useKeyboardShortcuts.js
│   ├── useMetronome.ts
│   ├── usePresets.ts        # Future
│   └── useTimeline.ts       # Future
└── utils/
    ├── accessibility.js
    ├── presets.ts           # Future
    └── timeline.ts          # Future
```

### State Management Strategy

**Current**: Props drilling, local state, localStorage

**Target**: Context providers + hooks pattern

### Preset System Architecture

**Storage**: IndexedDB (local) + Supabase (sync)

**Types**: Accent patterns, Polyrhythms, MIDI configs, Lighting sequences

**Scope**: Global (reusable) or Per-Song (specific)

### Timeline System Architecture

**Components**: TimelineEditor, TimelineCanvas, EventBlock, Playhead

**Engine**: TimelineEngine for playback, EventScheduler for timing

**Sync**: Metronome BPM sync, real-time position updates

## Implementation Patterns

### Reusable Component Pattern
- Standardize props interfaces
- Consistent styling and behavior
- Full accessibility support

### Context Provider Pattern
- Centralized state management
- Type-safe hooks for consumption
- Clear separation of concerns

### Preset System Pattern
- Save to IndexedDB + Supabase
- Match and apply logic
- Version compatibility

## Accessibility Guidelines

### ARIA Best Practices
1. Labels for all interactive elements
2. Semantic HTML first, ARIA when needed
3. Live regions for dynamic updates
4. Keyboard navigation everywhere
5. Focus management in modals/dropdowns

### Keyboard Navigation
- Tab: Navigate between elements
- Enter/Space: Activate controls
- Arrow Keys: Lists, sliders, timelines
- Escape: Close modals
- Shortcuts: Documented and discoverable

## Testing Strategy

- Unit Tests: Logic, parsing, validation
- Integration Tests: Flows, sync, execution
- E2E Tests: Complete user journeys
- Accessibility Tests: axe-core, keyboard, screen readers

## Documentation Requirements

- Code: JSDoc, TypeScript types, module READMEs
- User: Getting started, shortcuts, guides
- Architecture: This document, API docs, diagrams

---

**Last Updated**: 2024-12-19
**Next Review**: After Priority 3 (Presets) implementation
