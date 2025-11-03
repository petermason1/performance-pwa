# MIDI Setup & Implementation Guide

## Overview

This document outlines the MIDI functionality plan for the Performance PWA, including equipment requirements, implementation strategy, and how to make it work with your lighting system.

## Current Status

The MIDI Lights view has been created with UI elements for:
- Device selection (default, Helix-specific, Lights-specific outputs)
- MIDI note reference grid
- Test buttons
- Connection guides

**Functionality is not yet implemented** - the UI is in place but needs to be connected to the MIDI controller logic.

## Equipment Requirements

### What You Need to Know About Your Lights

**Yes, we need to know the make/model of your lights** to properly implement MIDI control. Here's why:

1. **MIDI Protocol Support**: Different lighting systems use different MIDI implementations:
   - Some use standard MIDI notes (0-127) mapped to specific scenes/cues
   - Some use MIDI CC (Control Change) messages instead of notes
   - Some require specific MIDI channels
   - Some have custom MIDI implementations

2. **Equipment Requirements**:
   - **If your lights accept MIDI directly**: You may only need a USB-to-MIDI interface
   - **If your lights need a controller**: You might need a dedicated lighting control unit that accepts MIDI triggers

### What You Might Need to Buy

#### Option 1: If Your Lights Accept MIDI Directly

If your lighting system (e.g., some DMX controllers, MIDI-controlled lights) accepts MIDI directly:
- **USB MIDI Interface** (e.g., M-Audio USB Uno, Roland UM-ONE, iConnectivity mio)
- **5-pin MIDI cable** (if lights use 5-pin DIN)
- **MIDI-to-USB adapter** if using computer/tablet

#### Option 2: If Your Lights Need a Controller

If your lights require a lighting controller:
- **Lighting Control System** that accepts MIDI triggers:
  - DMX controllers with MIDI input (e.g., some Chauvet, Elation controllers)
  - Software-based lighting systems (QLC+, Lightkey) that accept MIDI
  - Standalone MIDI-to-DMX converters
- **USB MIDI Interface** (to connect computer/tablet to controller)

#### Option 3: All-in-One Solution

**MIDI-capable USB Audio Interface**:
- Some USB audio interfaces (Focusrite Scarlett, PreSonus AudioBox) support both:
  - Audio output for metronome
  - MIDI I/O for Helix and lights
- This is often the cleanest solution for live performance

## How MIDI Will Work

### 1. Helix Line 6 Integration (Partially Implemented)

**Current Status**: Basic MIDI infrastructure exists, preset changes can be sent.

**How It Works**:
- When a song loads, if it has a `helixPresetNumber` (0-127), the app sends a MIDI Program Change message
- Separate MIDI output can be selected specifically for Helix
- Messages sent via `midiController.sendProgramChange(programNumber, channel, useHelixOutput)`

**What's Needed**:
- ✅ MIDI output selection (UI ready)
- ✅ Program Change sending (implemented in `midi.js`)
- ⚠️ Error handling and user feedback (needs improvement)

### 2. Lighting Control (To Be Implemented)

**Planned Features**:

#### A. Song-Based Lighting
- Each song can have `midiNotes` array (comma-separated in song editor)
- When song loads or at specific times, send MIDI notes to trigger lighting scenes/cues
- Notes stored per-song and sent automatically

#### B. Timeline-Based Lighting (Future)
- Visual timeline editor for programming light sequences
- Trigger lights at specific beats/times during a song
- Sync with metronome and lyrics
- Save sequences per-song or per-set-list

#### C. Live Manual Control
- Test buttons to manually trigger lights
- MIDI note grid for quick testing
- Visual feedback when notes are sent

## Implementation Plan

### Phase 1: Basic Lighting Trigger ✅ (UI Ready)

**Tasks**:
1. ✅ Create MIDI Lights view UI
2. ✅ Device selection dropdowns
3. ✅ MIDI note reference grid
4. ⏳ Connect song `midiNotes` to MIDI output when song loads
5. ⏳ Test button functionality
6. ⏳ Error handling and user feedback

**What You Need to Provide**:
- Make/model of your lighting system
- How it receives MIDI (notes, CC, channels)
- Test device to verify MIDI communication

### Phase 2: Timeline-Based Programming (Future)

**Tasks**:
1. Timeline UI component
2. Beat/time-based event programming
3. Visual preview of light sequence
4. Save/load sequences
5. Sync with metronome playback

**Requirements**:
- Understanding of your lighting system's MIDI implementation
- Testing environment
- Possible lighting controller if needed

### Phase 3: Advanced Features (Future)

- MIDI CC support (for dimming, color changes, etc.)
- Multiple lighting zones/devices
- Scene transitions
- Cue list management
- Real-time adjustment during performance

## Technical Details

### MIDI Implementation

The app uses the **Web MIDI API** which:
- ✅ Works in Chrome, Edge, Opera (Chromium-based browsers)
- ❌ Does NOT work in Safari or Firefox
- Requires user permission on first use
- Supports USB MIDI devices
- Supports Bluetooth MIDI (on compatible devices)

### Current MIDI Code Structure

```
react-app/src/
├── midi.js                    # MIDIController class (fully implemented)
│   ├── initialize()           # Request MIDI access
│   ├── setOutput()            # Select default device
│   ├── setHelixOutput()       # Select Helix device
│   ├── setLightsOutput()      # Select lights device
│   ├── sendNoteOn()           # Send MIDI note
│   ├── sendNoteOnToLights()   # Send note to lights device
│   ├── sendProgramChange()    # Send preset change
│   └── sendCC()               # Send control change
│
├── views/
│   └── MIDILightsView.jsx     # MIDI configuration UI (UI ready, needs wiring)
│
└── views/PerformanceView.jsx  # Uses midiController for preset changes
```

### How to Connect the Dots

**To make song-based lighting work**:

1. In `PerformanceView.jsx`, when a song loads:
   ```javascript
   if (currentSong.midiNotes && currentSong.midiNotes.length > 0) {
     midiController.sendNotesToLights(currentSong.midiNotes, 127, 0)
   }
   ```

2. Wire up the test button in `MIDILightsView.jsx`:
   ```javascript
   const handleTestLights = () => {
     midiController.sendNoteOnToLights(60, 127, 0) // Test with middle C
   }
   ```

3. Wire up note grid clicks:
   ```javascript
   const handleNoteClick = (note) => {
     midiController.sendNoteOnToLights(note, 127, 0)
   }
   ```

## Questions to Answer Before Full Implementation

1. **What is the make/model of your lighting system?**
   - This determines MIDI protocol (notes, CC, channels)

2. **Does it accept MIDI directly or need a controller?**
   - Direct MIDI = simpler setup
   - Needs controller = additional hardware needed

3. **How are scenes/cues triggered?**
   - MIDI note numbers (which notes = which scenes)?
   - MIDI CC (control changes)?
   - Specific MIDI channels?

4. **What MIDI interface are you using?**
   - USB MIDI interface?
   - Audio interface with MIDI?
   - Bluetooth MIDI?

5. **Do you want timeline-based programming?**
   - Or is song-based triggering sufficient?

## Next Steps

1. **Identify your lighting equipment** - Make, model, and MIDI capabilities
2. **Test MIDI communication** - Verify your lights can receive MIDI from your setup
3. **Determine MIDI mapping** - Which notes/CCs trigger which scenes
4. **Implement basic triggers** - Connect song `midiNotes` to actual MIDI output
5. **Test and refine** - Ensure reliability during performance

## Support & Troubleshooting

### Browser Compatibility
- **Required**: Chrome, Edge, or Opera
- **Not supported**: Safari, Firefox

### MIDI Device Not Showing
1. Ensure device is connected and powered on
2. Click "Refresh Devices"
3. Check browser permissions (may need to allow MIDI access)
4. Try disconnecting and reconnecting device

### MIDI Messages Not Reaching Lights
1. Verify correct device selected in dropdown
2. Check MIDI channel (default is 0, may need different channel)
3. Test with MIDI monitor software
4. Verify lighting system MIDI settings

## Resources

- [Web MIDI API Specification](https://www.w3.org/TR/webmidi/)
- [MIDI Note Reference](https://newt.phys.unsw.edu.au/jw/notes.html)
- [MIDI Implementation Charts](https://www.midi.org/specifications-old/item/midi-implementation-charts) - Check your device's chart

---

**Note**: This document will be updated as implementation progresses. If you have specific equipment or requirements, please document them here or in the code comments.

