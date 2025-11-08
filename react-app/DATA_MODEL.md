# Data Model & Storage Architecture

## Overview
This document defines the complete data model, storage strategy, and versioning system for the Performance Metronome PWA.

## Storage Strategy

### Primary: IndexedDB (via Dexie.js)
**Why IndexedDB:**
- Large storage capacity (50MB+ typically, can request more)
- Reliable persistence (not cleared like localStorage)
- Transactional (atomic operations)
- Indexed queries (fast lookups)
- Structured cloning (handles complex objects)

**Dexie.js Benefits:**
- Simple API (Promise-based)
- Built-in versioning and migrations
- Type-safe TypeScript support
- Better error handling than raw IndexedDB

### Backup: localStorage
**Limited use only:**
- Feature flags (<1KB)
- Last view preference
- Display settings
- Quick-access strings

**Never store in localStorage:**
- Songs or set lists (too large)
- User data (unreliable)
- Anything >5KB

## IndexedDB Schema

### Version 1 (Initial)

#### Table: `songs`
```javascript
{
  id: string,              // Primary key, UUID v4
  title: string,           // Required, "Song Title"
  artist: string,          // Required, "Artist Name"
  bpm: number,             // Required, 40-300
  timeSignature: string,   // Default "4/4"
  notes: string,           // Optional, free-form text
  tags: string[],          // Optional, ["tag1", "tag2"]
  midi: {
    program: number,       // Optional, 0-127 (MIDI program change)
    cc: object            // Optional, {14: 127, 15: 64} (CC number: value)
  },
  lyrics: [
    {
      time: number,        // Seconds from song start
      text: string         // Line of lyrics
    }
  ],
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}

// Indexes:
// - id (primary, unique)
// - title (for search)
// - artist (for search)
// - [title+artist] (compound, for duplicate detection)
```

#### Table: `setlists`
```javascript
{
  id: string,              // Primary key, UUID v4
  name: string,            // Required, "Friday Night Set"
  songIds: string[],       // Required, ordered array of song IDs
  createdAt: string,       // ISO 8601 timestamp
  updatedAt: string        // ISO 8601 timestamp
}

// Indexes:
// - id (primary, unique)
// - name (for search)
// - updatedAt (for "recent" sorting)
```

#### Table: `meta`
```javascript
{
  key: string,             // Primary key, "appSchemaVersion" | "preferences" | etc.
  value: any              // Stored value (JSON-serializable)
}

// Keys:
// - "appSchemaVersion": number (1, 2, 3...)
// - "lastMigration": string (ISO timestamp)
// - "preferences": object (app-wide settings)
// - "midiMappings": object (per-device MIDI config)
```

### Version 2 (Future Example)

#### Changes:
- Add `genre: string` to songs
- Add `color: string` to setlists
- Migrate existing data with defaults

```javascript
// Migration:
await db.version(2).stores({
  songs: '++id, title, artist, [title+artist], genre', // Add genre index
  setlists: '++id, name, updatedAt',
  meta: 'key'
}).upgrade(tx => {
  // Add default genre to all existing songs
  return tx.table('songs').toCollection().modify(song => {
    song.genre = song.genre || 'Unknown';
  });
});
```

## Data Validation

### Song Validation
```javascript
function validateSong(song) {
  const errors = [];
  
  if (!song.title || typeof song.title !== 'string' || song.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!song.artist || typeof song.artist !== 'string' || song.artist.trim() === '') {
    errors.push('Artist is required');
  }
  
  if (!song.bpm || typeof song.bpm !== 'number' || song.bpm < 40 || song.bpm > 300) {
    errors.push('BPM must be between 40 and 300');
  }
  
  if (song.midi?.program !== undefined) {
    if (typeof song.midi.program !== 'number' || song.midi.program < 0 || song.midi.program > 127) {
      errors.push('MIDI program must be between 0 and 127');
    }
  }
  
  if (song.lyrics && !Array.isArray(song.lyrics)) {
    errors.push('Lyrics must be an array');
  }
  
  return errors;
}
```

### SetList Validation
```javascript
function validateSetList(setlist, allSongs) {
  const errors = [];
  
  if (!setlist.name || typeof setlist.name !== 'string' || setlist.name.trim() === '') {
    errors.push('Set list name is required');
  }
  
  if (!Array.isArray(setlist.songIds)) {
    errors.push('songIds must be an array');
  } else {
    // Check all song IDs exist
    const missingSongs = setlist.songIds.filter(id => 
      !allSongs.some(song => song.id === id)
    );
    if (missingSongs.length > 0) {
      errors.push(`Songs not found: ${missingSongs.join(', ')}`);
    }
  }
  
  return errors;
}
```

## Import/Export Format

### Full Export
```json
{
  "version": 1,
  "exportedAt": "2025-11-08T12:00:00.000Z",
  "songs": [
    {
      "id": "abc-123",
      "title": "Song Title",
      "artist": "Artist Name",
      "bpm": 120,
      "timeSignature": "4/4",
      "notes": "",
      "tags": [],
      "midi": null,
      "lyrics": [],
      "createdAt": "2025-11-08T10:00:00.000Z",
      "updatedAt": "2025-11-08T11:00:00.000Z"
    }
  ],
  "setlists": [
    {
      "id": "def-456",
      "name": "Friday Set",
      "songIds": ["abc-123"],
      "createdAt": "2025-11-08T10:00:00.000Z",
      "updatedAt": "2025-11-08T11:00:00.000Z"
    }
  ],
  "preferences": {
    "soundEnabled": true,
    "visualFlashEnabled": true,
    "showBeatNumber": true
  }
}
```

### Share Link Format
```
https://app.example.com/?import=eyJ2ZXJzaW9uIjoxLCJzb25ncyI6W...
```
Base64-encoded JSON of the export format.

## Migration Strategy

### Migration Scripts
Each version upgrade has a migration function:

```javascript
// migrations.js
export const migrations = {
  1: {
    // Initial version, migrate from localStorage
    up: async (db) => {
      const oldData = localStorage.getItem('performanceApp');
      if (oldData) {
        const parsed = JSON.parse(oldData);
        await db.songs.bulkAdd(parsed.songs || []);
        await db.setlists.bulkAdd(parsed.setLists || []);
      }
      await db.meta.put({ key: 'appSchemaVersion', value: 1 });
    }
  },
  
  2: {
    // Add genre field
    up: async (db) => {
      await db.transaction('rw', db.songs, async () => {
        const allSongs = await db.songs.toArray();
        for (const song of allSongs) {
          if (!song.genre) {
            song.genre = 'Unknown';
            await db.songs.put(song);
          }
        }
      });
      await db.meta.put({ key: 'appSchemaVersion', value: 2 });
    }
  }
};
```

### Migration Process
1. On app load, check current schema version in `meta` table
2. Compare to latest version in code
3. If behind, show "Updating database..." message
4. Create backup in localStorage before migrating
5. Run each migration in sequence
6. Update schema version in `meta`
7. Reload app data

### Rollback
If migration fails:
1. Clear IndexedDB
2. Restore from localStorage backup
3. Show error message
4. Log to console for debugging

## Preferences Schema

```javascript
{
  // Metronome
  soundEnabled: boolean,           // Default: true
  visualFlashEnabled: boolean,     // Default: true
  clickVolume: number,             // 0-1, Default: 0.8
  accentVolume: number,            // 0-1, Default: 1.0
  clickSound: string,              // "woodblock" | "beep", Default: "woodblock"
  
  // Display
  showBeatNumber: boolean,         // Default: true
  highContrastMode: boolean,       // Default: false
  largeTextMode: boolean,          // Default: false
  stageMode: boolean,              // Default: false (minimal UI)
  
  // Behavior
  longPressToStop: boolean,        // Default: false
  autoStartOnSelect: boolean,      // Default: true
  keepScreenAwake: boolean,        // Default: true
  hapticFeedback: boolean,         // Default: false
  
  // Sync (if enabled)
  syncEnabled: boolean,            // Default: false
  syncInterval: number,            // Minutes, Default: 5
  autoSync: boolean,               // Default: true
  lastSyncAt: string              // ISO timestamp
}
```

## MIDI Mappings Schema

```javascript
{
  // Per-device mappings
  devices: {
    "Device Name": {
      mappings: [
        {
          type: "note" | "cc" | "pc",
          channel: number,         // 0-15
          number: number,          // Note/CC number
          action: "play" | "pause" | "next" | "prev" | "tap" | "bpm+1" | "bpm-1" | "bpm+5" | "bpm-5" | "bpm+10" | "bpm-10",
          value: number           // Optional, for CC value matching
        }
      ],
      lastConnected: string       // ISO timestamp
    }
  }
}
```

## Query Patterns

### Common Queries

```javascript
// Get all songs sorted by title
const songs = await db.songs.orderBy('title').toArray();

// Search songs by title or artist
const results = await db.songs
  .where('title').startsWithIgnoreCase(query)
  .or('artist').startsWithIgnoreCase(query)
  .toArray();

// Get set list with songs
const setlist = await db.setlists.get(setlistId);
const songs = await db.songs.bulkGet(setlist.songIds);

// Get recent set lists
const recent = await db.setlists
  .orderBy('updatedAt')
  .reverse()
  .limit(10)
  .toArray();

// Check for duplicate song
const duplicate = await db.songs
  .where('[title+artist]')
  .equals([title, artist])
  .first();
```

## Performance Considerations

### Indexing
- Index fields used in `where()` clauses
- Don't over-index (slows writes)
- Compound indexes for common multi-field queries

### Transactions
- Group related operations in transactions
- Use `rw` (read-write) only when needed
- Keep transactions short

### Caching
- Cache frequently accessed data in React state
- Invalidate cache on writes
- Use `useMemo` for derived data

### Batch Operations
- Use `bulkAdd/bulkPut/bulkDelete` for multiple records
- More efficient than individual operations

## Testing Data Model

### Test Cases
1. Create song with all fields
2. Create song with minimal fields
3. Update song
4. Delete song (verify removed from set lists)
5. Create set list
6. Reorder songs in set list
7. Import data (merge strategy)
8. Export data (verify format)
9. Migration from v1 to v2
10. Validation errors (invalid BPM, missing title, etc.)

### Test Data
Located in `src/utils/exampleSongs.js` for seeding development database.

