import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const SoundContext = createContext(null);

// Web Audio API based sound generator for child-friendly sounds
class SoundGenerator {
  constructor() {
    this.audioContext = null;
    this.backgroundMusicGain = null;
    this.backgroundOscillators = [];
    this.isPlayingMusic = false;
  }

  getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Success sound - cheerful ascending notes
  playSuccess() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - Major chord arpeggio
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  // Error sound - gentle two-note hint
  playError() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    const frequencies = [392, 329.63]; // G4, E4 - gentle descending
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.3);
    });
  }

  // Level up sound - triumphant fanfare
  playLevelUp() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Fanfare sequence: C5, E5, G5, C6
    const frequencies = [523.25, 659.25, 783.99, 1046.50];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      const startTime = now + i * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.03);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });

    // Add a final sustained chord
    setTimeout(() => {
      const chordFreqs = [523.25, 659.25, 783.99];
      chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.9);
      });
    }, 500);
  }

  // Badge earned sound - magical sparkle
  playBadge() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Sparkle effect with high frequencies
    const sparkleFreqs = [1318.51, 1567.98, 2093.00, 1760.00, 2349.32];
    
    sparkleFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      const startTime = now + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  // Click sound - subtle feedback
  playClick() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Background music - gentle, looping melody
  startBackgroundMusic() {
    if (this.isPlayingMusic) return;
    
    const ctx = this.getContext();
    this.backgroundMusicGain = ctx.createGain();
    this.backgroundMusicGain.gain.setValueAtTime(0.08, ctx.currentTime);
    this.backgroundMusicGain.connect(ctx.destination);
    
    this.isPlayingMusic = true;
    this.playMelodyLoop();
  }

  playMelodyLoop() {
    if (!this.isPlayingMusic) return;
    
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    // Simple, calming pentatonic melody
    const melody = [
      { freq: 392.00, duration: 0.5 },   // G4
      { freq: 440.00, duration: 0.5 },   // A4
      { freq: 523.25, duration: 0.75 },  // C5
      { freq: 440.00, duration: 0.5 },   // A4
      { freq: 392.00, duration: 0.75 },  // G4
      { freq: 329.63, duration: 0.5 },   // E4
      { freq: 392.00, duration: 1.0 },   // G4
      { freq: 0, duration: 0.5 },        // Rest
    ];
    
    let time = now;
    melody.forEach(note => {
      if (note.freq > 0 && this.backgroundMusicGain) {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, time);
        
        noteGain.gain.setValueAtTime(0, time);
        noteGain.gain.linearRampToValueAtTime(1, time + 0.05);
        noteGain.gain.linearRampToValueAtTime(0.7, time + note.duration * 0.7);
        noteGain.gain.linearRampToValueAtTime(0, time + note.duration);
        
        osc.connect(noteGain);
        noteGain.connect(this.backgroundMusicGain);
        
        osc.start(time);
        osc.stop(time + note.duration + 0.1);
        
        this.backgroundOscillators.push(osc);
      }
      time += note.duration;
    });
    
    // Loop the melody
    const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
    setTimeout(() => {
      if (this.isPlayingMusic) {
        this.playMelodyLoop();
      }
    }, totalDuration * 1000);
  }

  stopBackgroundMusic() {
    this.isPlayingMusic = false;
    
    this.backgroundOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator may have already stopped
      }
    });
    this.backgroundOscillators = [];
    
    if (this.backgroundMusicGain) {
      this.backgroundMusicGain.disconnect();
      this.backgroundMusicGain = null;
    }
  }
}

export const SoundProvider = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('mathevilla_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem('mathevilla_music');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const soundGeneratorRef = useRef(null);

  // Initialize sound generator
  useEffect(() => {
    soundGeneratorRef.current = new SoundGenerator();
    
    return () => {
      if (soundGeneratorRef.current) {
        soundGeneratorRef.current.stopBackgroundMusic();
      }
    };
  }, []);

  // Handle music toggle
  useEffect(() => {
    if (soundGeneratorRef.current) {
      if (musicEnabled && soundEnabled) {
        soundGeneratorRef.current.startBackgroundMusic();
      } else {
        soundGeneratorRef.current.stopBackgroundMusic();
      }
    }
  }, [musicEnabled, soundEnabled]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('mathevilla_sound', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('mathevilla_music', JSON.stringify(musicEnabled));
  }, [musicEnabled]);

  const playSound = useCallback((type) => {
    if (!soundEnabled || !soundGeneratorRef.current) return;
    
    // Ensure audio context is resumed (required after user interaction)
    const ctx = soundGeneratorRef.current.getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
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
      case 'click':
        soundGeneratorRef.current.playClick();
        break;
      default:
        break;
    }
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicEnabled(prev => !prev);
  }, []);

  return (
    <SoundContext.Provider value={{
      soundEnabled,
      musicEnabled,
      playSound,
      toggleSound,
      toggleMusic
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
