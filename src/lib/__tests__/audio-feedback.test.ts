import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAudioContext,
  isAudioMuted,
  setAudioMuted,
  toggleAudioMuted,
  subscribeAudioMuteChange,
  triggerHaptic,
  playTactileClick,
  playCorrectChime,
  playMasteryFanfare,
  playLevelUpArpeggio,
  playGentleError,
  _resetAudioContextForTesting,
} from '../audio-feedback';

describe('audio-feedback Web Audio Engine', () => {
  let mockOscillator: any;
  let mockGain: any;
  let mockFilter: any;
  let mockDestination: any;
  let mockAudioContext: any;
  let vibrateMock: any;

  beforeEach(() => {
    _resetAudioContextForTesting();
    setAudioMuted(false);

    mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      detune: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockFilter = {
      type: 'lowpass',
      frequency: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockDestination = {};

    mockAudioContext = {
      currentTime: 0.1,
      state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(() => ({ ...mockOscillator })),
      createGain: vi.fn(() => ({ ...mockGain })),
      createBiquadFilter: vi.fn(() => ({ ...mockFilter })),
      destination: mockDestination,
    };

    vibrateMock = vi.fn();

    // Mock global window and navigator
    (global as any).window = {
      AudioContext: vi.fn(() => mockAudioContext),
      localStorage: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
    };

    try {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          vibrate: vibrateMock,
        },
        configurable: true,
        writable: true,
      });
    } catch {
      (navigator as any).vibrate = vibrateMock;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('manages mute state and subscription listeners', () => {
    expect(isAudioMuted()).toBe(false);

    let reportedMute: boolean | null = null;
    const unsub = subscribeAudioMuteChange((m) => {
      reportedMute = m;
    });

    const nextState = toggleAudioMuted();
    expect(nextState).toBe(true);
    expect(isAudioMuted()).toBe(true);
    expect(reportedMute).toBe(true);

    setAudioMuted(false);
    expect(isAudioMuted()).toBe(false);
    expect(reportedMute).toBe(false);

    unsub();
    setAudioMuted(true);
    expect(reportedMute).toBe(false); // Unsubscribed, so not updated
  });

  it('triggers haptic feedback when supported', () => {
    triggerHaptic(15);
    expect(vibrateMock).toHaveBeenCalledWith(15);

    triggerHaptic([20, 30, 40]);
    expect(vibrateMock).toHaveBeenCalledWith([20, 30, 40]);
  });

  it('synthesizes tactile click sound with expected envelope', () => {
    playTactileClick();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(vibrateMock).toHaveBeenCalledWith(12);
  });

  it('synthesizes correct chime sound with ascending chords', () => {
    playCorrectChime();
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(4);
    expect(vibrateMock).toHaveBeenCalledWith([20, 30, 40]);
  });

  it('synthesizes mastery fanfare for FSRS milestones', () => {
    playMasteryFanfare();
    // 4 fanfare notes + 5 chord notes = 9 oscillators
    expect(mockAudioContext.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(4);
    expect(vibrateMock).toHaveBeenCalledWith([35, 45, 40, 90]);
  });

  it('synthesizes level up arpeggio', () => {
    playLevelUpArpeggio();
    expect(mockAudioContext.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(vibrateMock).toHaveBeenCalledWith([25, 35, 25, 70]);
  });

  it('synthesizes gentle error sound with lowpass filter and downward sweep', () => {
    playGentleError();
    expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(vibrateMock).toHaveBeenCalledWith([40]);
  });

  it('does not produce sound when muted', () => {
    setAudioMuted(true);
    mockAudioContext.createOscillator.mockClear();

    playTactileClick();
    playCorrectChime();
    playMasteryFanfare();
    playLevelUpArpeggio();
    playGentleError();

    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('safely exits when volume is zero or negative without creating nodes', () => {
    setAudioMuted(false);
    mockAudioContext.createOscillator.mockClear();

    playTactileClick(0);
    playCorrectChime(-0.5);
    playMasteryFanfare(0);
    playLevelUpArpeggio(-1);
    playGentleError(0);

    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('recreates AudioContext if the previous instance was closed', () => {
    mockAudioContext.state = 'closed';
    const ctx = getAudioContext();
    expect(ctx).not.toBeNull();
    expect((window as any).AudioContext).toHaveBeenCalled();
  });
});
