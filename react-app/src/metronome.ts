// Metronome Class with accurate timing and polyrhythm support

import { MetronomeSoundEngine, SoundPreset } from './utils/metronomeSounds';
import { logger } from './utils/logger';

export interface Lyric {
  time: number;
  text: string;
}

export interface Polyrhythm {
  pattern: number[];
  name: string;
}

export type Subdivision = 'none' | 'eighth' | 'sixteenth' | 'triplet';

export type OnBeatCallback = (beatInMeasure: number, isAccent: boolean, isSubdivision: boolean) => void;
export type OnTimeUpdateCallback = (elapsedTime: number) => void;

export class Metronome {
  bpm: number;
  isPlaying: boolean;
  beatCount: number;
  timeSignature: number;
  accentBeat: number; // Which beat gets the accent (1-indexed, 0 = no accent) - legacy
  accentPattern: boolean[] | null; // Array of booleans for accent pattern [true, false, false, true]
  polyrhythm: Polyrhythm | null;
  intervalId: number | null;
  audioContext: AudioContext | null;
  gainNode: GainNode | null;
  startTime: number;
  nextBeatTime: number;
  elapsedTime: number;
  lyrics: Lyric[];
  currentLyricIndex: number;
  onBeatCallback: OnBeatCallback | null;
  onTimeUpdateCallback: OnTimeUpdateCallback | null;
  lookahead: number;
  scheduleAheadTime: number;
  scheduleInterval: number | null;
  timeUpdateInterval: number | null;
  soundEnabled: boolean;
  currentBeatNumber: number;
  subdivision: Subdivision;
  soundEngine: MetronomeSoundEngine;
  countInBeats: number;
  isCountIn: boolean;
  countInComplete: boolean;
  audioLatency: number; // Measured latency compensation

  constructor() {
    this.bpm = 120;
    this.isPlaying = false;
    this.beatCount = 0;
    this.timeSignature = 4;
    this.accentBeat = 0;
    this.accentPattern = null;
    this.polyrhythm = null;
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
    this.lookahead = 25.0;
    this.scheduleAheadTime = 0.1;
    this.scheduleInterval = null;
    this.timeUpdateInterval = null;
    this.soundEnabled = true;
    this.currentBeatNumber = 1;
    this.subdivision = 'none';
    this.countInBeats = 0;
    this.isCountIn = false;
    this.countInComplete = false;
    this.audioLatency = 0.01; // Default 10ms latency compensation

    // Initialize sound engine
    this.soundEngine = new MetronomeSoundEngine({ preset: 'click' });

    this.initAudioContext();
  }

  initAudioContext(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported in this browser');
      }

      this.audioContext = new AudioContextClass();

      // Initialize sound engine with audio context
      this.soundEngine.init(this.audioContext);

      // Keep legacy gainNode for compatibility
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0.3;

      // Measure audio latency
      this.measureLatency();

      this.audioContext.addEventListener('statechange', () => {
        if (this.audioContext?.state === 'suspended' && this.isPlaying) {
          logger.warn('Audio context was suspended during playback');
          // Auto-resume if suspended during playback
          this.audioContext?.resume().catch(err => {
            logger.error('Failed to auto-resume audio context:', err);
          });
        }
      });
    } catch (e) {
      logger.error('Failed to initialize audio context:', e);
      this.audioContext = null;
    }
  }

  measureLatency(): void {
    // Simple latency measurement - can be improved
    if (!this.audioContext) return;
    
    // Estimate latency based on buffer size and sample rate
    const bufferSize = this.audioContext.destination.channelCount * 
                      (this.audioContext.destination.maxChannelCount || 2) * 
                      128; // Typical buffer size
    const sampleRate = this.audioContext.sampleRate;
    this.audioLatency = bufferSize / sampleRate;
  }

  setBPM(bpm: number): void {
    const clamped = Math.max(40, Math.min(300, bpm));
    if (clamped === this.bpm) return;
    
    // Preserve phase of the current beat for smooth transition
    if (this.isPlaying && this.audioContext && this.nextBeatTime) {
      const currentTime = this.audioContext.currentTime;
      const oldBeatDuration = 60.0 / this.bpm;
      const newBeatDuration = 60.0 / clamped;
      
      // Previous beat start time
      const prevBeatStart = this.nextBeatTime - oldBeatDuration;
      // Elapsed fraction within the current beat (0..1)
      const elapsedInOld = Math.min(Math.max(currentTime - prevBeatStart, 0), oldBeatDuration);
      const phase = elapsedInOld / oldBeatDuration; // 0..1
      
      // Keep the same phase; adjust remaining time to next beat
      const remainingNew = (1 - phase) * newBeatDuration;
      this.nextBeatTime = Math.max(currentTime + 0.005, currentTime + remainingNew);
    }
    
    this.bpm = clamped;
  }

  setTimeSignature(signature: number): void {
    this.timeSignature = signature;
    this.beatCount = 0;
    
    if (this.accentBeat > 0) {
      this.accentBeat = Math.min(this.accentBeat, this.timeSignature);
    }
    
    if (this.accentPattern && this.accentPattern.length !== signature) {
      if (this.accentPattern.length < signature) {
        this.accentPattern = [...this.accentPattern, ...new Array(signature - this.accentPattern.length).fill(false)];
      } else {
        this.accentPattern = this.accentPattern.slice(0, signature);
      }
    }
  }

  setAccentBeat(beat: number): void {
    if (beat && beat > 0) {
      this.accentBeat = Math.max(1, Math.min(beat, this.timeSignature));
    } else {
      this.accentBeat = 0;
    }
  }

  setAccentPattern(pattern: (boolean | number)[] | null): void {
    if (pattern && Array.isArray(pattern)) {
      const hasAnyAccents = pattern.some(p => p === true || p === 1);
      if (hasAnyAccents) {
        this.accentPattern = pattern.map(p => Boolean(p === true || p === 1));
      } else {
        this.accentPattern = null;
      }
    } else {
      this.accentPattern = null;
    }
    
    // Don't restart playback - just update the pattern
    // The accent will apply naturally on the next beat based on the current beat position
    // This allows smooth accent changes without interrupting timing
  }

  getAccentBeats(): number[] {
    if (this.polyrhythm?.pattern) {
      const accented: number[] = [];
      for (let i = 0; i < this.polyrhythm.pattern.length; i++) {
        if (this.polyrhythm.pattern[i] === 1) {
          accented.push((i % this.timeSignature) + 1);
        }
      }
      return accented.length > 0 ? accented : [];
    } else if (this.accentPattern && this.accentPattern.length > 0) {
      const accented: number[] = [];
      for (let i = 0; i < this.accentPattern.length; i++) {
        if (this.accentPattern[i]) {
          accented.push(i + 1);
        }
      }
      return accented;
    } else if (this.accentBeat && this.accentBeat > 0) {
      return [this.accentBeat];
    }
    return [];
  }

  getCurrentBeatInMeasure(): number {
    return this.currentBeatNumber;
  }

  isBeatAccented(beatIndex: number): boolean {
    if (this.accentPattern && this.accentPattern.length > 0) {
      return this.accentPattern[beatIndex % this.accentPattern.length] || false;
    }
    const beatInMeasure = (beatIndex % this.timeSignature) + 1;
    return beatInMeasure === this.accentBeat;
  }

  setPolyrhythm(pattern: number[] | null, name?: string): void {
    this.polyrhythm = pattern ? { pattern, name: name || 'custom' } : null;
    this.beatCount = 0;
    this.currentBeatNumber = 1;
  }

  setLyrics(lyrics: Lyric[]): void {
    this.lyrics = lyrics || [];
    this.currentLyricIndex = 0;
  }

  setOnBeatCallback(callback: OnBeatCallback | null): void {
    this.onBeatCallback = callback;
  }

  setOnTimeUpdateCallback(callback: OnTimeUpdateCallback | null): void {
    this.onTimeUpdateCallback = callback;
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  setSubdivision(subdivision: Subdivision): void {
    this.subdivision = subdivision;
    // Reset beat count when changing subdivision
    if (this.isPlaying) {
      this.beatCount = 0;
      this.currentBeatNumber = 1;
    }
  }

  setSoundPreset(preset: SoundPreset): void {
    this.soundEngine.setPreset(preset);
  }

  setAccentVolume(volume: number): void {
    this.soundEngine.setAccentVolume(volume);
  }

  setRegularVolume(volume: number): void {
    this.soundEngine.setRegularVolume(volume);
  }

  setSubdivisionVolume(volume: number): void {
    this.soundEngine.setSubdivisionVolume(volume);
  }

  setMasterVolume(volume: number): void {
    this.soundEngine.setMasterVolume(volume);
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  setCountIn(beats: number): void {
    this.countInBeats = Math.max(0, Math.min(4, beats));
  }

  play(): void {
    if (!this.audioContext) {
      this.initAudioContext();
      if (!this.audioContext) {
        logger.error('Failed to initialize audio context');
        return;
      }
    }

    // Resume audio context if suspended (required by browser autoplay policies)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        logger.log('Audio context resumed successfully');
        this.startPlayback();
      }).catch(err => {
        logger.error('Failed to resume audio context:', err);
        // Try to start anyway - some browsers allow it
        this.startPlayback();
      });
    } else {
      this.startPlayback();
    }
  }

  private startPlayback(): void {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      logger.error('Cannot start playback: audio context unavailable or closed');
      return;
    }

    // Initialize timing and beat count
    // Add a small delay (50ms) to ensure the first beat is properly scheduled
    const beatDuration = 60.0 / this.bpm;
    this.beatCount = 0;
    this.startTime = this.audioContext.currentTime;
    this.nextBeatTime = this.audioContext.currentTime + 0.05; // Small delay to ensure proper scheduling
    this.currentBeatNumber = 1;

    // Handle count-in
    if (this.countInBeats > 0) {
      this.isCountIn = true;
      this.countInComplete = false;
    } else {
      this.isCountIn = false;
      this.countInComplete = true;
    }

    this.isPlaying = true;
    this.elapsedTime = 0;
    this.currentLyricIndex = 0;

    const beatsPerSecond = 1 / beatDuration;
    logger.log(`Metronome starting: ${this.bpm} BPM = ${beatDuration.toFixed(3)}s per beat = ${beatsPerSecond.toFixed(2)} beats/sec`);

    this.scheduleBeats();

    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
    }
    this.scheduleInterval = window.setInterval(() => {
      if (this.isPlaying && this.audioContext) {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(err => {
            logger.warn('Audio context suspended during playback:', err);
            this.stop();
          });
        }
        this.scheduleBeats();
      }
    }, this.lookahead);

    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    this.timeUpdateInterval = window.setInterval(() => {
      if (this.isPlaying && this.audioContext) {
        this.elapsedTime = this.audioContext.currentTime - this.startTime;
        this.checkLyrics();
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(this.elapsedTime);
        }
      }
    }, 50);
  }

  scheduleBeats(): void {
    if (!this.audioContext || !this.isPlaying) {
      return;
    }

    const beatDuration = 60.0 / this.bpm;
    const currentTime = this.audioContext.currentTime;
    const scheduleUntil = currentTime + this.scheduleAheadTime;

    // Calculate subdivision duration
    let subdivisionDuration = 0;
    if (this.subdivision === 'eighth') {
      subdivisionDuration = beatDuration / 2;
    } else if (this.subdivision === 'sixteenth') {
      subdivisionDuration = beatDuration / 4;
    } else if (this.subdivision === 'triplet') {
      subdivisionDuration = beatDuration / 3;
    }

    while (this.nextBeatTime < scheduleUntil) {
      // Schedule main beat
      this.scheduleBeat(this.nextBeatTime, false);

      // Schedule subdivisions if enabled
      if (subdivisionDuration > 0 && this.countInComplete) {
        if (this.subdivision === 'eighth') {
          this.scheduleBeat(this.nextBeatTime + subdivisionDuration, true);
        } else if (this.subdivision === 'sixteenth') {
          this.scheduleBeat(this.nextBeatTime + subdivisionDuration, true);
          this.scheduleBeat(this.nextBeatTime + subdivisionDuration * 2, true);
          this.scheduleBeat(this.nextBeatTime + subdivisionDuration * 3, true);
        } else if (this.subdivision === 'triplet') {
          this.scheduleBeat(this.nextBeatTime + subdivisionDuration, true);
          this.scheduleBeat(this.nextBeatTime + subdivisionDuration * 2, true);
        }
      }

      this.nextBeatTime += beatDuration;
    }
  }

  scheduleBeat(time: number, isSubdivision: boolean): void {
    // Apply latency compensation
    const compensatedTime = time - this.audioLatency;

    // Handle count-in
    if (this.isCountIn && !this.countInComplete) {
      if (this.beatCount >= this.countInBeats) {
        // Count-in complete, start actual playback
        this.isCountIn = false;
        this.countInComplete = true;
        this.beatCount = 0;
        this.startTime = this.audioContext!.currentTime;
        this.nextBeatTime = this.audioContext!.currentTime;
        this.currentBeatNumber = 1;
        return;
      }
      // Play count-in beat (always accent for visibility)
      this.playBeatAtTime(compensatedTime, true, true);
      if (this.onBeatCallback && this.audioContext) {
        const delay = Math.max(0, (compensatedTime - this.audioContext.currentTime) * 1000);
        if (delay <= 10) {
          this.onBeatCallback(this.beatCount + 1, true, true);
        } else {
          setTimeout(() => {
            if (this.isPlaying) {
              this.onBeatCallback?.(this.beatCount + 1, true, true);
            }
          }, delay);
        }
      }
      this.beatCount++;
      return;
    }

    // Normal beat scheduling
    const beatInMeasure = this.beatCount % this.timeSignature;
    const currentBeat = this.beatCount;

    let isAccent = false;

    if (this.polyrhythm?.pattern) {
      const patternIndex = currentBeat % this.polyrhythm.pattern.length;
      isAccent = this.polyrhythm.pattern[patternIndex] === 1;
    } else if (this.accentPattern && this.accentPattern.length > 0) {
      isAccent = this.accentPattern[beatInMeasure] === true;
    } else if (this.accentBeat && this.accentBeat > 0) {
      const beatNumber = beatInMeasure + 1;
      isAccent = beatNumber === this.accentBeat;
    } else {
      isAccent = false;
    }

    const displayBeatNumber = beatInMeasure + 1;
    this.currentBeatNumber = displayBeatNumber;

    this.playBeatAtTime(compensatedTime, isAccent, isSubdivision);

    if (this.onBeatCallback && this.audioContext) {
      // Use 1-based beat number for UI consistency (matches accent button labels)
      const delay = Math.max(0, (compensatedTime - this.audioContext.currentTime) * 1000);
      if (delay <= 10) {
        this.onBeatCallback(displayBeatNumber, isAccent, isSubdivision);
      } else {
        setTimeout(() => {
          if (this.isPlaying) {
            this.onBeatCallback?.(displayBeatNumber, isAccent, isSubdivision);
          }
        }, delay);
      }
    }

    if (!isSubdivision) {
      this.beatCount++;
    }
  }

  playBeatAtTime(time: number, isAccent: boolean, isSubdivision: boolean = false): void {
    if (!this.audioContext || !this.soundEnabled) {
      return;
    }

    try {
      // Use professional sound engine
      this.soundEngine.playBeat(time, isAccent, isSubdivision);
    } catch (e) {
      logger.error('Error playing beat:', e);
      // Fallback to legacy oscillator if sound engine fails
      if (this.gainNode) {
        try {
          const oscillator = this.audioContext.createOscillator();
          const envelope = this.audioContext.createGain();

          oscillator.connect(envelope);
          envelope.connect(this.gainNode);

          oscillator.frequency.value = isAccent ? 1200 : 800;
          oscillator.type = 'sine';

          envelope.gain.setValueAtTime(0, time);
          envelope.gain.linearRampToValueAtTime(0.3, time + 0.001);
          envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

          oscillator.start(time);
          oscillator.stop(time + 0.1);
        } catch (fallbackError) {
          logger.error('Fallback sound also failed:', fallbackError);
        }
      }
    }
  }

  checkLyrics(): void {
    if (!this.lyrics || this.lyrics.length === 0) {
      return;
    }

    while (
      this.currentLyricIndex < this.lyrics.length &&
      this.elapsedTime >= this.lyrics[this.currentLyricIndex]!.time
    ) {
      this.currentLyricIndex++;
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.beatCount = 0;
    this.elapsedTime = 0;
    this.currentLyricIndex = 0;
    this.currentBeatNumber = 1;
    this.isCountIn = false;
    this.countInComplete = false;

    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
      this.scheduleInterval = null;
    }

    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  restart(): void {
    this.stop();
    this.play();
  }

  toggle(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }
}

