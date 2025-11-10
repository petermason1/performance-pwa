-- Metronome App - Initial Schema Migration
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  instrument TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- BANDS TABLE
-- ============================================
CREATE TABLE public.bands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- ============================================
-- BAND_MEMBERS TABLE
-- ============================================
CREATE TABLE public.band_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  instrument TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(band_id, user_id),
  CHECK (role IN ('owner', 'admin', 'member'))
);

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

-- ============================================
-- GENRES TABLE
-- ============================================
CREATE TABLE public.genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(band_id, name)
);

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

-- ============================================
-- SONGS TABLE
-- ============================================
CREATE TABLE public.songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  artist TEXT,
  bpm INTEGER NOT NULL DEFAULT 120 CHECK (bpm >= 40 AND bpm <= 300),
  time_signature INTEGER NOT NULL DEFAULT 4 CHECK (time_signature IN (3, 4, 6)),
  key TEXT,
  duration INTEGER,
  notes TEXT,
  midi_preset INTEGER CHECK (midi_preset >= 0 AND midi_preset <= 127),
  accent_pattern JSONB,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_songs_band_id ON public.songs(band_id);
CREATE INDEX idx_songs_name ON public.songs(band_id, name);

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

-- ============================================
-- SONG_GENRES TABLE
-- ============================================
CREATE TABLE public.song_genres (
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  PRIMARY KEY (song_id, genre_id)
);

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

-- ============================================
-- SETLISTS TABLE
-- ============================================
CREATE TABLE public.setlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_setlists_band_id ON public.setlists(band_id);

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

-- ============================================
-- SETLIST_SONGS TABLE
-- ============================================
CREATE TABLE public.setlist_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setlist_id, position)
);

CREATE INDEX idx_setlist_songs_setlist_position ON public.setlist_songs(setlist_id, position);

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

-- ============================================
-- PREFERENCES TABLE
-- ============================================
CREATE TABLE public.preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN DEFAULT true,
  visual_enabled BOOLEAN DEFAULT true,
  volume INTEGER DEFAULT 80 CHECK (volume >= 0 AND volume <= 100),
  midi_output_index INTEGER,
  helix_output_index INTEGER,
  lights_output_index INTEGER,
  preset_names JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, band_id)
);

ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON public.preferences FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
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

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-add creator to band_members on band creation
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

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.setlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.setlist_songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.preferences;

-- ============================================
-- DONE!
-- ============================================

-- Verify tables were created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

