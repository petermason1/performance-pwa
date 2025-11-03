# Deploy to Vercel - Quick Guide

## Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Performance PWA - Initial release"

# Create repo on GitHub (go to github.com and create new repo)
# Then connect it:
git remote add origin https://github.com/YOUR_USERNAME/performance-pwa.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel (FREE)

1. Go to **[vercel.com](https://vercel.com)**
2. **Sign up** (use GitHub account - it's free)
3. Click **"New Project"**
4. **Import** your GitHub repository
5. Vercel auto-detects it's a static site
6. Click **"Deploy"**
7. Wait ~30 seconds
8. Done! Your app is live at `your-app.vercel.app`

**Free tier includes:**
- Unlimited deployments
- Custom domain support
- HTTPS automatically
- Global CDN
- Perfect for PWAs!

## Step 3: Install on iPhone

1. Open **Safari** (must use Safari, not Chrome)
2. Go to your Vercel URL: `https://your-app.vercel.app`
3. Tap the **Share button** (square with up arrow)
4. Scroll down and tap **"Add to Home Screen"**
5. Edit the name if you want
6. Tap **"Add"**
7. The app icon appears on your home screen!
8. Works offline after first load!

## Step 4: Install on Android

1. Open **Chrome** on Android
2. Go to your Vercel URL
3. Browser shows **"Install"** banner automatically
4. Or go to Menu → **"Add to Home screen"**
5. Works offline!

## Important Notes

- **HTTPS required**: Vercel provides this automatically (required for PWAs)
- **Service Worker**: Works on Vercel automatically
- **Updates**: Push to GitHub, Vercel auto-deploys
- **Custom domain**: You can add your own domain (free)

## Testing

After deployment:
1. Visit your Vercel URL
2. Open DevTools → Application → Service Workers
3. Check that service worker is registered
4. Test offline mode
5. Install as PWA on your device

## Need Help?

- Vercel docs: https://vercel.com/docs
- PWA docs: https://web.dev/progressive-web-apps/

