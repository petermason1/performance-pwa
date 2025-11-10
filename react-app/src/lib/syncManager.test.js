// Tests for SyncManager
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { syncManager } from './syncManager'
import db from '../utils/db'
import { supabase } from './supabase'

// Mock dependencies
vi.mock('../utils/db', () => ({
  default: {
    songs: {
      toArray: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    },
    setLists: {
      toArray: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
  }
}))

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null
        }))
      })),
      upsert: vi.fn(() => ({
        data: null,
        error: null
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        error: null
      }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({
          unsubscribe: vi.fn()
        }))
      }))
    }))
  }
}))

describe('SyncManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    syncManager.realtimeSubscriptions = []
  })

  describe('mapRemoteToLocal', () => {
    it('should map remote song to local format', () => {
      const remoteSong = {
        id: '123',
        name: 'Test Song',
        artist: 'Test Artist',
        bpm: 120,
        time_signature: '4/4',
        notes: 'Test lyrics',
        midi_preset: 5,
        accent_pattern: [1, 0, 0, 0],
        updated_at: '2024-01-01T00:00:00Z'
      }

      const local = syncManager.mapRemoteToLocal(remoteSong)

      expect(local).toEqual({
        id: '123',
        name: 'Test Song',
        artist: 'Test Artist',
        bpm: 120,
        timeSignature: '4/4',
        lyrics: 'Test lyrics',
        helixPreset: 5,
        accentPattern: [1, 0, 0, 0],
        updatedAt: '2024-01-01T00:00:00Z'
      })
    })
  })

  describe('mapLocalToRemote', () => {
    it('should map local song to remote format', () => {
      const localSong = {
        id: '123',
        name: 'Test Song',
        artist: 'Test Artist',
        bpm: 120,
        timeSignature: '4/4',
        lyrics: 'Test lyrics',
        helixPreset: 5,
        accentPattern: [1, 0, 0, 0]
      }

      const remote = syncManager.mapLocalToRemote(localSong, 'band-123')

      expect(remote).toMatchObject({
        id: '123',
        band_id: 'band-123',
        name: 'Test Song',
        artist: 'Test Artist',
        bpm: 120,
        time_signature: '4/4',
        notes: 'Test lyrics',
        midi_preset: 5,
        accent_pattern: [1, 0, 0, 0]
      })
      expect(remote.updated_at).toBeDefined()
    })
  })

  describe('mapRemoteSetListToLocal', () => {
    it('should map remote setlist to local format with sorted songs', () => {
      const remoteSetList = {
        id: 'setlist-123',
        name: 'Test Setlist',
        description: 'Test description',
        updated_at: '2024-01-01T00:00:00Z',
        setlist_songs: [
          { song_id: 'song-2', position: 1 },
          { song_id: 'song-1', position: 0 },
          { song_id: 'song-3', position: 2 }
        ]
      }

      const local = syncManager.mapRemoteSetListToLocal(remoteSetList)

      expect(local).toEqual({
        id: 'setlist-123',
        name: 'Test Setlist',
        description: 'Test description',
        songIds: ['song-1', 'song-2', 'song-3'],
        updatedAt: '2024-01-01T00:00:00Z'
      })
    })

    it('should handle setlist with no songs', () => {
      const remoteSetList = {
        id: 'setlist-123',
        name: 'Test Setlist',
        description: null,
        updated_at: '2024-01-01T00:00:00Z',
        setlist_songs: null
      }

      const local = syncManager.mapRemoteSetListToLocal(remoteSetList)

      expect(local.songIds).toEqual([])
    })
  })

  describe('unsubscribeAll', () => {
    it('should unsubscribe from all realtime subscriptions', () => {
      const mockUnsubscribe = vi.fn()
      syncManager.realtimeSubscriptions = [
        { unsubscribe: mockUnsubscribe },
        { unsubscribe: mockUnsubscribe }
      ]

      syncManager.unsubscribeAll()

      expect(mockUnsubscribe).toHaveBeenCalledTimes(2)
      expect(syncManager.realtimeSubscriptions).toHaveLength(0)
    })
  })
})

