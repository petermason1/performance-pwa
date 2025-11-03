# Performance PWA

A comprehensive Progressive Web App for live music performance management with set lists, synchronized lyrics, metronome, Helix Line 6 preset control, and MIDI lighting integration.

## Features

### 🎵 Set List Management
- Create and manage multiple set lists
- Drag and drop to reorder songs
- Alphabetical sorting options
- Load set lists for live performance
- Print set lists with duration totals

### 📝 Song Management
- Create songs with custom BPM (40-300) and time signatures
- Add lyrics with timestamps for synchronized display
- Assign Helix Line 6 preset names and numbers per song
- Configure MIDI note triggers for lighting cues
- Song duration tracking
- Bulk import songs

### ⏱️ Metronome
- Visual and audio beat indicator
- Adjustable BPM (40-300)
- Time signature support (2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, 12/8)
- Interactive tempo wheel
- Tap tempo functionality
- Polyrhythm support
- Custom accent patterns

### 📖 Synchronized Lyrics
- Lyrics display updates in real-time with metronome
- Timestamp-based lyric formatting: `[MM:SS.mm] Your lyrics here`
- Shows current and upcoming lines
- Highlights current lyric line

### 🎸 Helix Line 6 Integration
- Store preset names per song
- Auto-send Program Change messages (preset 0-127)
- Separate MIDI routing for Helix vs Lights
- Display current preset for active song
- USB MIDI and Bluetooth MIDI support

### 💡 MIDI Lighting Control
- Web MIDI API integration
- Separate device selection for Helix and Lights
- Send MIDI notes for lighting control
- Test and program light sequences
- MIDI note grid for easy selection

## Installation & Deployment

### Local Development

1. Clone this repository
2. Serve the files using a local server:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 8000
   ```
3. Open `http://localhost:8000` in your browser

### Deploy to Vercel (Free)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/performance-pwa.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a static site
   - Click "Deploy"
   - Done! Your app will be live at `your-app.vercel.app`

### Install on iPhone

1. **Deploy the app** (use Vercel or another host)
2. **Open Safari** on your iPhone
3. **Navigate to your app URL** (e.g., `your-app.vercel.app`)
4. **Tap the Share button** (square with arrow)
5. **Tap "Add to Home Screen"**
6. The app will appear as an icon on your home screen
7. Works offline after first load!

### Install on Android

1. Open Chrome on Android
2. Navigate to your app URL
3. Chrome will show an "Install" banner automatically
4. Tap "Install" or go to Menu → "Add to Home screen"
5. App works offline!

## Usage

### Creating Songs

1. Go to the **Songs** tab
2. Click **New Song**
3. Fill in:
   - Song name
   - Artist (optional)
   - BPM (beats per minute)
   - Time signature
   - Duration (optional, auto-calculated from lyrics)
   - Helix preset name (e.g., "Clean Chorus")
   - Helix preset number (0-127 for MIDI Program Change)
   - Lyrics with timestamps: `[00:00.00] First line of lyrics`
   - MIDI notes (comma-separated, e.g., "36,40,44")

### Lyrics Format

Use timestamp format: `[MM:SS.mm] Your lyrics here`

Example:
```
[00:00.00] Verse one starts here
[00:08.50] Second line appears
[00:16.00] Chorus begins now
```

### Creating Set Lists

1. Go to the **Set Lists** tab
2. Click **New Set List**
3. Enter a name
4. Songs are sorted alphabetically
5. Select songs and drag to reorder
6. Click **Save**

### Performance Mode

1. Go to the **Performance** tab
2. Select a set list from the dropdown
3. Click **Load**
4. Use **Lock Order** button to prevent accidental reordering
5. Click on songs to load them
6. Use **◀ Prev** and **Next ▶** to navigate
7. Adjust BPM with slider, tempo wheel, or tap tempo
8. Click **Start** to begin metronome
9. Lyrics display synchronized with tempo

### MIDI Setup

1. Go to **MIDI Lights & Helix Control** tab
2. Connect your Helix via USB or 5-pin MIDI
3. Connect your lights controller (separate device if needed)
4. Select devices in the dropdowns:
   - **Helix Line 6 Device**: For preset changes
   - **Lights Controller Device**: For lighting control
5. Set preset numbers in songs (0-127)
6. Songs will auto-switch Helix presets when loaded

## Keyboard Shortcuts

- **Space**: Start/Stop metronome
- **← Left Arrow**: Previous song
- **→ Right Arrow**: Next song

## Browser Requirements

- **Chrome/Edge**: Full support (MIDI, Audio, PWA)
- **Safari (iOS)**: Full support (PWA install via "Add to Home Screen")
- **Firefox**: Full support (no MIDI on some versions)
- **Opera**: Full support

## Data Storage

All data is stored locally in browser localStorage:
- Set lists
- Songs and lyrics
- Settings
- Sort preferences

No server or internet connection required after initial load.

## Offline Support

The app works completely offline:
- Service worker caches all files
- All data stored in localStorage
- Metronome uses Web Audio API (works offline)
- MIDI works if device is connected
- No internet needed after first load

## File Structure

```
/
├── index.html          # Main HTML structure
├── styles.css          # Complete styling
├── app.js              # Main application controller
├── models.js           # Data models and storage
├── metronome.js        # Metronome functionality
├── midi.js             # MIDI controller
├── import-songs.js     # Bulk song import
├── sw.js               # Service worker (PWA)
├── manifest.json       # PWA manifest
└── README.md          # This file
```

## License

Free to use and modify.
