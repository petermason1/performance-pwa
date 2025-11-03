// Data Models and Storage

class DataStore {
    constructor() {
        this.load();
    }

    load() {
        const stored = localStorage.getItem('performanceApp');
        if (stored) {
            const data = JSON.parse(stored);
            this.songs = data.songs || [];
            this.setLists = data.setLists || [];
        } else {
            this.songs = [];
            this.setLists = [];
        }
    }

    save() {
        const data = {
            songs: this.songs,
            setLists: this.setLists
        };
        localStorage.setItem('performanceApp', JSON.stringify(data));
        console.log('DataStore saved:', { songs: this.songs.length, setLists: this.setLists.length });
    }

    // Songs
    addSong(song) {
        song.id = song.id || Date.now().toString();
        song.createdAt = song.createdAt || new Date().toISOString();
        this.songs.push(song);
        this.save();
        return song;
    }

    updateSong(id, updates) {
        const index = this.songs.findIndex(s => s.id === id);
        if (index !== -1) {
            this.songs[index] = { ...this.songs[index], ...updates };
            this.save();
            return this.songs[index];
        }
        return null;
    }

    deleteSong(id) {
        this.songs = this.songs.filter(s => s.id !== id);
        // Remove from all set lists
        this.setLists.forEach(setList => {
            setList.songIds = setList.songIds.filter(songId => songId !== id);
        });
        this.save();
    }

    getSong(id) {
        return this.songs.find(s => s.id === id);
    }

    getAllSongs() {
        return this.songs;
    }

    // Set Lists
    addSetList(setList) {
        setList.id = setList.id || Date.now().toString();
        setList.createdAt = setList.createdAt || new Date().toISOString();
        this.setLists.push(setList);
        this.save();
        return setList;
    }

    updateSetList(id, updates) {
        const index = this.setLists.findIndex(sl => sl.id === id);
        if (index !== -1) {
            this.setLists[index] = { ...this.setLists[index], ...updates };
            this.save();
            return this.setLists[index];
        }
        return null;
    }

    deleteSetList(id) {
        this.setLists = this.setLists.filter(sl => sl.id !== id);
        this.save();
    }

    getSetList(id) {
        return this.setLists.find(sl => sl.id === id);
    }

    getAllSetLists() {
        return this.setLists;
    }
}

// Parse lyrics with timestamps
function parseLyrics(lyricsText) {
    if (!lyricsText) return [];
    
    const lines = lyricsText.split('\n');
    const parsed = [];
    
    lines.forEach(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\]\s*(.+)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const centiseconds = parseInt(match[3]);
            const text = match[4].trim();
            
            const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;
            parsed.push({ time: timeInSeconds, text });
        }
    });
    
    return parsed.sort((a, b) => a.time - b.time);
}

// Format lyrics for display
function formatLyrics(lyrics) {
    if (!lyrics || lyrics.length === 0) return '';
    return lyrics.map(l => {
        const minutes = Math.floor(l.time / 60);
        const seconds = Math.floor(l.time % 60);
        const centiseconds = Math.floor((l.time % 1) * 100);
        return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}] ${l.text}`;
    }).join('\n');
}

// Export class for React
export { DataStore, parseLyrics, formatLyrics };

