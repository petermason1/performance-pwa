import { describe, it, expect, beforeEach } from 'vitest'
import { DataStore, parseLyrics, formatLyrics } from './models.js'

describe('DataStore', () => {
  let dataStore

  beforeEach(() => {
    localStorage.clear()
    dataStore = new DataStore()
  })

  it('should initialize with empty arrays when no data exists', () => {
    expect(dataStore.songs).toEqual([])
    expect(dataStore.setLists).toEqual([])
  })

  it('should load existing data from localStorage', () => {
    const testData = {
      songs: [{ id: '1', name: 'Test Song' }],
      setLists: [{ id: '1', name: 'Test Set' }]
    }
    localStorage.setItem('performanceApp', JSON.stringify(testData))
    
    const newStore = new DataStore()
    expect(newStore.songs).toHaveLength(1)
    expect(newStore.setLists).toHaveLength(1)
  })

  it('should add a song and save to localStorage', () => {
    const song = {
      name: 'New Song',
      artist: 'Artist',
      bpm: 120
    }
    
    const added = dataStore.addSong(song)
    
    expect(added.id).toBeDefined()
    expect(added.createdAt).toBeDefined()
    expect(dataStore.songs).toHaveLength(1)
    
    // Verify it's saved
    const saved = JSON.parse(localStorage.getItem('performanceApp'))
    expect(saved.songs).toHaveLength(1)
    expect(saved.songs[0].name).toBe('New Song')
  })

  it('should update an existing song', () => {
    const song = dataStore.addSong({ name: 'Original', bpm: 100 })
    
    const updated = dataStore.updateSong(song.id, { bpm: 120 })
    
    expect(updated.bpm).toBe(120)
    expect(updated.name).toBe('Original')
    expect(dataStore.songs[0].bpm).toBe(120)
  })

  it('should delete a song and remove from set lists', () => {
    const song1 = dataStore.addSong({ name: 'Song 1' })
    const song2 = dataStore.addSong({ name: 'Song 2' })
    
    expect(dataStore.songs).toHaveLength(2) // Verify both added
    
    const setList = dataStore.addSetList({
      name: 'Set List',
      songIds: [song1.id, song2.id]
    })
    
    expect(dataStore.getSetList(setList.id).songIds).toHaveLength(2) // Verify both in set list
    
    dataStore.deleteSong(song1.id)
    
    expect(dataStore.songs).toHaveLength(1)
    expect(dataStore.songs[0].id).toBe(song2.id)
    expect(dataStore.getSetList(setList.id).songIds).not.toContain(song1.id)
    expect(dataStore.getSetList(setList.id).songIds).toContain(song2.id)
  })

  it('should add and retrieve set lists', () => {
    const setList = dataStore.addSetList({
      name: 'My Set List',
      songIds: []
    })
    
    expect(setList.id).toBeDefined()
    expect(dataStore.setLists).toHaveLength(1)
    
    const retrieved = dataStore.getSetList(setList.id)
    expect(retrieved.name).toBe('My Set List')
  })

  it('should update set list', () => {
    const setList = dataStore.addSetList({ name: 'Original' })
    
    const updated = dataStore.updateSetList(setList.id, { name: 'Updated' })
    
    expect(updated.name).toBe('Updated')
    expect(dataStore.setLists[0].name).toBe('Updated')
  })

  it('should delete set list', () => {
    const setList = dataStore.addSetList({ name: 'To Delete' })
    dataStore.deleteSetList(setList.id)
    
    expect(dataStore.setLists).toHaveLength(0)
    expect(dataStore.getSetList(setList.id)).toBeUndefined()
  })
})

describe('parseLyrics', () => {
  it('should parse lyrics with timestamps', () => {
    const lyricsText = `[00:10.50] First line
[00:15.75] Second line
[00:20.00] Third line`
    
    const parsed = parseLyrics(lyricsText)
    
    expect(parsed).toHaveLength(3)
    expect(parsed[0].time).toBe(10.5)
    expect(parsed[0].text).toBe('First line')
    expect(parsed[1].time).toBe(15.75)
    expect(parsed[2].time).toBe(20.0)
  })

  it('should handle empty or invalid lyrics', () => {
    expect(parseLyrics('')).toEqual([])
    expect(parseLyrics(null)).toEqual([])
    expect(parseLyrics('Invalid format')).toEqual([])
  })

  it('should sort lyrics by time', () => {
    const lyricsText = `[00:20.00] Later
[00:10.00] Earlier`
    
    const parsed = parseLyrics(lyricsText)
    expect(parsed[0].time).toBe(10.0)
    expect(parsed[1].time).toBe(20.0)
  })
})

describe('formatLyrics', () => {
  it('should format parsed lyrics back to text', () => {
    const lyrics = [
      { time: 10.5, text: 'First line' },
      { time: 15.75, text: 'Second line' }
    ]
    
    const formatted = formatLyrics(lyrics)
    
    expect(formatted).toContain('[00:10.50] First line')
    expect(formatted).toContain('[00:15.75] Second line')
  })

  it('should handle empty arrays', () => {
    expect(formatLyrics([])).toBe('')
    expect(formatLyrics(null)).toBe('')
  })
})
