import { supabase } from './supabase'
import db from '../utils/db'

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

      console.log('✅ Example songs loaded')
      return { success: true, count: exampleSongs.length }
    } catch (error) {
      console.error('❌ Failed to fetch example songs:', error)
      return { success: false, error }
    }
  }

  async syncSongs(bandId) {
    if (!bandId || !supabase) {
      console.log('⏭️ Skipping song sync (no band or offline)')
      return { success: false }
    }

    try {
      console.log('🔄 Syncing songs for band:', bandId)

      // 1. Fetch remote songs from Supabase
      const { data: remoteSongs, error } = await supabase
        .from('songs')
        .select('*')
        .eq('band_id', bandId)

      if (error) throw error

      console.log('📥 Fetched', remoteSongs.length, 'songs from Supabase')

      // 2. Get local songs from IndexedDB
      const localSongs = await db.songs.toArray()
      console.log('💾 Found', localSongs.length, 'local songs')

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

      console.log('✅ Song sync complete')
      return { success: true }
    } catch (error) {
      console.error('❌ Song sync failed:', error)
      return { success: false, error }
    }
  }

  async pushSong(song, bandId) {
    if (!supabase) return { error: 'Offline' }

    try {
      const remoteSong = this.mapLocalToRemote(song, bandId)
      
      const { error } = await supabase
        .from('songs')
        .upsert(remoteSong, { onConflict: 'id' })

      if (!error) {
        // Remove sync flag
        delete song._pendingSync
        await db.songs.put(song)
        console.log('✅ Pushed song:', song.name)
      }

      return { error }
    } catch (error) {
      console.error('❌ Failed to push song:', error)
      return { error }
    }
  }

  mapRemoteToLocal(remoteSong) {
    return {
      id: remoteSong.id,
      name: remoteSong.name,
      artist: remoteSong.artist,
      bpm: remoteSong.bpm,
      timeSignature: remoteSong.time_signature,
      key: remoteSong.key, // Add key field
      lyrics: remoteSong.notes,
      helixPreset: remoteSong.midi_preset,
      accentPattern: remoteSong.accent_pattern,
      updatedAt: remoteSong.updated_at
    }
  }

  mapLocalToRemote(song, bandId) {
    return {
      id: song.id,
      band_id: bandId,
      name: song.name,
      artist: song.artist,
      bpm: song.bpm,
      time_signature: song.timeSignature,
      notes: song.lyrics,
      midi_preset: song.helixPreset,
      accent_pattern: song.accentPattern,
      updated_at: new Date().toISOString()
    }
  }

  // ============================================
  // SETLISTS SYNC
  // ============================================

  async syncSetLists(bandId) {
    if (!bandId || !supabase) {
      console.log('⏭️ Skipping setlist sync (no band or offline)')
      return { success: false }
    }

    try {
      console.log('🔄 Syncing setlists for band:', bandId)

      // 1. Fetch remote setlists
      const { data: remoteSetLists, error: setlistsError } = await supabase
        .from('setlists')
        .select('*, setlist_songs(*)')
        .eq('band_id', bandId)

      if (setlistsError) throw setlistsError

      console.log('📥 Fetched', remoteSetLists.length, 'setlists from Supabase')

      // 2. Get local setlists
      const localSetLists = await db.setLists.toArray()
      console.log('💾 Found', localSetLists.length, 'local setlists')

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

      console.log('✅ Setlist sync complete')
      return { success: true }
    } catch (error) {
      console.error('❌ Setlist sync failed:', error)
      return { success: false, error }
    }
  }

  async pushSetList(setList, bandId) {
    if (!supabase) return { error: 'Offline' }

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
      console.log('✅ Pushed setlist:', setList.name)

      return { success: true }
    } catch (error) {
      console.error('❌ Failed to push setlist:', error)
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
          console.log('🔔 Song changed:', payload.eventType, payload.new?.name || payload.old?.id)
          
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
    console.log('👂 Subscribed to song changes')
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
          console.log('🔔 Setlist changed:', payload.eventType, payload.new?.name || payload.old?.id)
          
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
    console.log('👂 Subscribed to setlist changes')
    return subscription
  }

  unsubscribeAll() {
    this.realtimeSubscriptions.forEach(sub => {
      sub.unsubscribe()
    })
    this.realtimeSubscriptions = []
    console.log('🔇 Unsubscribed from all realtime channels')
  }
}

export const syncManager = new SyncManager()

