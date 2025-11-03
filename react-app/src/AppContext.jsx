import { useState, useEffect } from 'react';
import { DataStore } from './models.js';
import { useMetronome } from './hooks/useMetronome';
import { AppContext } from './context/AppContext';

export function AppProvider({ children }) {
  const [dataStore] = useState(() => new DataStore());
  const [songs, setSongs] = useState([]);
  const [setLists, setSetLists] = useState([]);
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('lastView') || 'performance';
  });

  // Global metronome that persists across views
  const metronomeHook = useMetronome(120);

  // Load data on mount
  useEffect(() => {
    const loadData = () => {
      dataStore.load();
      const loadedSongs = dataStore.getAllSongs();
      const loadedSetLists = dataStore.getAllSetLists();
      
      // Log for debugging
      console.log('Loading data from localStorage:', {
        songs: loadedSongs.length,
        setLists: loadedSetLists.length,
        rawData: localStorage.getItem('performanceApp')
      });
      
      setSongs(loadedSongs);
      setSetLists(loadedSetLists);
      
      // If no data found, try to recover from any backup or old format
      if (loadedSongs.length === 0 && loadedSetLists.length === 0) {
        console.warn('No data found in localStorage. Checking for backup...');
        // Check if there's any other localStorage keys with data
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('performance') || key.includes('song')) {
            console.log('Found potential data key:', key);
            try {
              const data = JSON.parse(localStorage.getItem(key));
              if (data && (data.songs || data.setLists)) {
                console.log('Found data in key:', key, data);
              }
            } catch {
              // Not JSON, skip
            }
          }
        }
      }
    };
    loadData();
    
    // Listen for storage changes (when data is imported)
    const handleStorageChange = (e) => {
      if (e.key === 'performanceApp' || e.key === null) {
        console.log('Storage changed, reloading data...');
        loadData();
      }
    };
    
    // Listen for custom refresh event
    const handleRefreshEvent = () => {
      console.log('Refresh event received, reloading data...');
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('refreshData', handleRefreshEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('refreshData', handleRefreshEvent);
    };
  }, [dataStore]);

  // Save current view
  useEffect(() => {
    localStorage.setItem('lastView', currentView);
  }, [currentView]);

  // Note: Metronome cleanup is handled by useMetronome hook's cleanup
  // It will only stop when the component unmounts (app closes)

  const refreshSongs = () => {
    dataStore.load();
    setSongs(dataStore.getAllSongs());
    setSetLists(dataStore.getAllSetLists());
  };

  const addSong = (song) => {
    const newSong = dataStore.addSong(song);
    refreshSongs();
    return newSong;
  };

  const updateSong = (id, updates) => {
    const updated = dataStore.updateSong(id, updates);
    refreshSongs();
    return updated;
  };

  const deleteSong = (id) => {
    dataStore.deleteSong(id);
    refreshSongs();
  };

  const addSetList = (setList) => {
    const newSetList = dataStore.addSetList(setList);
    refreshSongs();
    return newSetList;
  };

  const updateSetList = (id, updates) => {
    const updated = dataStore.updateSetList(id, updates);
    refreshSongs();
    return updated;
  };

  const deleteSetList = (id) => {
    dataStore.deleteSetList(id);
    refreshSongs();
  };

  const contextValue = {
    songs,
    setLists,
    dataStore,
    currentView,
    setCurrentView,
    addSong,
    updateSong,
    deleteSong,
    addSetList,
    updateSetList,
    deleteSetList,
    refreshSongs,
    getSetList: (id) => dataStore.getSetList(id),
    getSong: (id) => dataStore.getSong(id),
    // Global metronome that persists across views
    metronome: metronomeHook
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

