// IndexedDB interface using Dexie.js
import Dexie from 'dexie';

const DB_NAME = 'PerformanceMetronomeDB';
const CURRENT_VERSION = 1;

class PerformanceDB extends Dexie {
  constructor() {
    super(DB_NAME);
    
    // Define schema version 1
    this.version(1).stores({
      songs: 'id, title, artist, [title+artist], bpm, createdAt, updatedAt',
      setlists: 'id, name, updatedAt, createdAt',
      meta: 'key'
    });
  }
}

// Create singleton instance
const db = new PerformanceDB();

/**
 * Initialize database and run migrations if needed
 */
export async function initializeDB() {
  try {
    await db.open();
    console.log('IndexedDB initialized:', DB_NAME);
    
    // Check if this is first run or migration needed
    const schemaVersion = await getSchemaVersion();
    
    if (schemaVersion === null) {
      // First run, set initial version
      await setSchemaVersion(CURRENT_VERSION);
      console.log('Schema version set to:', CURRENT_VERSION);
    }
    
    return db;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

/**
 * Get current schema version from meta table
 */
export async function getSchemaVersion() {
  try {
    const meta = await db.meta.get('appSchemaVersion');
    return meta?.value || null;
  } catch (error) {
    console.error('Error getting schema version:', error);
    return null;
  }
}

/**
 * Set schema version in meta table
 */
export async function setSchemaVersion(version) {
  await db.meta.put({
    key: 'appSchemaVersion',
    value: version
  });
}

/**
 * Get a value from meta table
 */
export async function getMetaValue(key) {
  try {
    const meta = await db.meta.get(key);
    return meta?.value || null;
  } catch (error) {
    console.error(`Error getting meta value for key ${key}:`, error);
    return null;
  }
}

/**
 * Set a value in meta table
 */
export async function setMetaValue(key, value) {
  await db.meta.put({ key, value });
}

// ============================================================================
// SONG OPERATIONS
// ============================================================================

/**
 * Generate a unique ID for a song
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate song data
 */
export function validateSong(song) {
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

/**
 * Add a new song
 */
export async function addSong(song) {
  const errors = validateSong(song);
  if (errors.length > 0) {
    throw new Error(`Invalid song data: ${errors.join(', ')}`);
  }
  
  const now = new Date().toISOString();
  const newSong = {
    ...song,
    id: song.id || generateId(),
    createdAt: song.createdAt || now,
    updatedAt: song.updatedAt || now,
    timeSignature: song.timeSignature || '4/4',
    notes: song.notes || '',
    tags: song.tags || [],
    midi: song.midi || null,
    lyrics: song.lyrics || []
  };
  
  await db.songs.add(newSong);
  console.log('Song added:', newSong.id);
  return newSong;
}

/**
 * Update an existing song
 */
export async function updateSong(id, updates) {
  const existing = await db.songs.get(id);
  if (!existing) {
    throw new Error(`Song not found: ${id}`);
  }
  
  const updated = {
    ...existing,
    ...updates,
    id,  // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  const errors = validateSong(updated);
  if (errors.length > 0) {
    throw new Error(`Invalid song data: ${errors.join(', ')}`);
  }
  
  await db.songs.put(updated);
  console.log('Song updated:', id);
  return updated;
}

/**
 * Delete a song
 */
export async function deleteSong(id) {
  await db.transaction('rw', [db.songs, db.setlists], async () => {
    // Delete the song
    await db.songs.delete(id);
    
    // Remove from all set lists
    const setlists = await db.setlists.toArray();
    for (const setlist of setlists) {
      if (setlist.songIds.includes(id)) {
        setlist.songIds = setlist.songIds.filter(songId => songId !== id);
        setlist.updatedAt = new Date().toISOString();
        await db.setlists.put(setlist);
      }
    }
  });
  
  console.log('Song deleted:', id);
}

/**
 * Get a song by ID
 */
export async function getSong(id) {
  return await db.songs.get(id);
}

/**
 * Get all songs
 */
export async function getAllSongs() {
  return await db.songs.toArray();
}

/**
 * Search songs by title or artist
 */
export async function searchSongs(query) {
  const lowerQuery = query.toLowerCase();
  
  const songs = await db.songs
    .filter(song => 
      song.title.toLowerCase().includes(lowerQuery) ||
      song.artist.toLowerCase().includes(lowerQuery)
    )
    .toArray();
  
  return songs;
}

/**
 * Check for duplicate song (same title and artist)
 */
export async function findDuplicateSong(title, artist, excludeId = null) {
  const songs = await db.songs
    .where('[title+artist]')
    .equals([title, artist])
    .toArray();
  
  if (excludeId) {
    return songs.filter(s => s.id !== excludeId);
  }
  
  return songs;
}

/**
 * Bulk add songs (for import)
 */
export async function bulkAddSongs(songs) {
  const validSongs = [];
  const errors = [];
  
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const validationErrors = validateSong(song);
    
    if (validationErrors.length > 0) {
      errors.push({ index: i, song, errors: validationErrors });
    } else {
      const now = new Date().toISOString();
      validSongs.push({
        ...song,
        id: song.id || generateId(),
        createdAt: song.createdAt || now,
        updatedAt: song.updatedAt || now,
        timeSignature: song.timeSignature || '4/4',
        notes: song.notes || '',
        tags: song.tags || [],
        midi: song.midi || null,
        lyrics: song.lyrics || []
      });
    }
  }
  
  if (validSongs.length > 0) {
    await db.songs.bulkAdd(validSongs);
    console.log(`Bulk added ${validSongs.length} songs`);
  }
  
  return { added: validSongs.length, errors };
}

// ============================================================================
// SET LIST OPERATIONS
// ============================================================================

/**
 * Validate set list data
 */
export function validateSetList(setlist) {
  const errors = [];
  
  if (!setlist.name || typeof setlist.name !== 'string' || setlist.name.trim() === '') {
    errors.push('Set list name is required');
  }
  
  if (!Array.isArray(setlist.songIds)) {
    errors.push('songIds must be an array');
  }
  
  return errors;
}

/**
 * Add a new set list
 */
export async function addSetList(setlist) {
  const errors = validateSetList(setlist);
  if (errors.length > 0) {
    throw new Error(`Invalid set list data: ${errors.join(', ')}`);
  }
  
  const now = new Date().toISOString();
  const newSetList = {
    ...setlist,
    id: setlist.id || generateId(),
    createdAt: setlist.createdAt || now,
    updatedAt: setlist.updatedAt || now,
    songIds: setlist.songIds || []
  };
  
  await db.setlists.add(newSetList);
  console.log('Set list added:', newSetList.id);
  return newSetList;
}

/**
 * Update an existing set list
 */
export async function updateSetList(id, updates) {
  const existing = await db.setlists.get(id);
  if (!existing) {
    throw new Error(`Set list not found: ${id}`);
  }
  
  const updated = {
    ...existing,
    ...updates,
    id,  // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  const errors = validateSetList(updated);
  if (errors.length > 0) {
    throw new Error(`Invalid set list data: ${errors.join(', ')}`);
  }
  
  await db.setlists.put(updated);
  console.log('Set list updated:', id);
  return updated;
}

/**
 * Delete a set list
 */
export async function deleteSetList(id) {
  await db.setlists.delete(id);
  console.log('Set list deleted:', id);
}

/**
 * Get a set list by ID
 */
export async function getSetList(id) {
  return await db.setlists.get(id);
}

/**
 * Get all set lists
 */
export async function getAllSetLists() {
  return await db.setlists.toArray();
}

/**
 * Get recent set lists (sorted by updatedAt)
 */
export async function getRecentSetLists(limit = 10) {
  return await db.setlists
    .orderBy('updatedAt')
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Get set list with populated songs
 */
export async function getSetListWithSongs(id) {
  const setlist = await db.setlists.get(id);
  if (!setlist) {
    return null;
  }
  
  const songs = await db.songs.bulkGet(setlist.songIds);
  
  return {
    ...setlist,
    songs: songs.filter(Boolean)  // Filter out any null values (deleted songs)
  };
}

/**
 * Bulk add set lists (for import)
 */
export async function bulkAddSetLists(setlists) {
  const validSetLists = [];
  const errors = [];
  
  for (let i = 0; i < setlists.length; i++) {
    const setlist = setlists[i];
    const validationErrors = validateSetList(setlist);
    
    if (validationErrors.length > 0) {
      errors.push({ index: i, setlist, errors: validationErrors });
    } else {
      const now = new Date().toISOString();
      validSetLists.push({
        ...setlist,
        id: setlist.id || generateId(),
        createdAt: setlist.createdAt || now,
        updatedAt: setlist.updatedAt || now,
        songIds: setlist.songIds || []
      });
    }
  }
  
  if (validSetLists.length > 0) {
    await db.setlists.bulkAdd(validSetLists);
    console.log(`Bulk added ${validSetLists.length} set lists`);
  }
  
  return { added: validSetLists.length, errors };
}

// ============================================================================
// PREFERENCES
// ============================================================================

/**
 * Get preferences
 */
export async function getPreferences() {
  const defaultPreferences = {
    // Metronome
    soundEnabled: true,
    visualFlashEnabled: true,
    clickVolume: 0.8,
    accentVolume: 1.0,
    clickSound: 'woodblock',
    
    // Display
    showBeatNumber: true,
    highContrastMode: false,
    largeTextMode: false,
    stageMode: false,
    
    // Behavior
    longPressToStop: false,
    autoStartOnSelect: true,
    keepScreenAwake: true,
    hapticFeedback: false,
    
    // Sync (if enabled)
    syncEnabled: false,
    syncInterval: 5,
    autoSync: true,
    lastSyncAt: null
  };
  
  const stored = await getMetaValue('preferences');
  return stored ? { ...defaultPreferences, ...stored } : defaultPreferences;
}

/**
 * Update preferences
 */
export async function updatePreferences(updates) {
  const current = await getPreferences();
  const updated = { ...current, ...updates };
  await setMetaValue('preferences', updated);
  return updated;
}

// ============================================================================
// MIDI MAPPINGS
// ============================================================================

/**
 * Get MIDI mappings
 */
export async function getMIDIMappings() {
  const mappings = await getMetaValue('midiMappings');
  return mappings || { devices: {} };
}

/**
 * Update MIDI mappings for a device
 */
export async function updateMIDIMappings(deviceName, mappings) {
  const current = await getMIDIMappings();
  
  current.devices[deviceName] = {
    mappings,
    lastConnected: new Date().toISOString()
  };
  
  await setMetaValue('midiMappings', current);
  return current;
}

/**
 * Clear MIDI mappings for a device
 */
export async function clearMIDIMappings(deviceName) {
  const current = await getMIDIMappings();
  delete current.devices[deviceName];
  await setMetaValue('midiMappings', current);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all data (for testing or reset)
 */
export async function clearAllData() {
  await db.transaction('rw', [db.songs, db.setlists, db.meta], async () => {
    await db.songs.clear();
    await db.setlists.clear();
    await db.meta.clear();
  });
  console.log('All data cleared');
}

/**
 * Get database statistics
 */
export async function getDBStats() {
  const songCount = await db.songs.count();
  const setlistCount = await db.setlists.count();
  const schemaVersion = await getSchemaVersion();
  
  return {
    songs: songCount,
    setlists: setlistCount,
    schemaVersion,
    dbName: DB_NAME
  };
}

/**
 * Export all data
 */
export async function exportAllData() {
  const songs = await db.songs.toArray();
  const setlists = await db.setlists.toArray();
  const preferences = await getPreferences();
  const midiMappings = await getMIDIMappings();
  
  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    songs,
    setlists,
    preferences,
    midiMappings
  };
}

/**
 * Import data (merge or replace)
 */
export async function importData(data, mode = 'merge') {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import data');
  }
  
  if (mode === 'replace') {
    await clearAllData();
  }
  
  const results = {
    songs: { added: 0, skipped: 0, errors: [] },
    setlists: { added: 0, skipped: 0, errors: [] }
  };
  
  // Import songs
  if (Array.isArray(data.songs)) {
    for (const song of data.songs) {
      try {
        if (mode === 'merge') {
          // Check if song already exists
          const existing = await getSong(song.id);
          if (existing) {
            results.songs.skipped++;
            continue;
          }
        }
        
        await addSong(song);
        results.songs.added++;
      } catch (error) {
        results.songs.errors.push({ song, error: error.message });
      }
    }
  }
  
  // Import set lists
  if (Array.isArray(data.setlists)) {
    for (const setlist of data.setlists) {
      try {
        if (mode === 'merge') {
          // Check if set list already exists
          const existing = await getSetList(setlist.id);
          if (existing) {
            results.setlists.skipped++;
            continue;
          }
        }
        
        await addSetList(setlist);
        results.setlists.added++;
      } catch (error) {
        results.setlists.errors.push({ setlist, error: error.message });
      }
    }
  }
  
  // Import preferences (always merge)
  if (data.preferences) {
    await updatePreferences(data.preferences);
  }
  
  // Import MIDI mappings (always merge)
  if (data.midiMappings) {
    await setMetaValue('midiMappings', data.midiMappings);
  }
  
  console.log('Import completed:', results);
  return results;
}

// Export the db instance as default
export default db;

