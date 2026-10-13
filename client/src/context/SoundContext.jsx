import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSoundEnabled, setSoundEnabled, playBidChime, playGavelStrike, playSoldFanfare, playTimerTick, playErrorBuzzer } from '../utils/soundEffects';

const SoundContext = createContext(null);

export function SoundProvider({ children }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cpl_sound_enabled');
    if (saved !== null) {
      const isTrue = saved === 'true';
      setEnabled(isTrue);
      setSoundEnabled(isTrue);
    }
  }, []);

  const toggleSound = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      playBidChime();
    }
  };

  return (
    <SoundContext.Provider
      value={{
        enabled,
        toggleSound,
        playBidChime,
        playGavelStrike,
        playSoldFanfare,
        playTimerTick,
        playErrorBuzzer,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error('useSound must be used within SoundProvider');
  }
  return ctx;
}
