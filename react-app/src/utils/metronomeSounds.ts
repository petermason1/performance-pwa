// Professional metronome sound generation
// Uses Web Audio API to create high-quality click sounds

export type SoundPreset = 'wood' | 'click' | 'beep' | 'tick' | 'electronic';

export interface SoundConfig {
  preset: SoundPreset;
  accentVolume: number; // 0-1
  regularVolume: number; // 0-1
  subdivisionVolume: number; // 0-1
}

export class MetronomeSoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private accentGain: GainNode | null = null;
  private regularGain: GainNode | null = null;
  private subdivisionGain: GainNode | null = null;
  private config: SoundConfig;

  constructor(config: Partial<SoundConfig> = {}) {
    this.config = {
      preset: config.preset || 'click',
      accentVolume: config.accentVolume ?? 0.8,
      regularVolume: config.regularVolume ?? 0.5,
      subdivisionVolume: config.subdivisionVolume ?? 0.3,
    };
  }

  init(audioContext: AudioContext): void {
    this.audioContext = audioContext;
    
    // Create gain nodes for volume control
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = 0.3; // Master volume
    this.masterGain.connect(audioContext.destination);

    this.accentGain = audioContext.createGain();
    this.accentGain.gain.value = this.config.accentVolume;
    this.accentGain.connect(this.masterGain);

    this.regularGain = audioContext.createGain();
    this.regularGain.gain.value = this.config.regularVolume;
    this.regularGain.connect(this.masterGain);

    this.subdivisionGain = audioContext.createGain();
    this.subdivisionGain.gain.value = this.config.subdivisionVolume;
    this.subdivisionGain.connect(this.masterGain);
  }

  setPreset(preset: SoundPreset): void {
    this.config.preset = preset;
  }

  setAccentVolume(volume: number): void {
    this.config.accentVolume = Math.max(0, Math.min(1, volume));
    if (this.accentGain) {
      this.accentGain.gain.value = this.config.accentVolume;
    }
  }

  setRegularVolume(volume: number): void {
    this.config.regularVolume = Math.max(0, Math.min(1, volume));
    if (this.regularGain) {
      this.regularGain.gain.value = this.config.regularVolume;
    }
  }

  setSubdivisionVolume(volume: number): void {
    this.config.subdivisionVolume = Math.max(0, Math.min(1, volume));
    if (this.subdivisionGain) {
      this.subdivisionGain.gain.value = this.config.subdivisionVolume;
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  playBeat(time: number, isAccent: boolean, isSubdivision: boolean = false): void {
    if (!this.audioContext) return;

    const gainNode = isAccent 
      ? this.accentGain 
      : isSubdivision 
        ? this.subdivisionGain 
        : this.regularGain;

    if (!gainNode) return;

    switch (this.config.preset) {
      case 'wood':
        this.playWoodBlock(time, gainNode, isAccent);
        break;
      case 'click':
        this.playClick(time, gainNode, isAccent);
        break;
      case 'beep':
        this.playBeep(time, gainNode, isAccent);
        break;
      case 'tick':
        this.playTick(time, gainNode, isAccent);
        break;
      case 'electronic':
        this.playElectronic(time, gainNode, isAccent);
        break;
    }
  }

  private playWoodBlock(time: number, gainNode: GainNode, isAccent: boolean): void {
    if (!this.audioContext) return;

    // Wood block: short, percussive sound with rich harmonics
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    
    const baseFreq = isAccent ? 800 : 600;
    osc1.frequency.value = baseFreq;
    osc2.frequency.value = baseFreq * 2.5; // Harmonic

    osc1.connect(envelope);
    osc2.connect(envelope);
    envelope.connect(gainNode);

    // Sharp attack, quick decay
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(isAccent ? 0.6 : 0.4, time + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

    osc1.start(time);
    osc1.stop(time + 0.08);
    osc2.start(time);
    osc2.stop(time + 0.08);
  }

  private playClick(time: number, gainNode: GainNode, isAccent: boolean): void {
    if (!this.audioContext) return;

    // Classic metronome click: sharp, clean
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.value = isAccent ? 1200 : 1000;

    osc.connect(envelope);
    envelope.connect(gainNode);

    // Very sharp attack, very quick decay
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(isAccent ? 0.5 : 0.35, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playBeep(time: number, gainNode: GainNode, isAccent: boolean): void {
    if (!this.audioContext) return;

    // Simple beep: clean sine wave
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = isAccent ? 1200 : 800;

    osc.connect(envelope);
    envelope.connect(gainNode);

    // Smooth attack and decay
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(isAccent ? 0.4 : 0.3, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playTick(time: number, gainNode: GainNode, isAccent: boolean): void {
    if (!this.audioContext) return;

    // Tick: very short, subtle
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = isAccent ? 1000 : 800;

    osc.connect(envelope);
    envelope.connect(gainNode);

    // Ultra-short tick
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(isAccent ? 0.3 : 0.2, time + 0.0005);
    envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.03);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  private playElectronic(time: number, gainNode: GainNode, isAccent: boolean): void {
    if (!this.audioContext) return;

    // Electronic: modern, crisp sound with filter sweep
    const osc = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const envelope = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.value = isAccent ? 1500 : 1200;

    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 10;

    osc.connect(filter);
    filter.connect(envelope);
    envelope.connect(gainNode);

    // Filter sweep for character
    filter.frequency.setValueAtTime(2000, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + 0.05);

    // Sharp attack, medium decay
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(isAccent ? 0.5 : 0.35, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  dispose(): void {
    // Clean up audio nodes
    this.accentGain = null;
    this.regularGain = null;
    this.subdivisionGain = null;
    this.masterGain = null;
    this.audioContext = null;
  }
}

