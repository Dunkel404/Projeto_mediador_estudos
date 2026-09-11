import { describe, it, expect } from 'vitest';
import { FSRSEngine } from '../fsrs';

describe('FSRSEngine Deterministic Spaced Repetition', () => {
  it('should initialize a fresh card correctly', () => {
    const engine = new FSRSEngine();
    const card = engine.createInitialCard('node_algebra_01');

    expect(card.nodeId).toBe('node_algebra_01');
    expect(card.state).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.stability).toBe(0);
  });

  it('should calculate initial stability and difficulty on first rating', () => {
    const engine = new FSRSEngine();
    const card = engine.createInitialCard('node_derivatives_01');
    const now = new Date('2026-09-11T12:00:00Z');

    // Rating 3 = Good
    const reviewed = engine.repeat(card, 3, now);

    expect(reviewed.state).toBe(2); // State.Review
    expect(reviewed.reps).toBe(1);
    expect(reviewed.stability).toBeGreaterThan(0);
    expect(reviewed.difficulty).toBeGreaterThan(0);
    expect(reviewed.difficulty).toBeLessThanOrEqual(10);
    expect(new Date(reviewed.due).getTime()).toBeGreaterThan(now.getTime());
  });

  it('should register lapse when rated 1 (Again)', () => {
    const engine = new FSRSEngine();
    const card = engine.createInitialCard('node_integrals_01');
    const now = new Date('2026-09-11T12:00:00Z');

    const firstPass = engine.repeat(card, 3, now);
    const lapsed = engine.repeat(firstPass, 1, new Date('2026-09-15T12:00:00Z'));

    expect(lapsed.lapses).toBe(1);
    expect(lapsed.state).toBe(3); // State.Relearning
    expect(lapsed.scheduledDays).toBe(0); // Immediately due
  });

  it('should map scores deterministically to ratings', () => {
    const engine = new FSRSEngine();

    // Score < 50 => Again (1)
    expect(engine.scoreToRating(45, 30, 60)).toBe(1);
    // 50 <= Score < 80 => Hard (2)
    expect(engine.scoreToRating(72, 30, 60)).toBe(2);
    // 80 <= Score < 88 => Good (3)
    expect(engine.scoreToRating(84, 30, 60)).toBe(3);
    // Score >= 88 and fast => Easy (4)
    expect(engine.scoreToRating(92, 20, 60)).toBe(4);
    // Score >= 88 and slow => Good (3)
    expect(engine.scoreToRating(92, 55, 60)).toBe(3);
  });
});
