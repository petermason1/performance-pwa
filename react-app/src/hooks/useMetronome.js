import { useState, useEffect, useRef, useCallback } from 'react';
import { Metronome } from '../metronome.js';

export function useMetronome(initialBPM = 120) {
  const [bpm, setBPM] = useState(initialBPM);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const metronomeRef = useRef(null);

  useEffect(() => {
    metronomeRef.current = new Metronome();
    metronomeRef.current.setBPM(bpm);
    
    // Set callback for beat updates - metronome passes (beatInMeasure, isAccent)
    metronomeRef.current.setOnBeatCallback((beatInMeasure) => {
      setBeatCount(beatInMeasure);
    });

    return () => {
      if (metronomeRef.current) {
        metronomeRef.current.stop();
        setIsPlaying(false);
      }
    };
  }, []);
  
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

  const updateBPM = useCallback((newBPM) => {
    setBPM(Math.max(40, Math.min(300, newBPM)));
  }, []);

  const setTimeSignature = useCallback((sig) => {
    if (metronomeRef.current) {
      metronomeRef.current.setTimeSignature(sig);
    }
  }, []);

  const setAccentPattern = useCallback((pattern) => {
    if (metronomeRef.current) {
      metronomeRef.current.setAccentPattern(pattern);
    }
  }, []);

  const setPolyrhythm = useCallback((pattern, name) => {
    if (metronomeRef.current) {
      metronomeRef.current.setPolyrhythm(pattern, name);
    }
  }, []);

  const setSoundEnabled = useCallback((enabled) => {
    if (metronomeRef.current) {
      metronomeRef.current.setSoundEnabled(enabled);
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
    metronome: metronomeRef.current
  };
}

