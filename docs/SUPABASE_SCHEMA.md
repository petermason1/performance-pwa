# Supabase Database Schema

## Overview
This document defines the database schema for multi-user band collaboration, including tables, relationships, Row-Level Security (RLS) policies, and indexes.

## Architecture Principles
1. **Band-Centric**: All shared data (songs, setlists) belongs to a band
2. **Individual Accounts**: Each musician has their own auth account, linked to one or more bands
3. **Offline-First**: Schema supports conflict-free sync with last-write-wins
4. **RLS Everywhere**: All tables use Row-Level Security to enforce access control

## Tables

### `users` (extends auth.users)
Custom profile data for each user.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  instrument TEXT, -- 'drums', 'bass', 'guitar', 'vocals', etc.
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb, -- UI prefs, metronome settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can read/update their own profile
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
```

### `bands`
Represents a group of musicians (e.g., "The Rockers").

```sql
CREATE TABLE public.bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can see bands they're members of
ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bands"
  ON public.bands FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = bands.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own bands"
  ON public.bands FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = bands.id AND user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can create bands"
  ON public.bands FOR INSERT
  WITH CHECK (auth.uid() = created_by);
```

### `band_members`
Links users to bands with roles.

```sql
CREATE TABLE public.band_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  instrument TEXT, -- Optional override of user.instrument for this band
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(band_id, user_id)
);

-- RLS: Users can see memberships for their bands
ALTER TABLE public.band_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own band memberships"
  ON public.band_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_members.band_id AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage memberships"
  ON public.band_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members bm
      WHERE bm.band_id = band_members.band_id 
        AND bm.user_id = auth.uid() 
        AND bm.role IN ('owner', 'admin')
    )
  );
```

### `genres`
Tagging system for songs.

```sql
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- Hex color for UI badges
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(band_id, name)
);

-- RLS: Users can see genres for their bands
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view band genres"
  ON public.genres FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = genres.band_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage band genres"
  ON public.genres FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = genres.band_id AND user_id = auth.uid()
    )
  );
```

### `songs`
Song library shared across the band.

```sql
CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  artist TEXT,
  bpm INTEGER NOT NULL DEFAULT 120 CHECK (bpm >= 40 AND bpm <= 300),
  time_signature INTEGER NOT NULL DEFAULT 4 CHECK (time_signature IN (3, 4, 6)),
  key TEXT, -- 'C', 'Am', etc.
  duration INTEGER, -- seconds (optional)
  notes TEXT, -- Free-form notes/lyrics
  midi_preset INTEGER, -- Helix preset number (0-127)
  accent_pattern JSONB, -- [true, false, false, true] for beat accents
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_songs_band_id ON public.songs(band_id);
CREATE INDEX idx_songs_name ON public.songs(band_id, name);

-- RLS: Users can see songs from their bands
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view band songs"
  ON public.songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = songs.band_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage band songs"
  ON public.songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = songs.band_id AND user_id = auth.uid()
    )
  );
```

### `song_genres`
Many-to-many relationship between songs and genres.

```sql
CREATE TABLE public.song_genres (
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (song_id, genre_id)
);

-- RLS: Inherits from songs table
ALTER TABLE public.song_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view song genres"
  ON public.song_genres FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.songs s
      JOIN public.band_members bm ON bm.band_id = s.band_id
      WHERE s.id = song_genres.song_id AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage song genres"
  ON public.song_genres FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.songs s
      JOIN public.band_members bm ON bm.band_id = s.band_id
      WHERE s.id = song_genres.song_id AND bm.user_id = auth.uid()
    )
  );
```

### `setlists`
Named collections of songs (e.g., "Set 1", "Set 2", "Wedding Gig 2025").

```sql
CREATE TABLE public.setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_setlists_band_id ON public.setlists(band_id);

-- RLS: Users can see setlists from their bands
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view band setlists"
  ON public.setlists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = setlists.band_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage band setlists"
  ON public.setlists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = setlists.band_id AND user_id = auth.uid()
    )
  );
```

### `setlist_songs`
Ordered list of songs in a setlist.

```sql
CREATE TABLE public.setlist_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- 0-indexed order
  notes TEXT, -- Song-specific notes for this setlist
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setlist_id, position)
);

-- Index for fast ordered retrieval
CREATE INDEX idx_setlist_songs_setlist_position ON public.setlist_songs(setlist_id, position);

-- RLS: Inherits from setlists table
ALTER TABLE public.setlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view setlist songs"
  ON public.setlist_songs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists sl
      JOIN public.band_members bm ON bm.band_id = sl.band_id
      WHERE sl.id = setlist_songs.setlist_id AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage setlist songs"
  ON public.setlist_songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists sl
      JOIN public.band_members bm ON bm.band_id = sl.band_id
      WHERE sl.id = setlist_songs.setlist_id AND bm.user_id = auth.uid()
    )
  );
```

### `preferences` (user-specific settings)
Per-user, per-band preferences (e.g., metronome volume, visual settings).

```sql
CREATE TABLE public.preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN DEFAULT true,
  visual_enabled BOOLEAN DEFAULT true,
  volume INTEGER DEFAULT 80 CHECK (volume >= 0 AND volume <= 100),
  midi_output_index INTEGER,
  helix_output_index INTEGER,
  lights_output_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, band_id)
);

-- RLS: Users can only see/edit their own preferences
ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON public.preferences FOR ALL
  USING (user_id = auth.uid());
```

## Triggers & Functions

### Auto-update `updated_at` timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bands_updated_at
  BEFORE UPDATE ON public.bands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setlists_updated_at
  BEFORE UPDATE ON public.setlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON public.preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-create user profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Auto-add creator to band_members on band creation

```sql
CREATE OR REPLACE FUNCTION public.handle_new_band()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.band_members (band_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_band_created
  AFTER INSERT ON public.bands
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_band();
```

## Realtime Subscriptions

Enable realtime for tables that need live updates:

```sql
-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.setlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.setlist_songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.preferences;
```

## Migration Plan

### Phase 1: Core Schema
1. Create `users`, `bands`, `band_members` tables
2. Set up RLS policies
3. Test auth flow with 3 test accounts

### Phase 2: Song Library
1. Create `songs`, `genres`, `song_genres` tables
2. Migrate existing IndexedDB songs to Supabase
3. Test CRUD operations

### Phase 3: Set Lists
1. Create `setlists`, `setlist_songs` tables
2. Migrate existing setlists
3. Test drag/drop reordering

### Phase 4: Preferences & Realtime
1. Create `preferences` table
2. Enable realtime subscriptions
3. Test multi-device sync

## Data Migration from IndexedDB

### Export Current Data
```javascript
// In browser console
const { songs, setLists } = await db.export()
console.log(JSON.stringify({ songs, setLists }, null, 2))
```

### Import to Supabase
```javascript
// Client-side migration helper
async function migrateToSupabase(bandId, localData) {
  // 1. Insert songs
  const { data: songs, error: songsError } = await supabase
    .from('songs')
    .insert(
      localData.songs.map(song => ({
        band_id: bandId,
        name: song.name,
        artist: song.artist,
        bpm: song.bpm,
        time_signature: song.timeSignature,
        notes: song.lyrics,
        midi_preset: song.helixPreset,
        accent_pattern: song.accentPattern
      }))
    )
    .select()

  // 2. Insert setlists
  const { data: setlists, error: setlistsError } = await supabase
    .from('setlists')
    .insert(
      localData.setLists.map(sl => ({
        band_id: bandId,
        name: sl.name
      }))
    )
    .select()

  // 3. Map setlist songs
  // ... (full implementation in client code)
}
```

## Sample Queries

### Get all songs for current user's band
```sql
SELECT s.*, array_agg(g.name) as genres
FROM public.songs s
JOIN public.band_members bm ON bm.band_id = s.band_id
LEFT JOIN public.song_genres sg ON sg.song_id = s.id
LEFT JOIN public.genres g ON g.id = sg.genre_id
WHERE bm.user_id = auth.uid()
GROUP BY s.id
ORDER BY s.name;
```

### Get setlist with songs in order
```sql
SELECT 
  sl.id as setlist_id,
  sl.name as setlist_name,
  s.id as song_id,
  s.name as song_name,
  s.bpm,
  s.time_signature,
  ss.position
FROM public.setlists sl
JOIN public.setlist_songs ss ON ss.setlist_id = sl.id
JOIN public.songs s ON s.id = ss.song_id
WHERE sl.id = '...'
ORDER BY ss.position;
```

---

**Next Steps**: Create Supabase project, run migrations, test RLS policies with 3 band member accounts.

