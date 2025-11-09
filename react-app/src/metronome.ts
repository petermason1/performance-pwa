// Metronome Class with accurate timing and polyrhythm support

export interface Lyric {
  time: number;
  text: string;
}

export interface Polyrhythm {
  pattern: number[];
  name: string;
}

export type OnBeatCallback = (beatInMeasure: number, isAccent: boolean) => void;
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

    this.initAudioContext();
  }

  initAudioContext(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported in this browser');
      }

      this.audioContext = new AudioContextClass();

      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0.3;

      this.audioContext.addEventListener('statechange', () => {
        if (this.audioContext?.state === 'suspended' && this.isPlaying) {
          console.warn('Audio context was suspended during playback');
        }
      });
    } catch (e) {
      console.error('Failed to initialize audio context:', e);
      this.audioContext = null;
    }
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
    
    // Realign measure boundary so "1" matches downbeat immediately
    if (this.isPlaying && this.audioContext) {
      const now = this.audioContext.currentTime;
      const beatDuration = 60.0 / this.bpm;
      this.beatCount = 0;
      this.startTime = now;
      this.nextBeatTime = now + beatDuration;
      this.currentBeatNumber = 1;
    }
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

  play(): void {
    if (!this.audioContext) {
      this.initAudioContext();
      if (!this.audioContext) {
        console.error('Failed to initialize audio context');
        return;
      }
    }

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
    this.currentBeatNumber = 1;

    const beatDuration = 60.0 / this.bpm;
    const beatsPerSecond = 1 / beatDuration;
    console.log(`Metronome starting: ${this.bpm} BPM = ${beatDuration.toFixed(3)}s per beat = ${beatsPerSecond.toFixed(2)} beats/sec`);

    this.scheduleBeats();

    if (this.scheduleInterval) {
      clearInterval(this.scheduleInterval);
    }
    this.scheduleInterval = window.setInterval(() => {
      if (this.isPlaying && this.audioContext) {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(err => {
            console.warn('Audio context suspended during playback:', err);
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

    while (this.nextBeatTime < scheduleUntil) {
      this.scheduleBeat(this.nextBeatTime);
      this.nextBeatTime += beatDuration;
    }
  }

  scheduleBeat(time: number): void {
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

    this.playBeatAtTime(time, isAccent);

    if (this.onBeatCallback && this.audioContext) {
      // Use 1-based beat number for UI consistency (matches accent button labels)
      const delay = Math.max(0, (time - this.audioContext.currentTime) * 1000);
      if (delay <= 10) {
        this.onBeatCallback(displayBeatNumber, isAccent);
      } else {
        setTimeout(() => {
          if (this.isPlaying) {
            this.onBeatCallback?.(displayBeatNumber, isAccent);
          }
        }, delay);
      }
    }

    this.beatCount++;
  }

  playBeatAtTime(time: number, isAccent: boolean): void {
    if (!this.audioContext || !this.gainNode || !this.soundEnabled) {
      return;
    }

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
    } catch (e) {
      console.error('Error playing beat:', e);
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

