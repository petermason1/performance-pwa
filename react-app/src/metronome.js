// Metronome Class with accurate timing and polyrhythm support

export class Metronome {
    constructor() {
        this.bpm = 120;
        this.isPlaying = false;
        this.beatCount = 0;
        this.timeSignature = 4;
        this.accentBeat = 0; // Which beat gets the accent (1-indexed, 0 = no accent) - legacy
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
            // Use modern AudioContext, fallback to webkitAudioContext for older browsers
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('Web Audio API not supported in this browser');
            }
            
            this.audioContext = new AudioContextClass();
            
            // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = 0.3;
        this.soundEnabled = true; // Default sound enabled
            
            // Handle audio context state changes
            this.audioContext.addEventListener('statechange', () => {
                if (this.audioContext.state === 'suspended' && this.isPlaying) {
                    console.warn('Audio context was suspended during playback');
                }
            });
        } catch (e) {
            console.error('Failed to initialize audio context:', e);
            this.audioContext = null;
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
        // Ensure accent beat is valid for new time signature (0 = no accent)
        if (this.accentBeat > 0) {
            this.accentBeat = Math.min(this.accentBeat, this.timeSignature);
        }
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
        // Beat is 1-indexed (1 = first beat, 0 = no accent)
        if (beat && beat > 0) {
            this.accentBeat = Math.max(1, Math.min(beat, this.timeSignature));
        } else {
            this.accentBeat = 0; // No accent
        }
    }
    
    setAccentPattern(pattern) {
        // pattern is array of booleans or numbers indicating which beats are accented
        // e.g., [true, false, false, true] or [1, 0, 0, 1]
        // Index 0 = first beat, Index 1 = second beat, etc.
        // null or empty array means no accents
        if (pattern && Array.isArray(pattern)) {
            const hasAnyAccents = pattern.some(p => p === true || p === 1 || p === '1');
            if (hasAnyAccents) {
                this.accentPattern = pattern.map(p => Boolean(p === true || p === 1 || p === '1'));
            } else {
                // All false means no accents
                this.accentPattern = null;
            }
        } else {
            this.accentPattern = null;
        }
    }
    
    getAccentBeats() {
        // Returns array of beat numbers (1-indexed) that are accented, or empty array if no accents
        if (this.polyrhythm && this.polyrhythm.pattern) {
            // For polyrhythm, return pattern length but mark accented beats
            const accented = [];
            for (let i = 0; i < this.polyrhythm.pattern.length; i++) {
                if (this.polyrhythm.pattern[i] === 1) {
                    accented.push((i % this.timeSignature) + 1);
                }
            }
            return accented.length > 0 ? accented : [];
        } else if (this.accentPattern && this.accentPattern.length > 0) {
            const accented = [];
            for (let i = 0; i < this.accentPattern.length; i++) {
                if (this.accentPattern[i]) {
                    accented.push(i + 1); // Convert to 1-indexed
                }
            }
            return accented;
        } else if (this.accentBeat && this.accentBeat > 0) {
            return [this.accentBeat];
        }
        // Default: no accents (uniform clicks)
        return [];
    }
    
    getCurrentBeatInMeasure() {
        // Returns the current beat number in the measure (1-indexed)
        return (this.beatCount % this.timeSignature) + 1;
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
            if (!this.audioContext) {
                console.error('Failed to initialize audio context');
                return;
            }
        }
        
        // Resume audio context if suspended (required by browser autoplay policies)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(err => {
                console.error('Failed to resume audio context:', err);
            });
        }
        
        this.isPlaying = true;
        this.beatCount = 0;
        this.startTime = this.audioContext.currentTime;
        this.nextBeatTime = this.audioContext.currentTime;
        this.elapsedTime = 0;
        this.currentLyricIndex = 0;
        
        // Verify BPM calculation
        const beatDuration = 60.0 / this.bpm;
        const beatsPerSecond = 1 / beatDuration;
        console.log(`Metronome starting: ${this.bpm} BPM = ${beatDuration.toFixed(3)}s per beat = ${beatsPerSecond.toFixed(2)} beats/sec`);
        
        // Use Web Audio scheduler for accurate timing
        this.scheduleBeats();
        
        // Schedule beats ahead of time (more accurate than setInterval)
        // Clear any existing interval first
        if (this.scheduleInterval) {
            clearInterval(this.scheduleInterval);
        }
        this.scheduleInterval = setInterval(() => {
            if (this.isPlaying && this.audioContext) {
                // Ensure audio context is running
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().catch(err => {
                        console.warn('Audio context suspended during playback:', err);
                        this.stop();
                    });
                }
                this.scheduleBeats();
            }
        }, this.lookahead);
        
        // Update time for lyrics and UI (check every 50ms for smooth updates)
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
        }
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
        if (!this.audioContext || !this.isPlaying) {
            return;
        }
        
        // BPM = beats per minute, so duration of one beat = 60 seconds / BPM
        // For 120 BPM: 60/120 = 0.5 seconds per beat = 2 beats per second ✓
        const beatDuration = 60.0 / this.bpm; // Duration of one beat in seconds
        const currentTime = this.audioContext.currentTime;
        const scheduleUntil = currentTime + this.scheduleAheadTime;
        
        // Schedule beats ahead of time (same logic as old working version)
        while (this.nextBeatTime < scheduleUntil) {
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
        } else if (this.accentBeat && this.accentBeat > 0) {
            // Use standard accent based on accent beat and time signature
            // beatInMeasure is 0-indexed, accentBeat is 1-indexed
            const beatNumber = beatInMeasure + 1;
            isAccent = beatNumber === this.accentBeat;
        } else {
            // No accent (default - uniform clicks)
            isAccent = false;
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
        
        // Clear scheduling interval
        if (this.scheduleInterval) {
            clearInterval(this.scheduleInterval);
            this.scheduleInterval = null;
        }
        
        // Clear time update interval
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
        
        // Stop any playing oscillators (note: oscillators are created per-beat, so we can't stop them all)
        // But we've set isPlaying = false, so no new beats will be scheduled
        
        this.elapsedTime = 0;
        this.currentLyricIndex = 0;
        this.beatCount = 0;
        this.nextBeatTime = 0;
    }
    
    restart() {
        const wasPlaying = this.isPlaying;
        this.stop();
        if (wasPlaying) {
            setTimeout(() => this.play(), 10);
        }
    }
    
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled !== false;
    }
    
    playBeatAtTime(time, isAccent) {
        if (!this.audioContext || !this.soundEnabled) return;
        
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

