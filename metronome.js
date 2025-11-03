// Metronome Class with accurate timing and polyrhythm support

class Metronome {
    constructor() {
        this.bpm = 120;
        this.isPlaying = false;
        this.beatCount = 0;
        this.timeSignature = 4;
        this.accentBeat = 1; // Which beat gets the accent (1-indexed) - legacy
        this.accentPattern = null; // Array of booleans for accent pattern [true, false, false, true]
        this.polyrhythm = null; // e.g., { pattern: [1, 0, 0, 1, 0, 0], name: "3:2" }
        this.intervalId = null;
        this.audioContext = null;
        this.gainNode = null;
        this.startTime = 0;
        this.nextBeatTime = 0;
        this.elapsedTime = 0;
        this.lyrics = [];
        this.currentLyricIndex = 0;
        this.onBeatCallback = null;
        this.onTimeUpdateCallback = null;
        this.lookahead = 25.0; // How far ahead to schedule (ms)
        this.scheduleAheadTime = 0.1; // How far ahead to schedule (seconds)
        this.scheduleInterval = null;
        
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = 0.3;
        } catch (e) {
            console.error('Audio context not supported:', e);
        }
    }
    
    setBPM(bpm) {
        this.bpm = Math.max(40, Math.min(300, bpm));
        if (this.isPlaying) {
            this.restart();
        }
    }
    
    setTimeSignature(signature) {
        this.timeSignature = signature;
        this.beatCount = 0;
        // Ensure accent beat is valid for new time signature
        this.accentBeat = Math.min(this.accentBeat, this.timeSignature);
        // Reset accent pattern to match new time signature if it exists
        if (this.accentPattern && this.accentPattern.length !== signature) {
            // Extend or truncate pattern to match new time signature
            if (this.accentPattern.length < signature) {
                // Extend with false (no accent)
                this.accentPattern = [...this.accentPattern, ...new Array(signature - this.accentPattern.length).fill(false)];
            } else {
                // Truncate
                this.accentPattern = this.accentPattern.slice(0, signature);
            }
        }
    }
    
    setAccentBeat(beat) {
        // Beat is 1-indexed (1 = first beat)
        this.accentBeat = Math.max(1, Math.min(beat, this.timeSignature));
    }
    
    setAccentPattern(pattern) {
        // pattern is array of booleans or numbers indicating which beats are accented
        // e.g., [true, false, false, true] or [1, 0, 0, 1]
        // Index 0 = first beat, Index 1 = second beat, etc.
        if (pattern && Array.isArray(pattern)) {
            this.accentPattern = pattern.map(p => Boolean(p === true || p === 1 || p === '1'));
        } else {
            this.accentPattern = null;
        }
    }
    
    isBeatAccented(beatIndex) {
        // beatIndex is 0-indexed within the measure
        if (this.accentPattern && this.accentPattern.length > 0) {
            return this.accentPattern[beatIndex % this.accentPattern.length] || false;
        }
        // Fallback to single accent beat
        const beatInMeasure = (beatIndex % this.timeSignature) + 1;
        return beatInMeasure === this.accentBeat;
    }
    
    setPolyrhythm(pattern, name) {
        // pattern is array like [1, 0, 0, 1, 0, 0] where 1 = accent, 0 = normal
        // name is like "3:2" or "custom"
        this.polyrhythm = pattern ? { pattern, name: name || 'custom' } : null;
        this.beatCount = 0;
    }
    
    setLyrics(lyrics) {
        this.lyrics = lyrics || [];
        this.currentLyricIndex = 0;
    }
    
    setOnBeatCallback(callback) {
        this.onBeatCallback = callback;
    }
    
    setOnTimeUpdateCallback(callback) {
        this.onTimeUpdateCallback = callback;
    }
    
    play() {
        if (!this.audioContext) {
            this.initAudioContext();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.beatCount = 0;
        this.startTime = this.audioContext.currentTime;
        this.nextBeatTime = this.audioContext.currentTime;
        this.elapsedTime = 0;
        this.currentLyricIndex = 0;
        
        // Use Web Audio scheduler for accurate timing
        this.scheduleBeats();
        
        // Schedule beats ahead of time (more accurate than setInterval)
        this.scheduleInterval = setInterval(() => {
            if (this.isPlaying) {
                this.scheduleBeats();
            }
        }, this.lookahead);
        
        // Update time for lyrics and UI (check every 50ms for smooth updates)
        this.timeUpdateInterval = setInterval(() => {
            if (this.isPlaying && this.audioContext) {
                this.elapsedTime = this.audioContext.currentTime - this.startTime;
                this.checkLyrics();
                if (this.onTimeUpdateCallback) {
                    this.onTimeUpdateCallback(this.elapsedTime);
                }
            }
        }, 50);
    }
    
    scheduleBeats() {
        const beatDuration = 60.0 / this.bpm; // Duration of one beat in seconds
        const currentTime = this.audioContext.currentTime;
        
        // Schedule beats ahead of time
        while (this.nextBeatTime < currentTime + this.scheduleAheadTime) {
            this.scheduleBeat(this.nextBeatTime);
            this.nextBeatTime += beatDuration;
        }
    }
    
    scheduleBeat(time) {
        // Calculate beat position in measure BEFORE incrementing
        const beatInMeasure = this.beatCount % this.timeSignature;
        const currentBeat = this.beatCount;
        
        // Determine if this beat should be accented
        let isAccent = false;
        
        if (this.polyrhythm && this.polyrhythm.pattern) {
            // Use polyrhythm pattern
            const patternIndex = currentBeat % this.polyrhythm.pattern.length;
            isAccent = this.polyrhythm.pattern[patternIndex] === 1;
        } else if (this.accentPattern && this.accentPattern.length > 0) {
            // Use accent pattern - beatInMeasure is 0-indexed (0 = first beat)
            isAccent = this.accentPattern[beatInMeasure] === true || this.accentPattern[beatInMeasure] === 1;
        } else {
            // Use standard accent based on accent beat and time signature
            // beatInMeasure is 0-indexed, accentBeat is 1-indexed
            const beatNumber = beatInMeasure + 1;
            isAccent = beatNumber === this.accentBeat;
        }
        
        // Schedule the beat sound at the exact time
        this.playBeatAtTime(time, isAccent);
        
        // Visual indicator callback - use the current beat count
        if (this.onBeatCallback) {
            const delay = Math.max(0, (time - this.audioContext.currentTime) * 1000);
            if (delay <= 10) {
                // Immediate or very soon - call directly
                this.onBeatCallback(beatInMeasure, isAccent);
            } else {
                // Schedule for later
                setTimeout(() => {
                    if (this.isPlaying) {
                        this.onBeatCallback(beatInMeasure, isAccent);
                    }
                }, delay);
            }
        }
        
        // Increment beat count AFTER scheduling
        this.beatCount++;
        
        // Reset beat count to prevent overflow while maintaining measure position
        if (this.beatCount >= this.timeSignature * 1000) {
            this.beatCount = this.beatCount % this.timeSignature;
        }
    }
    
    stop() {
        this.isPlaying = false;
        
        if (this.scheduleInterval) {
            clearInterval(this.scheduleInterval);
            this.scheduleInterval = null;
        }
        
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
        
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator = null;
        }
        
        this.elapsedTime = 0;
        this.currentLyricIndex = 0;
        this.beatCount = 0;
    }
    
    restart() {
        const wasPlaying = this.isPlaying;
        this.stop();
        if (wasPlaying) {
            setTimeout(() => this.play(), 10);
        }
    }
    
    playBeatAtTime(time, isAccent) {
        if (!this.audioContext) return;
        
        // Audio beep with different frequencies and volumes for accent vs normal
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Accent beats: higher pitch and louder
        // Normal beats: lower pitch and quieter
        const frequency = isAccent ? 1000 : 600;
        const volume = isAccent ? 0.5 : 0.3;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Smooth attack and release
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(volume, time + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        oscillator.start(time);
        oscillator.stop(time + 0.15);
    }
    
    // Legacy method for backwards compatibility
    playBeat() {
        this.playBeatAtTime(this.audioContext.currentTime, false);
    }
    
    checkLyrics() {
        if (!this.lyrics || this.lyrics.length === 0) return;
        
        // Find the current lyric to display
        let newIndex = 0;
        for (let i = this.lyrics.length - 1; i >= 0; i--) {
            if (this.elapsedTime >= this.lyrics[i].time) {
                newIndex = i;
                break;
            }
        }
        
        if (newIndex !== this.currentLyricIndex) {
            this.currentLyricIndex = newIndex;
            if (this.onTimeUpdateCallback) {
                this.onTimeUpdateCallback(this.elapsedTime);
            }
        }
    }
    
    getCurrentLyric() {
        if (!this.lyrics || this.lyrics.length === 0) return null;
        return this.lyrics[this.currentLyricIndex] || null;
    }
    
    getElapsedTime() {
        return this.elapsedTime;
    }
}

