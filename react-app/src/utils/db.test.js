// Unit tests for database utilities
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateSong, validateSetList } from './db.js'

describe('validateSong', () => {
  it('should pass validation for valid song', () => {
    const song = {
      title: 'Test Song',
      artist: 'Test Artist',
      bpm: 120
    }
    
    const errors = validateSong(song)
    expect(errors).toHaveLength(0)
  })
  
  it('should fail if title is missing', () => {
    const song = {
      title: '',
      artist: 'Test Artist',
      bpm: 120
    }
    
    const errors = validateSong(song)
    expect(errors).toContain('Title is required')
  })
  
  it('should fail if artist is missing', () => {
    const song = {
      title: 'Test Song',
      artist: '',
      bpm: 120
    }
    
    const errors = validateSong(song)
    expect(errors).toContain('Artist is required')
  })
  
  it('should fail if BPM is out of range', () => {
    const song1 = {
      title: 'Test Song',
      artist: 'Test Artist',
      bpm: 30
    }
    
    const errors1 = validateSong(song1)
    expect(errors1).toContain('BPM must be between 40 and 300')
    
    const song2 = {
      title: 'Test Song',
      artist: 'Test Artist',
      bpm: 350
    }
    
    const errors2 = validateSong(song2)
    expect(errors2).toContain('BPM must be between 40 and 300')
  })
  
  it('should validate MIDI program range', () => {
    const song = {
      title: 'Test Song',
      artist: 'Test Artist',
      bpm: 120,
      midi: { program: 128 }
    }
    
    const errors = validateSong(song)
    expect(errors).toContain('MIDI program must be between 0 and 127')
  })
  
  it('should validate lyrics is an array', () => {
    const song = {
      title: 'Test Song',
      artist: 'Test Artist',
      bpm: 120,
      lyrics: 'not an array'
    }
    
    const errors = validateSong(song)
    expect(errors).toContain('Lyrics must be an array')
  })
})

describe('validateSetList', () => {
  it('should pass validation for valid set list', () => {
    const setlist = {
      name: 'My Set List',
      songIds: ['song1', 'song2']
    }
    
    const errors = validateSetList(setlist)
    expect(errors).toHaveLength(0)
  })
  
  it('should fail if name is missing', () => {
    const setlist = {
      name: '',
      songIds: ['song1']
    }
    
    const errors = validateSetList(setlist)
    expect(errors).toContain('Set list name is required')
  })
  
  it('should fail if songIds is not an array', () => {
    const setlist = {
      name: 'My Set List',
      songIds: 'not an array'
    }
    
    const errors = validateSetList(setlist)
    expect(errors).toContain('songIds must be an array')
  })
})

