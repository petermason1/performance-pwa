# Database Migrations Guide

## Overview
This document describes the migration system for transitioning between storage backends and schema versions.

## Migration Phases

### Phase 1: localStorage → IndexedDB (Version 1)
**Status:** Pending implementation
**Purpose:** Move from localStorage to IndexedDB for reliability and scalability

#### Current State (localStorage)
```javascript
// Key: 'performanceApp'
{
  songs: [
    {
      id, title, artist, bpm, timeSignature,
      notes, tags, midi, lyrics,
      createdAt, updatedAt
    }
  ],
  setLists: [
    {
      id, name, songIds,
      createdAt, updatedAt
    }
  ]
}
```

#### Target State (IndexedDB v1)
```javascript
// Database: 'PerformanceMetronomeDB'
// Tables: songs, setlists, meta

// songs table
{
  id (PK), title, artist, bpm, timeSignature,
  notes, tags, midi, lyrics,
  createdAt, updatedAt
}

// setlists table
{
  id (PK), name, songIds,
  createdAt, updatedAt
}

// meta table
{
  key (PK): "appSchemaVersion" | "preferences" | "midiMappings",
  value: any
}
```

#### Migration Process
1. **Backup:**
   ```javascript
   const backup = localStorage.getItem('performanceApp');
   localStorage.setItem('performanceApp_backup', backup);
   localStorage.setItem('performanceApp_backup_timestamp', new Date().toISOString());
   ```

2. **Parse Old Data:**
   ```javascript
   const oldData = JSON.parse(localStorage.getItem('performanceApp'));
   const songs = oldData.songs || [];
   const setlists = oldData.setLists || [];
   ```

3. **Initialize IndexedDB:**
   ```javascript
   const db = new Dexie('PerformanceMetronomeDB');
   db.version(1).stores({
     songs: 'id, title, artist, [title+artist]',
     setlists: 'id, name, updatedAt',
     meta: 'key'
   });
   ```

4. **Migrate Data:**
   ```javascript
   await db.transaction('rw', [db.songs, db.setlists, db.meta], async () => {
     // Migrate songs
     await db.songs.bulkAdd(songs);
     
     // Migrate setlists (note: setLists → setlists)
     await db.setlists.bulkAdd(setlists);
     
     // Set version
     await db.meta.put({ key: 'appSchemaVersion', value: 1 });
     
     // Set last migration timestamp
     await db.meta.put({ 
       key: 'lastMigration', 
       value: new Date().toISOString() 
     });
   });
   ```

5. **Verify:**
   ```javascript
   const songCount = await db.songs.count();
   const setlistCount = await db.setlists.count();
   
   if (songCount !== songs.length || setlistCount !== setlists.length) {
     throw new Error('Migration verification failed');
   }
   ```

6. **Flag as Complete:**
   ```javascript
   localStorage.setItem('migratedToIndexedDB', 'true');
   localStorage.setItem('migrationDate', new Date().toISOString());
   ```

7. **Keep Old Data (for safety):**
   - Do NOT delete `performanceApp` key immediately
   - Keep backup for 30 days
   - Add UI to manually delete after verification

#### Rollback Procedure
If migration fails or user reports issues:

```javascript
async function rollbackToLocalStorage() {
  const backup = localStorage.getItem('performanceApp_backup');
  
  if (!backup) {
    throw new Error('No backup found');
  }
  
  // Restore backup
  localStorage.setItem('performanceApp', backup);
  
  // Clear IndexedDB
  await Dexie.delete('PerformanceMetronomeDB');
  
  // Clear migration flags
  localStorage.removeItem('migratedToIndexedDB');
  localStorage.removeItem('migrationDate');
  
  // Reload app
  window.location.reload();
}
```

### Phase 2: Schema v1 → v2 (Future Example)
**Purpose:** Add new fields or tables

#### Example: Add Genre to Songs

```javascript
// Migration
db.version(2).stores({
  songs: 'id, title, artist, [title+artist], genre',  // Add genre index
  setlists: 'id, name, updatedAt',
  meta: 'key'
}).upgrade(async (tx) => {
  // Update all existing songs
  await tx.table('songs').toCollection().modify(song => {
    if (!song.genre) {
      // Auto-detect genre from tags or set default
      song.genre = song.tags?.includes('rock') ? 'Rock' :
                   song.tags?.includes('pop') ? 'Pop' :
                   'Unknown';
    }
  });
  
  // Update schema version
  await tx.table('meta').put({ key: 'appSchemaVersion', value: 2 });
});
```

### Phase 3: Schema v2 → v3 (Future Example)
**Purpose:** Add color coding to set lists

```javascript
db.version(3).stores({
  songs: 'id, title, artist, [title+artist], genre',
  setlists: 'id, name, updatedAt',  // No index change needed
  meta: 'key'
}).upgrade(async (tx) => {
  // Add color field to all set lists
  await tx.table('setlists').toCollection().modify(setlist => {
    if (!setlist.color) {
      setlist.color = '#3B82F6';  // Default blue
    }
  });
  
  await tx.table('meta').put({ key: 'appSchemaVersion', value: 3 });
});
```

## Migration Helper Functions

### Check Migration Status
```javascript
export async function getMigrationStatus() {
  // Check localStorage migration
  const migratedToIDB = localStorage.getItem('migratedToIndexedDB') === 'true';
  
  // Check current schema version
  const db = await getDB();
  const meta = await db.meta.get('appSchemaVersion');
  const currentVersion = meta?.value || 0;
  
  // Get latest version from code
  const latestVersion = db.verno;
  
  return {
    migratedToIDB,
    currentVersion,
    latestVersion,
    needsMigration: currentVersion < latestVersion
  };
}
```

### Run Migrations
```javascript
export async function runMigrations() {
  const status = await getMigrationStatus();
  
  if (!status.migratedToIDB) {
    // Phase 1: localStorage → IndexedDB
    await migrateFromLocalStorage();
  }
  
  if (status.needsMigration) {
    // Phase 2+: Schema upgrades (handled by Dexie automatically)
    console.log(`Upgrading schema from v${status.currentVersion} to v${status.latestVersion}`);
    // Dexie.js handles this automatically on db.open()
  }
}
```

### Backup Before Migration
```javascript
export async function backupBeforeMigration() {
  const db = await getDB();
  
  // Export all data
  const songs = await db.songs.toArray();
  const setlists = await db.setlists.toArray();
  const meta = await db.meta.toArray();
  
  const backup = {
    version: db.verno,
    timestamp: new Date().toISOString(),
    songs,
    setlists,
    meta
  };
  
  // Store in localStorage as emergency backup
  localStorage.setItem('idb_backup', JSON.stringify(backup));
  
  return backup;
}
```

## Testing Migrations

### Test Cases

#### 1. Fresh Install
- No localStorage data
- No IndexedDB data
- Should initialize IndexedDB v1 with empty tables

#### 2. Migrate from localStorage
- Has localStorage data
- No IndexedDB data
- Should migrate all songs and set lists
- Should preserve IDs, timestamps, and relationships

#### 3. Partial Migration Failure
- localStorage data exists
- IndexedDB partially populated
- Should rollback and try again

#### 4. Schema Upgrade (v1 → v2)
- Has IndexedDB v1 data
- Should add new fields with defaults
- Should preserve all existing data
- Should update version number

#### 5. Multi-Version Jump (v1 → v3)
- Has IndexedDB v1 data
- Should run v1→v2 and v2→v3 migrations
- Should end up at v3 with all fields

### Manual Testing Script
```javascript
// Reset to localStorage state
async function resetToLocalStorage() {
  const data = {
    songs: [
      { id: '1', title: 'Test Song', artist: 'Test Artist', bpm: 120 }
    ],
    setLists: [
      { id: '1', name: 'Test Set', songIds: ['1'] }
    ]
  };
  localStorage.setItem('performanceApp', JSON.stringify(data));
  await Dexie.delete('PerformanceMetronomeDB');
  localStorage.removeItem('migratedToIndexedDB');
  console.log('Reset complete. Reload to test migration.');
}

// Verify migration
async function verifyMigration() {
  const db = await getDB();
  const songs = await db.songs.toArray();
  const setlists = await db.setlists.toArray();
  const version = await db.meta.get('appSchemaVersion');
  
  console.log('Migration verification:', {
    songs: songs.length,
    setlists: setlists.length,
    version: version?.value,
    data: { songs, setlists }
  });
}
```

## Migration UI

### During Migration
Show overlay with:
- "Upgrading your data..."
- Progress indicator
- "Do not close this window"
- Current step (1/3, 2/3, 3/3)

### After Migration
Show success message:
- "Data upgraded successfully!"
- Summary: "X songs and Y set lists migrated"
- "Dismiss" button

### On Failure
Show error message:
- "Migration failed"
- "Your data has been backed up"
- "Try again" button
- "Contact support" link
- Console log with error details

## Edge Cases

### 1. Concurrent Tabs
- Only one tab should run migration
- Use localStorage lock: `migrationInProgress`
- Other tabs wait and reload after

### 2. Interrupted Migration
- Browser closed mid-migration
- Check for partial data on next load
- Rollback and retry from backup

### 3. Corrupted Data
- Invalid JSON in localStorage
- Show error, offer to reset
- Preserve backup if possible

### 4. Large Datasets
- 1000+ songs
- Batch migrations (100 at a time)
- Show progress percentage

### 5. Future Downgrades
- User installs old version
- Detect higher schema version
- Show "Update required" message
- Link to latest version

## Monitoring

### Log Events
- Migration started
- Migration completed
- Migration failed
- Schema version changed
- Rollback performed

### Metrics to Track
- Migration duration
- Success/failure rate
- Data volume (songs/setlists count)
- Schema version distribution

### Error Reporting
Log to console (later: send to analytics):
- Error message
- Stack trace
- Current schema version
- Data counts
- Browser/OS info

