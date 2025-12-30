import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const SoundContext = createContext(null);

// Kahoot-style sound generator - short, positive, motivational sounds
class KahootSoundGenerator {
  constructor() {
    this.audioContext = null;
  }

  getContext() {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  // Kahoot-style correct answer sound - quick upbeat "ding-ding!"
  playSuccess() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Quick double-ding like Kahoot
    const notes = [
      { freq: 880, time: 0, duration: 0.08 },      // A5
      { freq: 1108.73, time: 0.1, duration: 0.15 } // C#6 (higher, brighter)
    ];
    
    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.4, now + note.time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    });
  }

  // Kahoot-style wrong answer - quick "boop" (not harsh)
  playError() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.15);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Kahoot-style level up - quick celebratory jingle
  playLevelUp() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Quick ascending celebration
    const notes = [
      { freq: 523.25, time: 0, duration: 0.08 },    // C5
      { freq: 659.25, time: 0.08, duration: 0.08 }, // E5
      { freq: 783.99, time: 0.16, duration: 0.08 }, // G5
      { freq: 1046.50, time: 0.24, duration: 0.2 }  // C6 (held longer)
    ];
    
    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle'; // Softer than sine
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.35, now + note.time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    });
  }

  // Kahoot-style badge earned - sparkle sound
  playBadge() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Quick sparkle effect
    const sparkles = [
      { freq: 1318.51, time: 0 },    // E6
      { freq: 1567.98, time: 0.05 }, // G6
      { freq: 1760.00, time: 0.1 },  // A6
      { freq: 2093.00, time: 0.15 }  // C7
    ];
    
    sparkles.forEach((note, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.2, now + note.time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.time);
      osc.stop(now + note.time + 0.15);
    });
  }

  // Kahoot-style daily challenge complete - victory fanfare
  playChallengeComplete() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Quick victory sequence
    const melody = [
      { freq: 659.25, time: 0, duration: 0.1 },     // E5
      { freq: 783.99, time: 0.1, duration: 0.1 },   // G5
      { freq: 987.77, time: 0.2, duration: 0.1 },   // B5
      { freq: 1046.50, time: 0.3, duration: 0.25 }  // C6
    ];
    
    melody.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(0.3, now + note.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    });
  }

  // Simple click feedback
  playClick() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('mathnashed_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const soundGeneratorRef = useRef(null);

  useEffect(() => {
    soundGeneratorRef.current = new KahootSoundGenerator();
  }, []);

  useEffect(() => {
    localStorage.setItem('mathnashed_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const playSound = useCallback((type) => {
    if (!soundEnabled || !soundGeneratorRef.current) return;
    
    try {
      switch (type) {
        case 'success':
          soundGeneratorRef.current.playSuccess();
          break;
        case 'error':
          soundGeneratorRef.current.playError();
          break;
        case 'levelUp':
          soundGeneratorRef.current.playLevelUp();
          break;
        case 'badge':
          soundGeneratorRef.current.playBadge();
          break;
        case 'challengeComplete':
          soundGeneratorRef.current.playChallengeComplete();
          break;
        case 'click':
          soundGeneratorRef.current.playClick();
          break;
        default:
          break;
      }
    } catch (e) {
      console.log('Sound playback error:', e);
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return (
    <SoundContext.Provider value={{
      soundEnabled,
      playSound,
      toggleSound
    }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
