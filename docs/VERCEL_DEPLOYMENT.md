# Vercel Deployment Guide

## Overview
Deploy the metronome app to Vercel with Supabase environment variables and automatic CI/CD from GitHub.

## Prerequisites
1. GitHub repository for the project
2. Vercel account (free tier works)
3. Supabase project created with URL and anon key

## Deployment Steps

### 1. Prepare Repository

Ensure `.gitignore` includes:
```gitignore
# Environment
.env
.env.local
.env.*.local

# Build
dist
dist-ssr
*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

Ensure `package.json` has correct build script:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2. Push to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration

### 4. Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `react-app` (if monorepo) or `.` (if React app is at root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5. Add Environment Variables

In Vercel project settings → Environment Variables:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key-here` | Production, Preview, Development |

**Important**: 
- Use `VITE_` prefix (Vite requirement)
- Add to all environments (Production, Preview, Development)
- Get keys from Supabase Dashboard → Settings → API

### 6. Deploy

Click "Deploy" and wait for build to complete (~1-2 minutes).

Vercel will provide a URL like: `https://metronome-app.vercel.app`

## Automatic Deployments

### Production (main branch)
Every push to `main` triggers a production deployment automatically.

### Preview (feature branches)
Every push to a feature branch creates a preview deployment with a unique URL.

### Rollback
If a deployment fails, Vercel keeps previous deployments. You can rollback instantly from the dashboard.

## Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain (e.g., `metronome.yourdomain.com`)
3. Update DNS records as instructed by Vercel
4. SSL certificate is automatically provisioned

## Environment-Specific Settings

### Development
Use local `.env` file:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local-dev-key
```

### Preview
Preview deployments use the same env vars as production unless overridden in Vercel settings.

### Production
Production uses env vars from Vercel dashboard.

## Build Optimization

### Reduce Bundle Size
Verify build output:
```bash
npm run build
```

Check `dist/` size. Target < 500 KB for initial JS bundle.

### Enable Compression
Vercel automatically enables:
- Gzip compression
- Brotli compression
- HTTP/2

### PWA Considerations
Service worker is built by `vite-plugin-pwa` during `npm run build`. Ensure:
- `public/` contains manifest icons
- `vite.config.js` has correct PWA settings
- Service worker is **disabled** in dev (`devOptions.enabled: false`)

## Monitoring & Logs

### Vercel Dashboard
- **Deployments**: View all deployments, logs, and build output
- **Analytics** (Pro plan): Page views, load times, Web Vitals
- **Functions** (if using): Runtime logs for serverless functions

### Supabase Dashboard
- **Auth**: Monitor user signups, sessions
- **Database**: Query performance, storage usage
- **Realtime**: Active connections, message throughput

## CI/CD Workflow

### Recommended Git Flow
```
main (production)
  └── develop (staging/preview)
       └── feature/stage-mode
       └── feature/supabase-auth
```

### Deploy Process
1. Develop on feature branch
2. Push → Vercel creates preview URL
3. Test preview URL
4. Merge to `develop` → New preview URL for staging
5. Test staging
6. Merge to `main` → Production deployment

## Troubleshooting

### Build Fails: "Module not found"
- Verify all imports use correct paths (case-sensitive on Linux servers)
- Check `package.json` dependencies are installed
- Clear Vercel cache: Settings → General → Clear Cache

### Environment Variables Not Working
- Ensure `VITE_` prefix is used
- Redeploy after adding env vars (they're injected at build time, not runtime)
- Check browser console for hardcoded values

### Supabase Connection Fails
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase dashboard for API status
- Verify RLS policies allow anonymous reads (if needed)

### Service Worker Issues
- Clear browser cache and service workers
- Disable service worker in dev (`devOptions.enabled: false` in vite.config.js)
- Check Application tab in DevTools → Service Workers

## Performance Checklist

- [ ] Enable code splitting (Vite does this automatically)
- [ ] Lazy load routes/heavy components
- [ ] Optimize images (use WebP, compress)
- [ ] Minimize Web Audio API context creation (reuse singleton)
- [ ] Use React.memo for expensive re-renders
- [ ] Enable service worker caching in production
- [ ] Test with Lighthouse (target 90+ performance score)

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Use Supabase RLS policies (never trust client)
- [ ] Validate user input on backend (Supabase functions if needed)
- [ ] Use HTTPS only (Vercel handles this)
- [ ] Set CSP headers (optional, via `vercel.json`)
- [ ] Rotate Supabase keys if leaked

## Vercel Configuration File (Optional)

Create `/react-app/vercel.json` for advanced settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Cost Estimation

### Vercel Free Tier
- 100 GB bandwidth/month
- Unlimited personal projects
- Automatic HTTPS
- **Cost**: $0

Sufficient for band use (3-5 users, rehearsals 2-3x/week).

### Vercel Pro ($20/month)
Needed if:
- Custom domains with team collaboration
- Analytics dashboard
- Higher bandwidth (1 TB/month)

### Supabase Free Tier
- 500 MB database
- 50,000 monthly active users
- 5 GB file storage
- 2 GB bandwidth
- **Cost**: $0

Sufficient for 1 band with ~50 songs, 20 setlists.

### Supabase Pro ($25/month)
Needed if:
- More storage (8 GB database)
- Higher bandwidth
- Daily backups (7 day retention)

## Deployment Checklist

Before first production deploy:
- [ ] README.md complete
- [ ] All linter errors fixed
- [ ] Environment variables configured in Vercel
- [ ] Supabase project created and migrated
- [ ] Test auth flow (signup, login, logout)
- [ ] Test MIDI connection (if available)
- [ ] Test offline mode (disable network, verify IndexedDB works)
- [ ] Test on mobile device (responsive layout)
- [ ] Update PWA manifest (name, icons, colors)
- [ ] Set up custom domain (optional)

After first deploy:
- [ ] Test production URL
- [ ] Verify Supabase connection works
- [ ] Invite bandmates to test
- [ ] Monitor Vercel deployment logs for errors
- [ ] Set up deployment notifications (Vercel → Slack/email)

---

**Next Steps**: Push to GitHub and connect to Vercel for first deployment.

