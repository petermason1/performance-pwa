import { useState, useEffect, useCallback } from 'react';
import { useMetronome } from './hooks/useMetronome';
import { AppContext } from './context/AppContext';
import {
  initializeDB,
  getAllSongs,
  getAllSetLists,
  addSong as dbAddSong,
  updateSong as dbUpdateSong,
  deleteSong as dbDeleteSong,
  getSong as dbGetSong,
  addSetList as dbAddSetList,
  updateSetList as dbUpdateSetList,
  deleteSetList as dbDeleteSetList,
  getSetList as dbGetSetList,
  exportAllData,
  importData as dbImportData
} from './utils/db.js';
import { runAllMigrations, getMigrationStatus } from './utils/migrations.js';
import { syncManager } from './lib/syncManager';
import { useBand } from './hooks/useBand';
import { supabase } from './lib/supabase';

export function AppProvider({ children }) {
  const [songs, setSongs] = useState([]);
  const [setLists, setSetLists] = useState([]);
  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('lastView');
    const allowed = ['performance', 'setlists', 'songs', 'lights'];
    return saved && allowed.includes(saved) ? saved : 'performance';
  });
  const [dbInitialized, setDbInitialized] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [migrationProgress, setMigrationProgress] = useState(null);

  // Global metronome that persists across views
  const metronomeHook = useMetronome(120);

  // Band management
  const { currentBand } = useBand();

  // Initialize database and run migrations
  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('Initializing database...');
        
        // Check if migration is needed
        const status = await getMigrationStatus();
        console.log('Migration status:', status);
        setMigrationStatus(status);
        
        if (status.needsMigration) {
          console.log('Running migration from localStorage to IndexedDB...');
          setMigrationProgress({ step: 'starting', message: 'Starting migration...' });
          
          const result = await runAllMigrations((progress) => {
            console.log('Migration progress:', progress);
            setMigrationProgress(progress);
          });
          
          console.log('Migration result:', result);
          setMigrationProgress({ step: 'complete', message: 'Migration complete!' });
          
          // Refresh migration status
          const newStatus = await getMigrationStatus();
          setMigrationStatus(newStatus);
        }
        
        // Initialize IndexedDB
        await initializeDB();
        console.log('Database initialized');
        
        // Load initial data
        await loadData();
        
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setMigrationProgress({
          step: 'error',
          message: `Error: ${error.message}`
        });
      }
    };
    
    initDB();
  }, []);

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      const [loadedSongs, loadedSetLists] = await Promise.all([
        getAllSongs(),
        getAllSetLists()
      ]);
      
      console.log('Loaded data from IndexedDB:', {
        songs: loadedSongs.length,
        setLists: loadedSetLists.length
      });
      
      setSongs(loadedSongs);
      setSetLists(loadedSetLists);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  // Sync with Supabase when band changes
  useEffect(() => {
    if (!dbInitialized || !currentBand) return;

    const syncData = async () => {
      console.log('🔄 Starting sync for band:', currentBand.name);
      
      // Sync songs and setlists
      await syncManager.syncSongs(currentBand.id);
      await syncManager.syncSetLists(currentBand.id);
      
      // Reload local data to reflect changes
      await loadData();
      
      // Subscribe to realtime updates
      syncManager.subscribeToSongs(currentBand.id, loadData);
      syncManager.subscribeToSetLists(currentBand.id, loadData);
    };

    syncData();

    // Cleanup subscriptions when band changes or component unmounts
    return () => {
      syncManager.unsubscribeAll();
    };
  }, [currentBand, dbInitialized, loadData]);

  // Save current view
  useEffect(() => {
    localStorage.setItem('lastView', currentView);
  }, [currentView]);

  // Refresh songs and set lists
  const refreshSongs = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Song operations
  const addSong = useCallback(async (song) => {
    try {
      const newSong = await dbAddSong(song);
      await refreshSongs();
      
      // Sync to Supabase if we have a band
      if (currentBand) {
        await syncManager.pushSong(newSong, currentBand.id);
      }
      
      return newSong;
    } catch (error) {
      console.error('Failed to add song:', error);
      throw error;
    }
  }, [refreshSongs, currentBand]);

  const updateSong = useCallback(async (id, updates) => {
    try {
      const updated = await dbUpdateSong(id, updates);
      await refreshSongs();
      
      // Sync to Supabase if we have a band
      if (currentBand) {
        await syncManager.pushSong(updated, currentBand.id);
      }
      
      return updated;
    } catch (error) {
      console.error('Failed to update song:', error);
      throw error;
    }
  }, [refreshSongs, currentBand]);

  const deleteSong = useCallback(async (id) => {
    try {
      await dbDeleteSong(id);
      await refreshSongs();
      
      // Delete from Supabase if we have a band
      if (currentBand) {
        const { error } = await supabase
          .from('songs')
          .delete()
          .eq('id', id);
        
        if (error) console.error('Failed to delete song from Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to delete song:', error);
      throw error;
    }
  }, [refreshSongs, currentBand]);

  const getSong = useCallback(async (id) => {
    try {
      return await dbGetSong(id);
    } catch (error) {
      console.error('Failed to get song:', error);
      return null;
    }
  }, []);

  // Set list operations
  const addSetList = useCallback(async (setList) => {
    try {
      const newSetList = await dbAddSetList(setList);
      await refreshSongs();
      
      // Sync to Supabase if we have a band
      if (currentBand) {
        await syncManager.pushSetList(newSetList, currentBand.id);
      }
      
      return newSetList;
    } catch (error) {
      console.error('Failed to add set list:', error);
      throw error;
    }
  }, [refreshSongs, currentBand]);

  const updateSetList = useCallback(async (id, updates) => {
    try {
      const updated = await dbUpdateSetList(id, updates);
      await refreshSongs();
      
      // Sync to Supabase if we have a band
      if (currentBand) {
        await syncManager.pushSetList(updated, currentBand.id);
      }
      
      return updated;
    } catch (error) {
      console.error('Failed to update set list:', error);
      throw error;
    }
  }, [refreshSongs, currentBand]);

  const deleteSetList = useCallback(async (id) => {
    try {
      await dbDeleteSetList(id);
      await refreshSongs();
      
      // Delete from Supabase if we have a band
      if (currentBand) {
        const { error } = await supabase
          .from('setlists')
          .delete()
          .eq('id', id);
        
        if (error) console.error('Failed to delete setlist from Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to delete set list:', error);
      throw error;
    }
  }, [refreshSongs, currentBand]);

  const getSetList = useCallback(async (id) => {
    try {
      return await dbGetSetList(id);
    } catch (error) {
      console.error('Failed to get set list:', error);
      return null;
    }
  }, []);

  // Export/Import operations
  const exportData = useCallback(async () => {
    try {
      return await exportAllData();
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }, []);

  const importDataFromFile = useCallback(async (data, mode = 'merge') => {
    try {
      const result = await dbImportData(data, mode);
      await refreshSongs();
      return result;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }, [refreshSongs]);

  const contextValue = {
    songs,
    setLists,
    currentView,
    setCurrentView,
    dbInitialized,
    migrationStatus,
    migrationProgress,
    // Song operations
    addSong,
    updateSong,
    deleteSong,
    getSong,
    // Set list operations
    addSetList,
    updateSetList,
    deleteSetList,
    getSetList,
    // Data operations
    refreshSongs,
    exportData,
    importData: importDataFromFile,
    // Global metronome that persists across views
    metronome: metronomeHook
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

