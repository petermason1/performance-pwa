// Database migration utilities
import { 
  initializeDB, 
  getSchemaVersion, 
  setSchemaVersion,
  bulkAddSongs,
  bulkAddSetLists,
  setMetaValue
} from './db.js';

const LOCALSTORAGE_KEY = 'performanceApp';
const MIGRATION_FLAG = 'migratedToIndexedDB';
const BACKUP_KEY = 'performanceApp_backup';
const BACKUP_TIMESTAMP_KEY = 'performanceApp_backup_timestamp';

/**
 * Check if localStorage migration is needed
 */
export function needsLocalStorageMigration() {
  const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG) === 'true';
  const hasLocalStorageData = localStorage.getItem(LOCALSTORAGE_KEY) !== null;
  
  return !alreadyMigrated && hasLocalStorageData;
}

/**
 * Check migration status
 */
export async function getMigrationStatus() {
  const migratedToIDB = localStorage.getItem(MIGRATION_FLAG) === 'true';
  const hasLocalStorageData = localStorage.getItem(LOCALSTORAGE_KEY) !== null;
  
  try {
    const currentVersion = await getSchemaVersion();
    
    return {
      migratedToIDB,
      hasLocalStorageData,
      needsMigration: needsLocalStorageMigration(),
      currentVersion,
      backupExists: localStorage.getItem(BACKUP_KEY) !== null
    };
  } catch (error) {
    console.error('Error getting migration status:', error);
    return {
      migratedToIDB: false,
      hasLocalStorageData,
      needsMigration: true,
      currentVersion: null,
      backupExists: false,
      error: error.message
    };
  }
}

/**
 * Create backup of localStorage data
 */
function createBackup() {
  try {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    if (data) {
      localStorage.setItem(BACKUP_KEY, data);
      localStorage.setItem(BACKUP_TIMESTAMP_KEY, new Date().toISOString());
      console.log('Backup created');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return false;
  }
}

/**
 * Restore from backup
 */
export function restoreFromBackup() {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      localStorage.setItem(LOCALSTORAGE_KEY, backup);
      console.log('Restored from backup');
      return true;
    }
    console.warn('No backup found to restore');
    return false;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return false;
  }
}

/**
 * Parse localStorage data
 */
function parseLocalStorageData() {
  try {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!data) {
      return null;
    }
    
    const parsed = JSON.parse(data);
    return {
      songs: parsed.songs || [],
      setLists: parsed.setLists || [],  // Note: old key was setLists
      version: parsed.version || 0
    };
  } catch (error) {
    console.error('Failed to parse localStorage data:', error);
    return null;
  }
}

/**
 * Migrate from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(onProgress) {
  console.log('Starting migration from localStorage to IndexedDB...');
  
  // Step 1: Create backup
  if (onProgress) onProgress({ step: 'backup', message: 'Creating backup...' });
  const backupCreated = createBackup();
  if (!backupCreated) {
    throw new Error('Failed to create backup before migration');
  }
  
  // Step 2: Parse old data
  if (onProgress) onProgress({ step: 'parse', message: 'Reading existing data...' });
  const oldData = parseLocalStorageData();
  if (!oldData) {
    throw new Error('Failed to parse localStorage data');
  }
  
  console.log('Found data to migrate:', {
    songs: oldData.songs.length,
    setLists: oldData.setLists.length
  });
  
  // Step 3: Initialize IndexedDB
  if (onProgress) onProgress({ step: 'init', message: 'Initializing database...' });
  await initializeDB();
  
  // Step 4: Migrate songs
  if (onProgress) onProgress({ 
    step: 'songs', 
    message: `Migrating ${oldData.songs.length} songs...` 
  });
  
  const songsResult = await bulkAddSongs(oldData.songs);
  console.log('Songs migrated:', songsResult);
  
  if (songsResult.errors.length > 0) {
    console.warn('Some songs had errors:', songsResult.errors);
  }
  
  // Step 5: Migrate set lists
  if (onProgress) onProgress({ 
    step: 'setlists', 
    message: `Migrating ${oldData.setLists.length} set lists...` 
  });
  
  // Note: localStorage used "setLists", IndexedDB uses "setlists"
  const setlists = oldData.setLists.map(sl => ({
    ...sl,
    // Ensure songIds is an array
    songIds: Array.isArray(sl.songIds) ? sl.songIds : []
  }));
  
  const setlistsResult = await bulkAddSetLists(setlists);
  console.log('Set lists migrated:', setlistsResult);
  
  if (setlistsResult.errors.length > 0) {
    console.warn('Some set lists had errors:', setlistsResult.errors);
  }
  
  // Step 6: Set schema version
  if (onProgress) onProgress({ step: 'version', message: 'Setting schema version...' });
  await setSchemaVersion(1);
  
  // Step 7: Set migration timestamp
  await setMetaValue('lastMigration', new Date().toISOString());
  await setMetaValue('migratedFrom', 'localStorage');
  
  // Step 8: Mark migration as complete
  if (onProgress) onProgress({ step: 'complete', message: 'Migration complete!' });
  localStorage.setItem(MIGRATION_FLAG, 'true');
  localStorage.setItem('migrationDate', new Date().toISOString());
  
  const result = {
    success: true,
    songsAdded: songsResult.added,
    songErrors: songsResult.errors.length,
    setlistsAdded: setlistsResult.added,
    setlistErrors: setlistsResult.errors.length
  };
  
  console.log('Migration completed:', result);
  return result;
}

/**
 * Rollback migration (restore from backup and clear IndexedDB)
 */
export async function rollbackMigration() {
  console.log('Rolling back migration...');
  
  try {
    // Restore localStorage
    const restored = restoreFromBackup();
    if (!restored) {
      throw new Error('Failed to restore from backup');
    }
    
    // Clear IndexedDB
    const db = await initializeDB();
    await db.delete();
    console.log('IndexedDB cleared');
    
    // Clear migration flags
    localStorage.removeItem(MIGRATION_FLAG);
    localStorage.removeItem('migrationDate');
    
    console.log('Rollback complete');
    return { success: true };
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
}

/**
 * Clean up old backups (call after successful verification)
 */
export function cleanupOldBackups() {
  try {
    const backupTimestamp = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
    if (backupTimestamp) {
      const backupDate = new Date(backupTimestamp);
      const now = new Date();
      const daysSinceBackup = (now - backupDate) / (1000 * 60 * 60 * 24);
      
      // Keep backup for 30 days
      if (daysSinceBackup > 30) {
        localStorage.removeItem(BACKUP_KEY);
        localStorage.removeItem(BACKUP_TIMESTAMP_KEY);
        console.log('Old backup cleaned up');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to cleanup backups:', error);
    return false;
  }
}

/**
 * Get backup info
 */
export function getBackupInfo() {
  const backup = localStorage.getItem(BACKUP_KEY);
  const timestamp = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
  
  if (!backup || !timestamp) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(backup);
    return {
      timestamp,
      songs: parsed.songs?.length || 0,
      setLists: parsed.setLists?.length || 0,
      size: backup.length
    };
  } catch {
    return {
      timestamp,
      corrupted: true
    };
  }
}

/**
 * Manual migration trigger with UI feedback
 */
export async function runMigrationWithUI(updateCallback) {
  const status = await getMigrationStatus();
  
  if (!status.needsMigration) {
    console.log('No migration needed');
    return { success: true, message: 'Already migrated' };
  }
  
  try {
    const result = await migrateFromLocalStorage((progress) => {
      if (updateCallback) {
        updateCallback(progress);
      }
    });
    
    return { success: true, result };
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Attempt rollback
    try {
      await rollbackMigration();
      return {
        success: false,
        error: error.message,
        rolledBack: true
      };
    } catch (rollbackError) {
      return {
        success: false,
        error: error.message,
        rollbackFailed: true,
        rollbackError: rollbackError.message
      };
    }
  }
}

/**
 * Check if migration lock exists (for concurrent tab handling)
 */
export function checkMigrationLock() {
  const lock = localStorage.getItem('migrationInProgress');
  if (lock) {
    const lockTime = new Date(lock);
    const now = new Date();
    const minutesSinceLock = (now - lockTime) / (1000 * 60);
    
    // If lock is older than 5 minutes, consider it stale
    if (minutesSinceLock > 5) {
      localStorage.removeItem('migrationInProgress');
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Set migration lock
 */
export function setMigrationLock() {
  localStorage.setItem('migrationInProgress', new Date().toISOString());
}

/**
 * Clear migration lock
 */
export function clearMigrationLock() {
  localStorage.removeItem('migrationInProgress');
}

/**
 * Run all necessary migrations
 */
export async function runAllMigrations(onProgress) {
  const status = await getMigrationStatus();
  
  // Phase 1: localStorage to IndexedDB
  if (status.needsMigration) {
    // Check for concurrent migrations
    if (checkMigrationLock()) {
      console.log('Migration in progress in another tab, waiting...');
      return {
        success: false,
        waiting: true,
        message: 'Migration in progress in another tab'
      };
    }
    
    setMigrationLock();
    
    try {
      const result = await migrateFromLocalStorage(onProgress);
      clearMigrationLock();
      return { success: true, phase: 'localStorage', result };
    } catch (error) {
      clearMigrationLock();
      throw error;
    }
  }
  
  // Phase 2+: Future schema migrations would go here
  // Dexie handles schema upgrades automatically via version().upgrade()
  
  return { success: true, message: 'No migrations needed' };
}

