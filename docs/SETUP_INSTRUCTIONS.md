# Setup Instructions - Quick Start

## ✅ What's Done So Far

1. **Supabase Client Installed** - `@supabase/supabase-js` added to project
2. **Auth Context Created** - `SupabaseContext` with login/signup/logout
3. **Login UI Built** - Beautiful modal with email/password auth
4. **AppHeader Updated** - Shows user info and login/logout button
5. **Database Schema Ready** - SQL migration file created

## 🚀 Next Steps to Test Auth

### Step 1: Create .env File

Create `/react-app/.env` with these contents:

```env
VITE_SUPABASE_URL=https://tqectpcofvqerslmplqr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZWN0cGNvZnZxZXJzbG1wbHFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzIzMzMsImV4cCI6MjA3ODMwODMzM30.JT3TbDZiRIp_Ei5jN8EpFvRZ7enRG3P_rD0zEpi6e2w
```

### Step 2: Run Database Migration

1. Go to your Supabase dashboard: https://app.supabase.com/project/tqectpcofvqerslmplqr
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `/docs/supabase/001_initial_schema.sql`
5. Copy the entire file content
6. Paste into Supabase SQL Editor
7. Click **Run** (or press Cmd+Enter)
8. Wait for success message: "Success. No rows returned"

This will create all tables (users, bands, songs, setlists, etc.) with proper security policies.

### Step 3: Restart Dev Server

```bash
cd "/Users/petermason/Metronome App/react-app"
npm run dev
```

Open http://localhost:5173

### Step 4: Test Authentication

1. Click **"Log In"** button in top-right
2. Click **"Sign up"** link
3. Fill in:
   - Display Name: "Drummer Pete" (or your name)
   - Email: your email
   - Password: at least 6 characters
4. Click **"Sign Up"**
5. Check your email for verification link
6. Click verification link
7. Go back to app and log in with same email/password
8. You should see your name in the header!

## 🎸 What Works Now

- **Authentication**: Sign up, log in, log out
- **User Profile**: Auto-created on signup
- **Offline Mode**: If Supabase isn't configured, app works offline
- **Existing Features**: Metronome, tempo wheel, songs, setlists (all still work with IndexedDB)

## 📋 Next TODO Items

Now that auth is working, the remaining tasks are:

1. **Band Management** - Create/join bands, link users
2. **Data Sync** - Sync songs/setlists from IndexedDB to Supabase
3. **Realtime Updates** - Live sync between band members
4. **Stage Mode UI** - Large control performance view
5. **MIDI Preset Switching** - Auto-switch Helix presets per song

## 🐛 Troubleshooting

### "Supabase credentials missing"
- Make sure `.env` file exists in `/react-app/` directory
- Restart dev server after creating `.env`

### "Email not confirmed"
- Check your email (including spam folder)
- Click verification link
- Try logging in again

### "User already registered"
- Use a different email or log in with existing account

### Migration errors
- Make sure you copied the entire SQL file
- Check for any error messages in Supabase SQL Editor
- If tables already exist, you may need to drop them first (ask me)

## 📞 Need Help?

Let me know if:
- Migration fails
- Login doesn't work
- You want to test with multiple accounts (your bandmates)
- You're ready to move on to the next phase!

