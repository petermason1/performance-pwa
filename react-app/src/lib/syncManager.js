import { supabase } from './supabase'
import db from '../utils/db'
import { logger } from '../utils/logger'

const sanitizeInteger = (value, { min, max, fallback }) => {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  let next = parsed

  if (typeof min === 'number') {
    next = Math.max(next, min)
  }

  if (typeof max === 'number') {
    next = Math.min(next, max)
  }

  return next
}

const normalizeTimeSignature = (value) => {
  if (Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parts = value.split(/[\\/]/).map(segment => Number.parseInt(segment, 10))
    if (parts.length > 0 && Number.isFinite(parts[0])) {
      return parts[0]
    }
  }

  return 4
}

const coerceAccentPattern = (pattern) => {
  if (!Array.isArray(pattern)) {
    return null
  }

  return pattern.map(Boolean)
}

class SyncManager {
  constructor() {
    this.syncQueue = []
    this.isSyncing = false
    this.realtimeSubscriptions = []
  }

  // ============================================
  // SONGS SYNC
  // ============================================

  // Fetch example songs from the Example Songs Library band
  async fetchExampleSongs() {
    if (!supabase) {
      console.log('⏭️ Skipping example songs fetch (offline)')
      return { success: false }
    }

    const EXAMPLE_BAND_ID = '00000000-0000-0000-0000-000000000001'

    try {
      console.log('📚 Fetching example songs from Supabase')

      const { data: exampleSongs, error } = await supabase
        .from('songs')
        .select('*')
        .eq('band_id', EXAMPLE_BAND_ID)

      if (error) throw error

      console.log('📥 Fetched', exampleSongs.length, 'example songs from Supabase')

      // Store example songs in IndexedDB with a special prefix to distinguish them
      for (const remoteSong of exampleSongs) {
        const localSong = {
          ...this.mapRemoteToLocal(remoteSong),
          _isExample: true, // Mark as example song
          _exampleBandId: EXAMPLE_BAND_ID
        }
        await db.songs.put(localSong)
      }

      logger.log('✅ Example songs loaded')
      return { success: true, count: exampleSongs.length }
    } catch (error) {
      logger.error('❌ Failed to fetch example songs:', error)
      return { success: false, error }
    }
  }

  async syncSongs(bandId) {
    if (!bandId || !supabase) {
      logger.log('⏭️ Skipping song sync (no band or offline)')
      return { success: false }
    }

    try {
      logger.log('🔄 Syncing songs for band:', bandId)

      // 1. Fetch remote songs from Supabase
      const { data: remoteSongs, error } = await supabase
        .from('songs')
        .select('*')
        .eq('band_id', bandId)

      if (error) throw error

      logger.log('📥 Fetched', remoteSongs.length, 'songs from Supabase')

      // 2. Get local songs from IndexedDB
      const localSongs = await db.songs.toArray()
      logger.log('💾 Found', localSongs.length, 'local songs')

      // 3. Merge: remote songs take priority (update local)
      for (const remoteSong of remoteSongs) {
        const localSong = this.mapRemoteToLocal(remoteSong)
        await db.songs.put(localSong)
      }

      // 4. Push local songs that don't exist remotely
      for (const localSong of localSongs) {
        const existsRemotely = remoteSongs.some(rs => rs.id === localSong.id)
        if (!existsRemotely && !localSong._pendingSync) {
          // This is a new local song, push to Supabase
          await this.pushSong(localSong, bandId)
        }
      }

      logger.log('✅ Song sync complete')
      return { success: true }
    } catch (error) {
      logger.error('❌ Song sync failed:', error)
      return { success: false, error }
    }
  }

  async pushSong(song, bandId, retryCount = 0) {
    if (!supabase) {
      // Mark for retry when online
      song._pendingSync = true
      await db.songs.put(song)
      return { error: 'Offline - will sync when connection restored' }
    }

    try {
      const remoteSong = this.mapLocalToRemote(song, bandId)
      
      const { error } = await supabase
        .from('songs')
        .upsert(remoteSong, { onConflict: 'id' })

      if (!error) {
        // Remove sync flag
        delete song._pendingSync
        await db.songs.put(song)
        logger.log('✅ Pushed song:', song.name)
        return { success: true }
      }

      // Retry on network errors
      if (retryCount < 2 && (error.message?.includes('fetch') || error.message?.includes('network'))) {
        logger.log(`Retrying song push (attempt ${retryCount + 1})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return this.pushSong(song, bandId, retryCount + 1)
      }

      return { error }
    } catch (error) {
      logger.error('❌ Failed to push song:', error)
      
      // Mark for retry if it's a network error
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        song._pendingSync = true
        await db.songs.put(song)
      }
      
      return { error }
    }
  }

  mapRemoteToLocal(remoteSong) {
    const safeName = (remoteSong.name || '').trim() || 'Untitled Song'
    const safeArtist = (remoteSong.artist || '').trim() || 'Unknown Artist'
    const safeBpm = sanitizeInteger(remoteSong.bpm, { min: 40, max: 300, fallback: 120 })
    const safeTimeSignature = normalizeTimeSignature(remoteSong.time_signature)
    const safeLyrics = typeof remoteSong.notes === 'string' ? remoteSong.notes : ''
    const safeHelixPresetNumber = sanitizeInteger(remoteSong.midi_preset, { min: 0, max: 127, fallback: null })
    const accentPattern = coerceAccentPattern(remoteSong.accent_pattern)

    return {
      id: remoteSong.id,
      name: safeName,
      title: safeName,
      artist: safeArtist,
      bpm: safeBpm,
      timeSignature: safeTimeSignature,
      key: remoteSong.key || null,
      lyrics: safeLyrics,
      notes: safeLyrics,
      helixPreset: remoteSong.helix_preset_name || remoteSong.helix_preset || null,
      helixPresetNumber: safeHelixPresetNumber,
      accentPattern,
      updatedAt: remoteSong.updated_at || new Date().toISOString(),
      createdAt: remoteSong.created_at || new Date().toISOString()
    }
  }

  mapLocalToRemote(song, bandId) {
    const safeBpm = sanitizeInteger(song.bpm, { min: 40, max: 300, fallback: 120 })
    const safeTimeSignature = normalizeTimeSignature(song.timeSignature)
    const safeHelixPresetNumber = song.helixPresetNumber === null || song.helixPresetNumber === ''
      ? null
      : sanitizeInteger(song.helixPresetNumber, { min: 0, max: 127, fallback: null })
    const safeAccentPattern = coerceAccentPattern(song.accentPattern)

    return {
      id: song.id,
      band_id: bandId,
      name: song.name || song.title || 'Untitled Song',
      artist: song.artist || 'Unknown Artist',
      bpm: safeBpm,
      time_signature: safeTimeSignature,
      notes: typeof song.lyrics === 'string' ? song.lyrics : '',
      helix_preset_name: song.helixPreset ?? null,
      midi_preset: safeHelixPresetNumber,
      accent_pattern: safeAccentPattern,
      updated_at: new Date().toISOString()
    }
  }

  // ============================================
  // SETLISTS SYNC
  // ============================================

  async syncSetLists(bandId) {
    if (!bandId || !supabase) {
      logger.log('⏭️ Skipping setlist sync (no band or offline)')
      return { success: false }
    }

    try {
      logger.log('🔄 Syncing setlists for band:', bandId)

      // 1. Fetch remote setlists
      const { data: remoteSetLists, error: setlistsError } = await supabase
        .from('setlists')
        .select('*, setlist_songs(*)')
        .eq('band_id', bandId)

      if (setlistsError) throw setlistsError

      logger.log('📥 Fetched', remoteSetLists.length, 'setlists from Supabase')

      // 2. Get local setlists
      const localSetLists = await db.setLists.toArray()
      logger.log('💾 Found', localSetLists.length, 'local setlists')

      // 3. Merge: remote takes priority
      for (const remoteSetList of remoteSetLists) {
        const localSetList = this.mapRemoteSetListToLocal(remoteSetList)
        await db.setLists.put(localSetList)
      }

      // 4. Push local setlists that don't exist remotely
      for (const localSetList of localSetLists) {
        const existsRemotely = remoteSetLists.some(rs => rs.id === localSetList.id)
        if (!existsRemotely && !localSetList._pendingSync) {
          await this.pushSetList(localSetList, bandId)
        }
      }

      logger.log('✅ Setlist sync complete')
      return { success: true }
    } catch (error) {
      logger.error('❌ Setlist sync failed:', error)
      return { success: false, error }
    }
  }

  async pushSetList(setList, bandId, retryCount = 0) {
    if (!supabase) {
      // Mark for retry when online
      setList._pendingSync = true
      await db.setLists.put(setList)
      return { error: 'Offline - will sync when connection restored' }
    }

    try {
      // 1. Insert/update setlist
      const { data: remoteSetList, error: setlistError } = await supabase
        .from('setlists')
        .upsert({
          id: setList.id,
          band_id: bandId,
          name: setList.name,
          description: setList.description || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single()

      if (setlistError) throw setlistError

      // 2. Delete existing setlist_songs
      await supabase
        .from('setlist_songs')
        .delete()
        .eq('setlist_id', setList.id)

      // 3. Insert new setlist_songs
      if (setList.songIds && setList.songIds.length > 0) {
        const setlistSongs = setList.songIds.map((songId, index) => ({
          setlist_id: setList.id,
          song_id: songId,
          position: index
        }))

        const { error: songsError } = await supabase
          .from('setlist_songs')
          .insert(setlistSongs)

        if (songsError) throw songsError
      }

      // Remove sync flag
      delete setList._pendingSync
      await db.setLists.put(setList)
      logger.log('✅ Pushed setlist:', setList.name)

      return { success: true }
    } catch (error) {
      logger.error('❌ Failed to push setlist:', error)
      
      // Retry on network errors
      if (retryCount < 2 && (error.message?.includes('fetch') || error.message?.includes('network'))) {
        logger.log(`Retrying setlist push (attempt ${retryCount + 1})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return this.pushSetList(setList, bandId, retryCount + 1)
      }
      
      // Mark for retry if it's a network error
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        setList._pendingSync = true
        await db.setLists.put(setList)
      }
      
      return { error }
    }
  }

  mapRemoteSetListToLocal(remoteSetList) {
    const songIds = remoteSetList.setlist_songs
      ? remoteSetList.setlist_songs
          .sort((a, b) => a.position - b.position)
          .map(ss => ss.song_id)
      : []

    return {
      id: remoteSetList.id,
      name: remoteSetList.name,
      description: remoteSetList.description,
      songIds: songIds,
      updatedAt: remoteSetList.updated_at
    }
  }

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================

  subscribeToSongs(bandId, onChange) {
    if (!supabase) return null

    const subscription = supabase
      .channel(`songs:${bandId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'songs',
          filter: `band_id=eq.${bandId}`
        },
        async (payload) => {
          logger.log('🔔 Song changed:', payload.eventType, payload.new?.name || payload.old?.id)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            await db.songs.put(this.mapRemoteToLocal(payload.new))
          } else if (payload.eventType === 'DELETE') {
            await db.songs.delete(payload.old.id)
          }
          
          onChange?.()
        }
      )
      .subscribe()

    this.realtimeSubscriptions.push(subscription)
    logger.log('👂 Subscribed to song changes')
    return subscription
  }

  subscribeToSetLists(bandId, onChange) {
    if (!supabase) return null

    const subscription = supabase
      .channel(`setlists:${bandId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'setlists',
          filter: `band_id=eq.${bandId}`
        },
        async (payload) => {
          logger.log('🔔 Setlist changed:', payload.eventType, payload.new?.name || payload.old?.id)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // Fetch full setlist with songs
            const { data } = await supabase
              .from('setlists')
              .select('*, setlist_songs(*)')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              await db.setLists.put(this.mapRemoteSetListToLocal(data))
            }
          } else if (payload.eventType === 'DELETE') {
            await db.setLists.delete(payload.old.id)
          }
          
          onChange?.()
        }
      )
      .subscribe()

    this.realtimeSubscriptions.push(subscription)
    logger.log('👂 Subscribed to setlist changes')
    return subscription
  }

  unsubscribeAll() {
    this.realtimeSubscriptions.forEach(sub => {
      sub.unsubscribe()
    })
    this.realtimeSubscriptions = []
    logger.log('🔇 Unsubscribed from all realtime channels')
  }
}

export const syncManager = new SyncManager()

