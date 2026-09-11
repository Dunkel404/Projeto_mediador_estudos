import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Dexie db to avoid MissingAPIError IndexedDB in pure Node.js test environment
vi.mock('../db', () => {
  return {
    db: {
      userNodes: {
        put: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        toArray: vi.fn().mockResolvedValue([]),
        clear: vi.fn().mockResolvedValue(undefined),
      },
      fsrsCards: {
        put: vi.fn().mockResolvedValue(undefined),
        toArray: vi.fn().mockResolvedValue([]),
        clear: vi.fn().mockResolvedValue(undefined),
      },
      attempts: {
        add: vi.fn().mockResolvedValue(1),
        toArray: vi.fn().mockResolvedValue([]),
        clear: vi.fn().mockResolvedValue(undefined),
      },
      settings: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      dynamicSubmodules: {
        toArray: vi.fn().mockResolvedValue([]),
        put: vi.fn().mockResolvedValue(undefined),
      },
    },
  };
});

import { useAppStore, calculateFocusMultiplier } from '../store';
import { CURRICULUM_NODES } from '@/core/curriculum/nodes';

describe('Gamification Engine & Dopamine Store Integration', () => {
  beforeEach(() => {
    useAppStore.setState({
      nodes: CURRICULUM_NODES,
      progressMap: {
        t0_algebra_fma: {
          nodeId: 't0_algebra_fma',
          status: 'available',
          scoreKnowledge: 0,
          score3D: 0,
          proficiencyLevel: 'Inicial',
          responseSpeed: 'Moderada',
          attentionPoints: [],
          totalAttempts: 0,
          correctAttempts: 0,
          submoduleProgressMap: {},
        },
      },
      currentStreak: 0,
      bestStreak: 0,
      focusMultiplier: 1.0,
      activeCelebration: null,
    });
  });

  it('calculates focus multipliers according to streak thresholds', () => {
    expect(calculateFocusMultiplier(0)).toBe(1.0);
    expect(calculateFocusMultiplier(1)).toBe(1.0);
    expect(calculateFocusMultiplier(2)).toBe(1.0);
    expect(calculateFocusMultiplier(3)).toBe(1.2);
    expect(calculateFocusMultiplier(4)).toBe(1.2);
    expect(calculateFocusMultiplier(5)).toBe(1.5);
    expect(calculateFocusMultiplier(9)).toBe(1.5);
    expect(calculateFocusMultiplier(10)).toBe(2.0);
    expect(calculateFocusMultiplier(19)).toBe(2.0);
    expect(calculateFocusMultiplier(20)).toBe(2.5);
    expect(calculateFocusMultiplier(50)).toBe(2.5);
  });

  it('increments streak and calculates focus multiplier on correct attempt', async () => {
    const store = useAppStore.getState();

    await store.recordExerciseAttempt({
      nodeId: 't0_algebra_fma',
      scoreKnowledge: 70,
      score3D: 5,
      timeSpentSeconds: 20,
      timeLimitSeconds: 90,
      userAnswer: 'ans1',
      isCorrect: true,
    });

    let state = useAppStore.getState();
    expect(state.currentStreak).toBe(1);
    expect(state.focusMultiplier).toBe(1.0);

    // Second correct attempt
    await state.recordExerciseAttempt({
      nodeId: 't0_algebra_fma',
      scoreKnowledge: 75,
      score3D: 6,
      timeSpentSeconds: 15,
      timeLimitSeconds: 90,
      userAnswer: 'ans2',
      isCorrect: true,
    });

    state = useAppStore.getState();
    expect(state.currentStreak).toBe(2);

    // Third correct attempt - triggers combo 3x milestone celebration!
    await state.recordExerciseAttempt({
      nodeId: 't0_algebra_fma',
      scoreKnowledge: 80,
      score3D: 7,
      timeSpentSeconds: 12,
      timeLimitSeconds: 90,
      userAnswer: 'ans3',
      isCorrect: true,
    });

    state = useAppStore.getState();
    expect(state.currentStreak).toBe(3);
    expect(state.focusMultiplier).toBe(1.2);
    expect(state.activeCelebration).not.toBeNull();
    expect(state.activeCelebration?.type).toBe('streak_milestone');
    expect(state.activeCelebration?.multiplier).toBe(1.2);
  });

  it('resets streak to zero and multiplier to 1.0 on incorrect attempt', async () => {
    useAppStore.setState({
      currentStreak: 4,
      bestStreak: 4,
      focusMultiplier: 1.2,
    });

    const store = useAppStore.getState();
    await store.recordExerciseAttempt({
      nodeId: 't0_algebra_fma',
      scoreKnowledge: 20,
      score3D: 1,
      timeSpentSeconds: 80,
      timeLimitSeconds: 90,
      userAnswer: 'wrong',
      isCorrect: false,
    });

    const state = useAppStore.getState();
    expect(state.currentStreak).toBe(0);
    expect(state.bestStreak).toBe(4);
    expect(state.focusMultiplier).toBe(1.0);
  });

  it('triggers mastery celebration when node is mastered for the first time', async () => {
    const store = useAppStore.getState();

    await store.recordExerciseAttempt({
      nodeId: 't0_algebra_fma',
      scoreKnowledge: 92,
      score3D: 9,
      timeSpentSeconds: 25,
      timeLimitSeconds: 90,
      userAnswer: 'perfect',
      isCorrect: true,
    });

    const state = useAppStore.getState();
    expect(state.progressMap['t0_algebra_fma'].status).toBe('mastered');
    expect(state.activeCelebration).not.toBeNull();
    expect(state.activeCelebration?.type).toBe('mastery');
    expect(state.activeCelebration?.title).toContain('DOMÍNIO ESPACIAL');
  });

  it('triggers submodule_complete celebration when submodule is validated', async () => {
    const store = useAppStore.getState();

    await store.recordExerciseAttempt({
      nodeId: 't0_algebra_fma',
      subModuleId: 'sub_t0_1',
      scoreKnowledge: 88,
      score3D: 6,
      timeSpentSeconds: 30,
      timeLimitSeconds: 90,
      userAnswer: 'submodule_ans',
      isCorrect: true,
    });

    const state = useAppStore.getState();
    expect(state.activeCelebration).not.toBeNull();
    expect(state.activeCelebration?.type).toBe('submodule_complete');
    expect(state.activeCelebration?.title).toContain('SUBMÓDULO');
  });

  it('triggers fsrs_milestone celebration when recovering from critical decay', async () => {
    useAppStore.setState((prev) => ({
      progressMap: {
        ...prev.progressMap,
        t0_algebra_fma: {
          ...prev.progressMap['t0_algebra_fma'],
          status: 'critical_decay',
        },
      },
    }));

    const store = useAppStore.getState();
    await store.recordExerciseAttempt({
      nodeId: 't0_algebra_fma',
      scoreKnowledge: 75,
      score3D: 6,
      timeSpentSeconds: 30,
      timeLimitSeconds: 90,
      userAnswer: 'recovered',
      isCorrect: true,
    });

    const state = useAppStore.getState();
    expect(state.activeCelebration).not.toBeNull();
    expect(state.activeCelebration?.type).toBe('fsrs_milestone');
    expect(state.activeCelebration?.title).toContain('FSRS');
  });

  it('triggers level_up celebration when proficiency advances from Inicial to Alto/Altíssimo', async () => {
    useAppStore.setState((prev) => ({
      progressMap: {
        ...prev.progressMap,
        t0_algebra_fma: {
          ...prev.progressMap['t0_algebra_fma'],
          status: 'available',
          proficiencyLevel: 'Inicial',
          scoreKnowledge: 40,
        },
      },
    }));

    const store = useAppStore.getState();
    await store.recordExerciseAttempt({
      nodeId: 't0_algebra_fma',
      scoreKnowledge: 78, // Advances to 'Alto'
      score3D: 6,
      timeSpentSeconds: 30,
      timeLimitSeconds: 90,
      userAnswer: 'leveling_up',
      isCorrect: true,
    });

    const state = useAppStore.getState();
    expect(state.progressMap['t0_algebra_fma'].proficiencyLevel).toBe('Alto');
    expect(state.activeCelebration).not.toBeNull();
    expect(state.activeCelebration?.type).toBe('level_up');
    expect(state.activeCelebration?.title).toContain('NÍVEL DE RETENÇÃO');
  });

  it('triggers streak celebration on extended milestones like 30 and 50', async () => {
    useAppStore.setState({
      currentStreak: 29,
      bestStreak: 29,
      focusMultiplier: 2.5,
    });

    const store = useAppStore.getState();
    await store.recordExerciseAttempt({
      nodeId: 't0_algebra_fma',
      scoreKnowledge: 70,
      score3D: 5,
      timeSpentSeconds: 30,
      timeLimitSeconds: 90,
      userAnswer: 'combo_30',
      isCorrect: true,
    });

    const state = useAppStore.getState();
    expect(state.currentStreak).toBe(30);
    expect(state.activeCelebration).not.toBeNull();
    expect(state.activeCelebration?.type).toBe('streak_milestone');
    expect(state.activeCelebration?.title).toContain('30X');
  });

  it('dismisses active celebration via dismissCelebration', () => {
    useAppStore.setState({
      activeCelebration: {
        id: 'test-1',
        type: 'mastery',
        title: 'TESTE',
      },
    });

    expect(useAppStore.getState().activeCelebration).not.toBeNull();
    useAppStore.getState().dismissCelebration();
    expect(useAppStore.getState().activeCelebration).toBeNull();
  });
});
