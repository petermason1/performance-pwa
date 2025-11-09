// Data Models and Storage

export interface Lyric {
  time: number;
  text: string;
}

export interface Song {
  id: string;
  name: string;
  artist?: string;
  bpm: number;
  timeSignature?: number;
  accentPattern?: boolean[] | null;
  polyrhythm?: {
    pattern: number[];
    name: string;
  } | null;
  lyrics?: Lyric[];
  duration?: number;
  helixPreset?: string;
  helixPresetNumber?: number;
  createdAt?: string;
}

export interface SetList {
  id: string;
  name: string;
  songIds: string[];
  createdAt?: string;
}

interface StoredData {
  songs: Song[];
  setLists: SetList[];
}

export class DataStore {
  songs: Song[];
  setLists: SetList[];

  constructor() {
    this.songs = [];
    this.setLists = [];
    this.load();
  }

  load(): void {
    const stored = localStorage.getItem('performanceApp');
    if (stored) {
      const data: StoredData = JSON.parse(stored);
      this.songs = data.songs || [];
      this.setLists = data.setLists || [];
    } else {
      this.songs = [];
      this.setLists = [];
    }
  }

  save(): void {
    const data: StoredData = {
      songs: this.songs,
      setLists: this.setLists
    };
    localStorage.setItem('performanceApp', JSON.stringify(data));
    console.log('DataStore saved:', { songs: this.songs.length, setLists: this.setLists.length });
  }

  // Songs
  addSong(song: Partial<Song>): Song {
    const newSong: Song = {
      id: song.id || Date.now().toString(),
      name: song.name || '',
      artist: song.artist,
      bpm: song.bpm || 120,
      timeSignature: song.timeSignature,
      accentPattern: song.accentPattern,
      polyrhythm: song.polyrhythm,
      lyrics: song.lyrics,
      duration: song.duration,
      helixPreset: song.helixPreset,
      helixPresetNumber: song.helixPresetNumber,
      createdAt: song.createdAt || new Date().toISOString()
    };
    this.songs.push(newSong);
    this.save();
    return newSong;
  }

  updateSong(id: string, updates: Partial<Song>): Song | null {
    const index = this.songs.findIndex(s => s.id === id);
    if (index !== -1) {
      this.songs[index] = { ...this.songs[index]!, ...updates };
      this.save();
      return this.songs[index]!;
    }
    return null;
  }

  deleteSong(id: string): void {
    this.songs = this.songs.filter(s => s.id !== id);
    // Remove from all set lists
    this.setLists.forEach(setList => {
      setList.songIds = setList.songIds.filter(songId => songId !== id);
    });
    this.save();
  }

  getSong(id: string): Song | undefined {
    return this.songs.find(s => s.id === id);
  }

  getAllSongs(): Song[] {
    return this.songs;
  }

  // Set Lists
  addSetList(setList: Partial<SetList>): SetList {
    const newSetList: SetList = {
      id: setList.id || Date.now().toString(),
      name: setList.name || '',
      songIds: setList.songIds || [],
      createdAt: setList.createdAt || new Date().toISOString()
    };
    this.setLists.push(newSetList);
    this.save();
    return newSetList;
  }

  updateSetList(id: string, updates: Partial<SetList>): SetList | null {
    const index = this.setLists.findIndex(sl => sl.id === id);
    if (index !== -1) {
      this.setLists[index] = { ...this.setLists[index]!, ...updates };
      this.save();
      return this.setLists[index]!;
    }
    return null;
  }

  deleteSetList(id: string): void {
    this.setLists = this.setLists.filter(sl => sl.id !== id);
    this.save();
  }

  getSetList(id: string): SetList | undefined {
    return this.setLists.find(sl => sl.id === id);
  }

  getAllSetLists(): SetList[] {
    return this.setLists;
  }
}

// Parse lyrics with timestamps
export function parseLyrics(lyricsText: string): Lyric[] {
  if (!lyricsText) return [];

  const lines = lyricsText.split('\n');
  const parsed: Lyric[] = [];

  lines.forEach(line => {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\]\s*(.+)/);
    if (match) {
      const minutes = parseInt(match[1]!, 10);
      const seconds = parseInt(match[2]!, 10);
      const centiseconds = parseInt(match[3]!, 10);
      const text = match[4]!.trim();

      const timeInSeconds = minutes * 60 + seconds + centiseconds / 100;
      parsed.push({ time: timeInSeconds, text });
    }
  });

  return parsed.sort((a, b) => a.time - b.time);
}

// Format lyrics for display
export function formatLyrics(lyrics: Lyric[]): string {
  if (!lyrics || lyrics.length === 0) return '';
  return lyrics.map(l => {
    const minutes = Math.floor(l.time / 60);
    const seconds = Math.floor(l.time % 60);
    const centiseconds = Math.floor((l.time % 1) * 100);
    return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}] ${l.text}`;
  }).join('\n');
}

