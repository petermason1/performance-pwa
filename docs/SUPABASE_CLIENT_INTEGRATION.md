# Supabase Client Integration Plan

## Overview
This document outlines how to integrate Supabase authentication, data sync, and realtime updates into the React app while maintaining offline-first behavior with IndexedDB caching.

## Architecture

### Data Flow
```
┌─────────────────┐
│   React App     │
│   (Components)  │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Hooks   │  (useAuth, useSongs, useSetLists)
    └────┬─────┘
         │
┌────────▼─────────────┐
│  SupabaseContext     │  (auth state, supabase client)
└────┬─────────────┬───┘
     │             │
┌────▼─────┐  ┌───▼──────┐
│ Supabase │  │ IndexedDB │
│ (online) │  │ (offline) │
└──────────┘  └───────────┘
```

### Sync Strategy
1. **Read**: Check IndexedDB first (instant), then fetch from Supabase if online
2. **Write**: Save to IndexedDB immediately, queue for Supabase sync
3. **Conflict Resolution**: Last-write-wins based on `updated_at` timestamp
4. **Realtime**: Subscribe to Supabase changes, update IndexedDB and UI

## Installation

### 1. Install Supabase Client
```bash
cd react-app
npm install @supabase/supabase-js
```

### 2. Environment Variables
Create `/react-app/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Add to `.gitignore`:
```
.env
.env.local
```

### 3. Create Supabase Client
`/react-app/src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Running in offline-only mode.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

## Authentication

### SupabaseContext
`/react-app/src/context/SupabaseContext.jsx`:

```javascript
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SupabaseContext = createContext({})

export function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event)
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}
```

### Auth UI Components
`/react-app/src/components/Auth/LoginModal.jsx`:

```javascript
import { useState } from 'react'
import { useSupabase } from '../../context/SupabaseContext'

export default function LoginModal({ onClose }) {
  const { signIn, signUp } = useSupabase()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        onClose()
      } else {
        const { error } = await signUp(email, password, displayName)
        if (error) throw error
        alert('Check your email for verification link!')
        setMode('login')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-glass-border)] rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {mode === 'login' ? 'Log In' : 'Sign Up'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)]"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)]"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-glass-border)]"
            required
            minLength={6}
          />

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-[var(--color-accent-cyan)] text-black rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-[var(--color-accent-cyan)] hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-[var(--color-accent-cyan)] hover:underline"
              >
                Log in
              </button>
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          Continue offline
        </button>
      </div>
    </div>
  )
}
```

## Data Sync

### Sync Manager
`/react-app/src/lib/syncManager.js`:

```javascript
import { supabase } from './supabase'
import { db } from '../utils/db'

class SyncManager {
  constructor() {
    this.syncQueue = []
    this.isSyncing = false
    this.realtimeSubscriptions = []
  }

  async syncSongs(bandId) {
    if (!bandId) return

    try {
      // Fetch from Supabase
      const { data: remoteSongs, error } = await supabase
        .from('songs')
        .select('*')
        .eq('band_id', bandId)

      if (error) throw error

      // Compare with IndexedDB and update
      const localSongs = await db.songs.toArray()
      
      // Merge: take newer version based on updated_at
      for (const remoteSong of remoteSongs) {
        const localSong = localSongs.find(s => s.id === remoteSong.id)
        
        if (!localSong || new Date(remoteSong.updated_at) > new Date(localSong.updated_at)) {
          await db.songs.put(this.mapRemoteToLocal(remoteSong))
        }
      }

      // Push local changes to Supabase
      for (const localSong of localSongs) {
        if (localSong._pendingSync) {
          await this.pushSong(localSong, bandId)
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Sync failed:', error)
      return { success: false, error }
    }
  }

  async pushSong(song, bandId) {
    const remoteSong = this.mapLocalToRemote(song, bandId)
    
    const { error } = await supabase
      .from('songs')
      .upsert(remoteSong)

    if (!error) {
      // Remove sync flag
      delete song._pendingSync
      await db.songs.put(song)
    }

    return { error }
  }

  mapRemoteToLocal(remoteSong) {
    return {
      id: remoteSong.id,
      name: remoteSong.name,
      artist: remoteSong.artist,
      bpm: remoteSong.bpm,
      timeSignature: remoteSong.time_signature,
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

  subscribeToSongs(bandId, onChange) {
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
          console.log('Song changed:', payload)
          
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
    return subscription
  }

  unsubscribeAll() {
    this.realtimeSubscriptions.forEach(sub => sub.unsubscribe())
    this.realtimeSubscriptions = []
  }
}

export const syncManager = new SyncManager()
```

### Data Hooks with Sync
`/react-app/src/hooks/useSongs.js`:

```javascript
import { useState, useEffect } from 'react'
import { db } from '../utils/db'
import { syncManager } from '../lib/syncManager'
import { useSupabase } from '../context/SupabaseContext'

export function useSongs() {
  const { user } = useSupabase()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [bandId, setBandId] = useState(null)

  // Load band ID for current user
  useEffect(() => {
    if (user) {
      // Fetch user's band from Supabase
      // For now, assume first band
      // TODO: Add band selector
      // setBandId(...)
    }
  }, [user])

  // Load songs from IndexedDB
  useEffect(() => {
    const loadSongs = async () => {
      const localSongs = await db.songs.toArray()
      setSongs(localSongs)
      setLoading(false)
    }
    loadSongs()
  }, [])

  // Sync with Supabase
  useEffect(() => {
    if (bandId) {
      syncManager.syncSongs(bandId)
      
      // Subscribe to realtime updates
      const subscription = syncManager.subscribeToSongs(bandId, async () => {
        const updatedSongs = await db.songs.toArray()
        setSongs(updatedSongs)
      })

      return () => subscription.unsubscribe()
    }
  }, [bandId])

  const addSong = async (song) => {
    song._pendingSync = true
    await db.songs.add(song)
    
    if (bandId) {
      await syncManager.pushSong(song, bandId)
    }
    
    const updatedSongs = await db.songs.toArray()
    setSongs(updatedSongs)
  }

  const updateSong = async (id, updates) => {
    const song = await db.songs.get(id)
    song._pendingSync = true
    Object.assign(song, updates)
    await db.songs.put(song)
    
    if (bandId) {
      await syncManager.pushSong(song, bandId)
    }
    
    const updatedSongs = await db.songs.toArray()
    setSongs(updatedSongs)
  }

  const deleteSong = async (id) => {
    await db.songs.delete(id)
    
    if (bandId) {
      await supabase.from('songs').delete().eq('id', id)
    }
    
    const updatedSongs = await db.songs.toArray()
    setSongs(updatedSongs)
  }

  return { songs, loading, addSong, updateSong, deleteSong }
}
```

## Band Management

### Band Linking Flow
1. User signs up/logs in
2. Check if user is member of any bands
3. If yes: load band data and sync
4. If no: prompt to create or join a band

`/react-app/src/hooks/useBand.js`:

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../context/SupabaseContext'

export function useBand() {
  const { user } = useSupabase()
  const [bands, setBands] = useState([])
  const [currentBand, setCurrentBand] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadBands()
    }
  }, [user])

  const loadBands = async () => {
    const { data, error } = await supabase
      .from('band_members')
      .select('*, bands(*)')
      .eq('user_id', user.id)

    if (!error && data) {
      const userBands = data.map(bm => bm.bands)
      setBands(userBands)
      
      // Load last active band or first band
      const lastBandId = localStorage.getItem('currentBandId')
      const activeBand = userBands.find(b => b.id === lastBandId) || userBands[0]
      setCurrentBand(activeBand)
    }
    setLoading(false)
  }

  const createBand = async (name) => {
    const { data, error } = await supabase
      .from('bands')
      .insert({ name, created_by: user.id })
      .select()
      .single()

    if (!error) {
      await loadBands()
      return { success: true, band: data }
    }
    return { success: false, error }
  }

  const joinBand = async (inviteCode) => {
    // TODO: Implement invite system
  }

  const switchBand = (band) => {
    setCurrentBand(band)
    localStorage.setItem('currentBandId', band.id)
  }

  return { bands, currentBand, loading, createBand, joinBand, switchBand }
}
```

## Offline Queue

### Write Queue Manager
`/react-app/src/lib/writeQueue.js`:

```javascript
class WriteQueue {
  constructor() {
    this.queue = this.loadQueue()
    this.processing = false
  }

  loadQueue() {
    const stored = localStorage.getItem('writeQueue')
    return stored ? JSON.parse(stored) : []
  }

  saveQueue() {
    localStorage.setItem('writeQueue', JSON.stringify(this.queue))
  }

  add(operation) {
    this.queue.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...operation
    })
    this.saveQueue()
  }

  async process() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const operation = this.queue[0]
      
      try {
        await this.execute(operation)
        this.queue.shift() // Remove if successful
      } catch (error) {
        console.error('Failed to process operation:', error)
        // Keep in queue, will retry later
        break
      }
    }

    this.saveQueue()
    this.processing = false
  }

  async execute(operation) {
    const { table, action, data, id } = operation

    switch (action) {
      case 'insert':
        await supabase.from(table).insert(data)
        break
      case 'update':
        await supabase.from(table).update(data).eq('id', id)
        break
      case 'delete':
        await supabase.from(table).delete().eq('id', id)
        break
    }
  }
}

export const writeQueue = new WriteQueue()

// Process queue when online
window.addEventListener('online', () => {
  console.log('Back online, processing write queue...')
  writeQueue.process()
})
```

## Integration Steps

### Phase 1: Setup (Week 1)
- [ ] Install @supabase/supabase-js
- [ ] Create Supabase client
- [ ] Build SupabaseContext and provider
- [ ] Add to main.jsx: `<SupabaseProvider><AppProvider>...</AppProvider></SupabaseProvider>`

### Phase 2: Auth (Week 1)
- [ ] Build LoginModal component
- [ ] Add login/logout buttons to AppHeader
- [ ] Test signup/login flow with 3 test accounts

### Phase 3: Band Management (Week 2)
- [ ] Build useBand hook
- [ ] Create/join band UI
- [ ] Band switcher in settings

### Phase 4: Data Sync (Week 2-3)
- [ ] Build SyncManager for songs
- [ ] Update useSongs to use SyncManager
- [ ] Test sync with 2 devices
- [ ] Extend to setlists

### Phase 5: Realtime (Week 3)
- [ ] Subscribe to song changes
- [ ] Subscribe to setlist changes
- [ ] Test live updates during rehearsal

### Phase 6: Offline Queue (Week 4)
- [ ] Build WriteQueue
- [ ] Test offline→online sync
- [ ] Add sync status indicator

---

**Next Steps**: Install Supabase client and create initial context/provider structure.

