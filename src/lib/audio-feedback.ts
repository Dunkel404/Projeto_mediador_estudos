/**
 * Native Web Audio API Sound & Haptic Feedback Engine
 * Zero external audio libraries - purely synthesized waveform DSP.
 */

// Track audio mute state
let audioMuted = false;
let audioContext: AudioContext | null = null;
const muteChangeListeners = new Set<(muted: boolean) => void>();

// Initialize mute state from localStorage if available in browser
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('shadermath_audio_muted');
    if (saved !== null) {
      audioMuted = saved === 'true';
    }
  } catch {
    // LocalStorage might be disabled in private/restricted mode
  }

  // Pre-unlock AudioContext on first user gesture for mobile / Safari autoplay policy
  const unlockAudio = () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
}

/**
 * Returns or initializes the shared AudioContext lazily on user interaction.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioContext || audioContext.state === 'closed') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioContext = new AudioCtxClass();
      }
    }

    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    return audioContext;
  } catch (err) {
    console.warn('AudioContext initialization failed:', err);
    return null;
  }
}

/**
 * Reset audio context (primarily for unit tests)
 */
export function _resetAudioContextForTesting(): void {
  audioContext = null;
}

/**
 * Check if audio feedback is currently muted
 */
export function isAudioMuted(): boolean {
  return audioMuted;
}

/**
 * Set audio mute status and notify subscribers
 */
export function setAudioMuted(muted: boolean): void {
  audioMuted = muted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('shadermath_audio_muted', String(muted));
    } catch {}
  }
  muteChangeListeners.forEach((listener) => {
    try {
      listener(muted);
    } catch {}
  });
}

/**
 * Toggle audio mute status
 */
export function toggleAudioMuted(): boolean {
  const next = !audioMuted;
  setAudioMuted(next);
  return next;
}

/**
 * Subscribe to mute status changes
 */
export function subscribeAudioMuteChange(listener: (muted: boolean) => void): () => void {
  muteChangeListeners.add(listener);
  return () => {
    muteChangeListeners.delete(listener);
  };
}

/**
 * Trigger physical haptic feedback via navigator.vibrate if supported.
 */
export function triggerHaptic(pattern: number | number[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {}
}

/**
 * 1. Tactile Click Sound
 * Short snappy high-frequency pop/click for UI buttons and tactile stones.
 */
export function playTactileClick(volume: number = 0.8): void {
  triggerHaptic(12);
  if (audioMuted || volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Fast frequency drop from 1800Hz to 380Hz for mechanical pop
    osc.frequency.setValueAtTime(1800, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.022);

    // Snappy attack and quick decay - strictly non-zero for exponential ramps
    const startGain = Math.max(0.0001, 0.12 * volume);
    gain.gain.setValueAtTime(startGain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);

    const cleanup = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.onended = cleanup;
    osc.start(t);
    osc.stop(t + 0.025);

    // Safety fallback cleanup
    setTimeout(cleanup, 100);
  } catch (e) {
    console.debug('playTactileClick error:', e);
  }
}

/**
 * 2. Correct Chime Sound
 * Harmonious uplifting major triad chime with shimmering sine waves.
 * E5 (659.25Hz) -> G#5 (830.61Hz) -> B5 (987.77Hz) -> E6 (1318.51Hz)
 */
export function playCorrectChime(volume: number = 0.85): void {
  triggerHaptic([20, 30, 40]);
  if (audioMuted || volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const notes = [
      { freq: 659.25, offset: 0.0, dur: 0.45 },   // E5
      { freq: 830.61, offset: 0.06, dur: 0.48 },  // G#5
      { freq: 987.77, offset: 0.12, dur: 0.52 },  // B5
      { freq: 1318.51, offset: 0.18, dur: 0.65 }, // E6 Sparkle
    ];

    notes.forEach(({ freq, offset, dur }) => {
      const startTime = t + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Warm attack and gentle bell exponential release
      const peakGain = Math.max(0.0001, 0.15 * volume);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      const cleanup = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.onended = cleanup;
      osc.start(startTime);
      osc.stop(startTime + dur + 0.02);

      setTimeout(cleanup, (offset + dur + 0.1) * 1000);
    });
  } catch (e) {
    console.debug('playCorrectChime error:', e);
  }
}

/**
 * 3. FSRS Milestone / Node Mastery Fanfare
 * Victorious triumphant brass/synth fanfare with sustained chorus shimmer.
 */
export function playMasteryFanfare(volume: number = 1.0): void {
  triggerHaptic([35, 45, 40, 90]);
  if (audioMuted || volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;

    // Arpeggio fanfare steps: C5 -> E5 -> G5 -> C6 -> E6
    const fanfareNotes = [
      { freq: 523.25, time: t + 0.0, dur: 0.16 }, // C5
      { freq: 659.25, time: t + 0.12, dur: 0.16 }, // E5
      { freq: 783.99, time: t + 0.24, dur: 0.18 }, // G5
      { freq: 1046.50, time: t + 0.38, dur: 0.8 }, // C6
    ];

    fanfareNotes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      const peakGain = Math.max(0.0001, 0.18 * volume);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(peakGain, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      const cleanup = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.onended = cleanup;
      osc.start(time);
      osc.stop(time + dur + 0.02);

      setTimeout(cleanup, (time - t + dur + 0.1) * 1000);
    });

    // Sustained victory chord at t + 0.38
    const chordTime = t + 0.38;
    const chordFrequencies = [523.25, 659.25, 783.99, 1046.5, 1318.51];

    chordFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Subtle detune for lush brassy chorus
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, chordTime);
      if (idx > 0) {
        osc.detune.setValueAtTime((idx % 2 === 0 ? 4 : -4), chordTime);
      }

      const chordDur = 1.1;
      const peakChordGain = Math.max(0.0001, 0.12 * volume);
      gain.gain.setValueAtTime(0.0001, chordTime);
      gain.gain.linearRampToValueAtTime(peakChordGain, chordTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, chordTime + chordDur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      const cleanup = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.onended = cleanup;
      osc.start(chordTime);
      osc.stop(chordTime + chordDur + 0.05);

      setTimeout(cleanup, (0.38 + chordDur + 0.2) * 1000);
    });
  } catch (e) {
    console.debug('playMasteryFanfare error:', e);
  }
}

/**
 * 4. Level-Up Arpeggio Sound
 * Fast ascending sparkling arpeggio with high twinkle harmonics.
 */
export function playLevelUpArpeggio(volume: number = 0.9): void {
  triggerHaptic([25, 35, 25, 70]);
  if (audioMuted || volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const steps = [
      { freq: 587.33, offset: 0.0 },   // D5
      { freq: 739.99, offset: 0.06 },  // F#5
      { freq: 880.00, offset: 0.12 },  // A5
      { freq: 1174.66, offset: 0.18 }, // D6
      { freq: 1479.98, offset: 0.24 }, // F#6
      { freq: 1760.00, offset: 0.30 }, // A6
      { freq: 2349.32, offset: 0.38 }, // D7 (Twinkle)
    ];

    steps.forEach(({ freq, offset }) => {
      const startTime = t + offset;
      const dur = offset >= 0.3 ? 0.6 : 0.25;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const peakStepGain = Math.max(0.0001, 0.13 * volume);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(peakStepGain, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      const cleanup = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.onended = cleanup;
      osc.start(startTime);
      osc.stop(startTime + dur + 0.02);

      setTimeout(cleanup, (offset + dur + 0.1) * 1000);
    });
  } catch (e) {
    console.debug('playLevelUpArpeggio error:', e);
  }
}

/**
 * 5. Gentle Error Sound
 * Soft, low-pitch warm downward sweep with lowpass filtering.
 * Non-punitive and informative.
 */
export function playGentleError(volume: number = 0.75): void {
  triggerHaptic([40]);
  if (audioMuted || volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Warm triangle wave with lowpass filtering
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, t);

    const safeGain = Math.max(0.0001, 0.13 * volume);
    gain.gain.setValueAtTime(safeGain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const cleanup = () => {
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.onended = cleanup;
    osc.start(t);
    osc.stop(t + 0.2);

    setTimeout(cleanup, 250);
  } catch (e) {
    console.debug('playGentleError error:', e);
  }
}
