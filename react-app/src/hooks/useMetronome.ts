import { useState, useEffect, useRef, useCallback } from 'react';
import { Metronome, Subdivision } from '../metronome';
import { SoundPreset } from '../utils/metronomeSounds.js';

export function useMetronome(initialBPM: number = 120) {
  const [bpm, setBPM] = useState(initialBPM);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const metronomeRef = useRef<Metronome | null>(null);

  useEffect(() => {
    metronomeRef.current = new Metronome();
    metronomeRef.current.setBPM(bpm);
    
    // Set callback for beat updates - metronome passes (beatInMeasure, isAccent, isSubdivision)
    metronomeRef.current.setOnBeatCallback((beatInMeasure) => {
      setBeatCount(beatInMeasure);
    });

    return () => {
      if (metronomeRef.current) {
        metronomeRef.current.stop();
        setIsPlaying(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only create metronome once - BPM updates are handled separately
  
  // Sync isPlaying state periodically to catch any state mismatches
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (metronomeRef.current) {
        const metronomeIsPlaying = metronomeRef.current.isPlaying;
        setIsPlaying(prev => {
          // Only update if state actually changed to avoid unnecessary re-renders
          if (prev !== metronomeIsPlaying) {
            return metronomeIsPlaying;
          }
          return prev;
        });
      }
    }, 100);

    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    if (metronomeRef.current) {
      metronomeRef.current.setBPM(bpm);
    }
  }, [bpm]);

  const play = useCallback(() => {
    if (metronomeRef.current) {
      // Ensure audio context is resumed (required by browser autoplay policies)
      if (metronomeRef.current.audioContext && metronomeRef.current.audioContext.state === 'suspended') {
        metronomeRef.current.audioContext.resume().catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      }
      metronomeRef.current.play();
      setIsPlaying(true);
      // Sync state after a brief delay to ensure metronome is actually playing
      setTimeout(() => {
        if (metronomeRef.current && metronomeRef.current.isPlaying) {
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
        }
      }, 50);
    }
  }, []);

  const stop = useCallback(() => {
    if (metronomeRef.current) {
      metronomeRef.current.stop();
      setIsPlaying(false);
      setBeatCount(0);
      // Ensure state is synced
      if (metronomeRef.current.isPlaying) {
        // If metronome didn't stop properly, force stop
        metronomeRef.current.isPlaying = false;
      }
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  const updateBPM = useCallback((newBPM: number) => {
    setBPM(Math.max(40, Math.min(300, newBPM)));
  }, []);

  const setTimeSignature = useCallback((sig: number) => {
    if (metronomeRef.current) {
      metronomeRef.current.setTimeSignature(sig);
    }
  }, []);

  const setAccentPattern = useCallback((pattern: (boolean | number)[] | null) => {
    if (metronomeRef.current) {
      metronomeRef.current.setAccentPattern(pattern);
    }
  }, []);

  const setPolyrhythm = useCallback((pattern: number[] | null, name?: string) => {
    if (metronomeRef.current) {
      metronomeRef.current.setPolyrhythm(pattern, name);
    }
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    if (metronomeRef.current) {
      metronomeRef.current.setSoundEnabled(enabled);
    }
  }, []);

  const setSubdivision = useCallback((subdivision: Subdivision) => {
    if (metronomeRef.current) {
      metronomeRef.current.setSubdivision(subdivision);
    }
  }, []);

  const setSoundPreset = useCallback((preset: SoundPreset) => {
    if (metronomeRef.current) {
      metronomeRef.current.setSoundPreset(preset);
    }
  }, []);

  const setAccentVolume = useCallback((volume: number) => {
    if (metronomeRef.current) {
      metronomeRef.current.setAccentVolume(volume);
    }
  }, []);

  const setRegularVolume = useCallback((volume: number) => {
    if (metronomeRef.current) {
      metronomeRef.current.setRegularVolume(volume);
    }
  }, []);

  const setSubdivisionVolume = useCallback((volume: number) => {
    if (metronomeRef.current) {
      metronomeRef.current.setSubdivisionVolume(volume);
    }
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    if (metronomeRef.current) {
      metronomeRef.current.setMasterVolume(volume);
    }
  }, []);

  const setCountIn = useCallback((beats: number) => {
    if (metronomeRef.current) {
      metronomeRef.current.setCountIn(beats);
    }
  }, []);

  return {
    bpm,
    isPlaying,
    beatCount,
    updateBPM,
    play,
    stop,
    toggle,
    setTimeSignature,
    setAccentPattern,
    setPolyrhythm,
    setSoundEnabled,
    setSubdivision,
    setSoundPreset,
    setAccentVolume,
    setRegularVolume,
    setSubdivisionVolume,
    setMasterVolume,
    setCountIn,
    metronome: metronomeRef.current
  };
}

