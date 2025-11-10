# 🧪 Testing Supabase Sync

## What Just Happened

I've implemented the full sync system! Here's what's now working:

### ✅ Completed Features

1. **SyncManager Class** (`src/lib/syncManager.js`)
   - Syncs songs between IndexedDB ↔ Supabase
   - Syncs setlists between IndexedDB ↔ Supabase
   - Real-time subscriptions for live updates
   - Automatic conflict resolution (remote wins)

2. **AppContext Integration** (`src/AppContext.jsx`)
   - Auto-syncs when you join/create a band
   - Pushes local changes to Supabase immediately
   - Subscribes to real-time changes from bandmates
   - Falls back to offline-only if no band

3. **Band Management** (`src/hooks/useBand.js`)
   - Create bands
   - Invite members (by email)
   - Switch between bands
   - View band members

## 🔍 How to Test

### 1. Check Console Logs

Open the browser console (F12) and look for these logs:

```
🔄 Starting sync for band: [band name]
🔄 Syncing songs for band: [band id]
📥 Fetched X songs from Supabase
💾 Found X local songs
✅ Song sync complete
🔄 Syncing setlists for band: [band id]
📥 Fetched X setlists from Supabase
💾 Found X local setlists
✅ Setlist sync complete
👂 Subscribed to song changes
👂 Subscribed to setlist changes
```

### 2. Create a Test Song

1. Go to **Songs** tab
2. Click **"+ Add Song"**
3. Fill in:
   - Name: "Test Song"
   - Artist: "Test Artist"
   - BPM: 120
4. Click **Save**
5. Check console for: `✅ Pushed song: Test Song`
6. Go to Supabase Dashboard → Table Editor → `songs` table
7. You should see your song with the correct `band_id`!

### 3. Test Real-time Sync (2 Devices)

**Device 1 (Your laptop):**
1. You're already signed in with band "aaa"
2. Create a test song

**Device 2 (Phone/Another Browser):**
1. Open `http://localhost:5173` (if on same network)
   - Or deploy to Vercel and use that URL
2. Click **"Log In"**
3. Sign up with a different email (e.g., `bandmate@test.com`)
4. Click **"+ Create Band"** but then click **"Join Existing Band"**
5. Have Device 1 go to the green banner → click band name → **"Invite Member"**
6. Enter the email from Device 2
7. Device 2 should now see the band and all songs!
8. Create a song on Device 2
9. **Device 1 should see it appear automatically!** 🎉

### 4. Test Offline Mode

1. Turn off wifi/network
2. Create a song (it saves to IndexedDB)
3. Turn wifi back on
4. The song should auto-sync to Supabase!

## 🔧 Troubleshooting

### "No sync logs in console"

- Make sure you're signed in (green banner at top)
- Make sure you created/joined a band (band name in green banner)
- Refresh the page

### "Songs not appearing on Device 2"

- Make sure Device 2 joined the same band
- Check Supabase Dashboard → Authentication → Users (both users should exist)
- Check Table Editor → `band_members` (both users should be listed)

### "Real-time not working"

- Check Supabase Dashboard → Project Settings → API
- Make sure Realtime is enabled
- Refresh both devices

## 📊 What to Check in Supabase

### Tables to Inspect:

1. **users** - Your user accounts
2. **bands** - Your band (id, name, created_by)
3. **band_members** - Who's in the band (user_id, band_id, role)
4. **songs** - Your synced songs (band_id, name, artist, bpm, etc.)
5. **setlists** - Your synced setlists (band_id, name)
6. **setlist_songs** - Songs in setlists (setlist_id, song_id, position)

## 🎯 Next Steps

Once you confirm sync is working:

1. ✅ Test creating songs → check Supabase
2. ✅ Test creating setlists → check Supabase
3. ✅ Test inviting a bandmate (second account)
4. ✅ Test real-time updates (create song on Device 2, see on Device 1)
5. 🔜 Deploy to Vercel for mobile testing
6. 🔜 Build Stage Mode UI
7. 🔜 Add MIDI preset mapping per song

## 🚀 To Test Now:

1. Refresh your browser (http://localhost:5173)
2. Make sure you're signed in (green banner)
3. Make sure you have a band (should say "🎸 aaa")
4. Open Console (F12)
5. Create a song in the Songs tab
6. Check console logs and Supabase!

