import { FSRSCard, FSRSParameters, Rating, State } from '@/types/fsrs';

export const DEFAULT_FSRS_PARAMS: FSRSParameters = {
  requestRetention: 0.9,
  maximumInterval: 36500,
  w: [
    0.4072, 1.1827, 3.1262, 15.4722, // w0-w3: initial stability for ratings 1-4
    7.2102, 0.5316, 1.0651, 0.0234,  // w4-w7: difficulty formulas
    1.616, 0.1544, 1.0824,           // w8-w10: recall stability formulas
    1.9813, 0.0953, 0.2975, 2.2042,  // w11-w14: forget stability formulas
    0.2407, 2.9466, 0.5, 0.0         // w15-w18: penalties and tuning
  ],
};

const FACTOR = 19 / 81;
const DECAY = -0.5;

export class FSRSEngine {
  private params: FSRSParameters;

  constructor(customParams?: Partial<FSRSParameters>) {
    this.params = { ...DEFAULT_FSRS_PARAMS, ...customParams };
  }

  public createInitialCard(nodeId: string): FSRSCard {
    const now = new Date().toISOString();
    return {
      nodeId,
      due: now,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: 0, // State.New
    };
  }

  public getRetrievability(card: FSRSCard, now: Date = new Date()): number {
    if (card.state === 0 || card.stability === 0) return 0;
    const last = card.lastReview ? new Date(card.lastReview).getTime() : new Date(card.due).getTime();
    const elapsedDays = Math.max(0, (now.getTime() - last) / (1000 * 60 * 60 * 24));
    return Math.pow(1 + (FACTOR * elapsedDays) / card.stability, DECAY);
  }

  public nextInterval(stability: number): number {
    const newInterval = (stability / FACTOR) * (Math.pow(this.params.requestRetention, 1 / DECAY) - 1);
    return Math.min(Math.max(1, Math.round(newInterval)), this.params.maximumInterval);
  }

  public repeat(card: FSRSCard, rating: Rating, now: Date = new Date()): FSRSCard {
    const w = this.params.w;
    const isNew = card.state === 0;
    const last = card.lastReview ? new Date(card.lastReview) : now;
    const elapsedDays = isNew ? 0 : Math.max(0, Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)));

    let newStability = card.stability;
    let newDifficulty = card.difficulty;
    let newState: State = card.state;
    let newLapses = card.lapses;

    if (isNew) {
      // Initialize stability & difficulty based on initial rating
      newStability = w[rating - 1];
      newDifficulty = Math.min(10, Math.max(1, w[4] - (rating - 3) * w[5]));
      newState = rating === 1 ? 1 : 2; // Learning or Review
    } else {
      const r = this.getRetrievability(card, now);
      // Update difficulty
      const deltaD = -w[6] * (rating - 3);
      const nextD = card.difficulty + deltaD;
      newDifficulty = Math.min(10, Math.max(1, w[7] * (w[4] - (3 - 3) * w[5]) + (1 - w[7]) * nextD));

      if (rating === 1) {
        // Forgotten
        newLapses += 1;
        newState = 3; // Relearning
        newStability = w[11] * Math.pow(card.difficulty, -w[12]) * (Math.pow(card.stability + 1, w[13]) - 1) * Math.exp(w[14] * (1 - r));
      } else {
        // Remembered
        newState = 2; // Review
        const hardPenalty = rating === 2 ? w[15] : 1;
        const easyBonus = rating === 4 ? w[16] : 1;
        newStability =
          card.stability *
          (1 +
            Math.exp(w[8]) *
              (11 - card.difficulty) *
              Math.pow(card.stability, -w[9]) *
              (Math.exp(w[10] * (1 - r)) - 1) *
              hardPenalty *
              easyBonus);
      }
    }

    newStability = Math.max(0.1, newStability);
    const scheduledDays = rating === 1 ? 0 : this.nextInterval(newStability);
    const dueDate = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000);

    return {
      nodeId: card.nodeId,
      due: dueDate.toISOString(),
      stability: Number(newStability.toFixed(4)),
      difficulty: Number(newDifficulty.toFixed(4)),
      elapsedDays,
      scheduledDays,
      reps: card.reps + 1,
      lapses: newLapses,
      state: newState,
      lastReview: now.toISOString(),
    };
  }

  /**
   * Mapeamento determinístico de nota matemática (0 a 90) para Rating FSRS (1 a 4)
   */
  public scoreToRating(scoreKnowledge: number, timeSpentSeconds: number, timeLimitSeconds: number): Rating {
    const isFast = timeSpentSeconds <= timeLimitSeconds * 0.75;
    if (scoreKnowledge < 50) return 1; // Again
    if (scoreKnowledge < 80) return 2; // Hard
    if (scoreKnowledge < 88) return 3; // Good
    return isFast ? 4 : 3; // Easy if fast, else Good
  }
}

export const fsrs = new FSRSEngine();
