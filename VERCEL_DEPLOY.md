# Vercel Deployment - Step by Step

## If Vercel isn't auto-detecting:

1. **In Vercel Dashboard**, go to your project
2. Click **Settings** → **General**
3. Under **Framework Preset**, select **"Other"**
4. **Build Command**: Leave empty (no build needed)
5. **Output Directory**: Leave empty (root directory)
6. Click **Save**

## Or try manual deployment:

1. In Vercel, click **"Create Deployment"**
2. Enter commit hash: `370953f` (latest commit)
3. Or just click **"Deploy"** - Vercel should auto-detect it's static

## Alternative: Use Vercel CLI

If web interface isn't working:

```bash
# Install Vercel CLI
npm i -g vercel

# In your project folder
cd "/Users/petermason/Metronome App"
vercel
```

Follow the prompts - it will deploy automatically!

## Check if files are on GitHub:

Visit: https://github.com/petermason1/performance-pwa

You should see all your files there. If they're there, Vercel should be able to deploy.

