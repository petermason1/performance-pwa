# Pro Version Plan

## Feature Tiers

### **Free Tier** (Current)
- ✅ Basic metronome (BPM 40-300)
- ✅ Up to 20 songs
- ✅ Up to 3 set lists
- ✅ Basic time signatures (2/4, 3/4, 4/4)
- ✅ Basic accent patterns
- ✅ Lyrics display (no sync)
- ✅ Local storage only
- ✅ Basic MIDI output (single device)
- ❌ No cloud sync
- ❌ No export/import
- ❌ No backing tracks
- ❌ No advanced features

### **Pro Tier** ($9.99/month or $99/year)
- ✅ **Unlimited** songs and set lists
- ✅ **Cloud Sync** across all devices (Supabase/Backend)
- ✅ **Advanced Time Signatures** (5/4, 6/8, 7/8, 9/8, 12/8, custom)
- ✅ **Polyrhythms** (full support)
- ✅ **Synchronized Lyrics** with timestamp highlighting
- ✅ **Backing Tracks** (upload & sync audio files)
- ✅ **MIDI Routing** (separate Helix + Lights outputs)
- ✅ **Export/Import** (JSON backup + cloud restore)
- ✅ **Set List Collaboration** (share set lists with band members)
- ✅ **Song Templates** (pre-made song structures)
- ✅ **Performance Analytics** (set list durations, tempo changes)
- ✅ **Advanced MIDI** (custom MIDI mapping, CC control)
- ✅ **Multiple Presets** per song (Helix patch switching)
- ✅ **Audio Effects** (reverb, delay on metronome click)
- ✅ **Visualizations** (waveform, spectrum analyzer)
- ✅ **Offline Mode** (full functionality without internet)

### **Enterprise Tier** ($49/month per band/organization)
- ✅ Everything in Pro
- ✅ **Multi-User Accounts** (band member management)
- ✅ **Shared Cloud Library** (band song database)
- ✅ **Role-Based Permissions** (who can edit what)
- ✅ **Custom Branding** (your logo, colors)
- ✅ **API Access** (integrate with other tools)
- ✅ **Priority Support**
- ✅ **Advanced Analytics** (usage reports, performance stats)

## Implementation Approach

### Option 1: License Key System (Simplest)
- User purchases license key
- Enter key in app → unlocks Pro features
- Stored locally (can be shared, but good enough for MVP)
- **Pros:** Simple, no backend needed
- **Cons:** Easy to share keys

### Option 2: Supabase + Stripe (Recommended)
- User signs up via email/password
- Stripe handles payments
- Supabase stores user data + subscription status
- Features gated by user tier
- **Pros:** Secure, scalable, real sync
- **Cons:** More complex, requires backend

### Option 3: One-Time Purchase (via Gumroad/Paddle)
- Buy Pro unlock code
- Enter code in app
- Validates against simple API endpoint
- **Pros:** Simple payment, no subscription
- **Cons:** Less recurring revenue

## Recommended: Hybrid Approach

1. **Free Tier:** Keep current features free
2. **Pro Trial:** 7-day free trial (no payment required)
3. **Pro Subscription:** $9.99/month via Stripe
4. **License Key Fallback:** For users who prefer one-time payment

## Implementation Steps

### Phase 1: Feature Gating
- Add `isPro` check to localStorage
- Hide/disable Pro features if not Pro
- Show upgrade prompts

### Phase 2: Payment Integration
- Add Stripe checkout
- Create Supabase account system
- Sync subscription status

### Phase 3: Cloud Sync
- Move data to Supabase
- Real-time sync across devices
- Conflict resolution

### Phase 4: Pro Features
- Add backing tracks
- Enhanced MIDI routing
- Collaboration features

## Code Structure

```javascript
// License/Subscription Manager
class LicenseManager {
    isPro() {
        // Check localStorage or Supabase subscription
        return localStorage.getItem('pro_license') === 'true' || 
               this.checkSubscription();
    }
    
    unlockPro(licenseKey) {
        // Validate key or process payment
    }
}
```

## Marketing Strategy

- **Free Forever:** Basic features stay free (builds trust)
- **7-Day Trial:** Let users try Pro before paying
- **Value Proposition:** "Unlimited songs, cloud sync, backing tracks"
- **Use Cases:** Perfect for touring bands, music teachers, studios

## Pricing Justification

- **$9.99/month** = Price of a coffee
- Comparable to: Spotify Premium, Apple Music
- Cheaper than: Guitar Pro, ProTools (but different use case)
- Value: Unlimited songs + sync = saves hours of work

