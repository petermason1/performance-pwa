# Lyrics Timestamps Guide

## How Spotify & Others Get Accurate Timestamps

**Spotify** uses **Musixmatch** as their primary source for synchronized lyrics. They combine:
1. **Automated algorithms** that analyze audio to detect when words are sung
2. **Manual curation** by verified contributors
3. **Crowdsourcing** for accuracy

## Free Options Available

### 1. **LRCLIB API** (Free, Community-Powered)
- **URL**: `https://lrclib.net/api`
- **Format**: LRC (Line-synchronized) format
- **Free tier**: Yes, with rate limits
- **Coverage**: Varies by song popularity
- **Example**: `GET https://lrclib.net/api/search?track_name=Bet%20You%20Look%20Good&artist_name=Arctic%20Monkeys`

### 2. **BeatLRC** (Free, Word-Level Timing)
- **URL**: `https://beatlrc.online/api`
- **Format**: Word-level and line-level timestamps
- **Free tier**: Yes
- **Coverage**: Growing database

### 3. **Lyrix** (Open Source)
- **GitHub**: https://github.com/BlueCatSoftware/Lyrix
- Fetches from Musixmatch via Spotify
- Self-hosted or use public instance

### 4. **Manual Sync Tools** (Most Accurate)

#### QuickLRC (Online)
- Go to: https://quicklrc.com/sync-lyrics
- Upload audio + paste lyrics
- Sync by marking timestamps as you listen
- Export as LRC format

#### LRC Generator
- Go to: https://www.lrcgenerator.app/manual-alignment
- Similar workflow
- Free and browser-based

## Paid/Pro Options

- **Musixmatch API**: Most comprehensive, requires subscription
- **Spotify Lyrics API**: Not publicly available (uses Musixmatch internally)

## Recommendation for Your App

**Best approach**: Use **LRCLIB API** for automatic fetching, with manual sync as backup.

**Implementation strategy**:
1. Try LRCLIB API first (free, automatic)
2. If not available, guide user to QuickLRC for manual sync
3. Allow manual timestamp editing in your app

## Converting LRC Format

LRC format is similar to your current format:
```
[00:12.34]First line of lyrics
[00:15.67]Second line of lyrics
```

Your format: `[MM:SS.CC] Text`
LRC format: `[MM:SS.CC] Text`

They're compatible! Just parse LRC files directly.

