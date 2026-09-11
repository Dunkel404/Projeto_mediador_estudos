export type Rating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export type State = 0 | 1 | 2 | 3; // 0: New, 1: Learning, 2: Review, 3: Relearning

export interface FSRSCard {
  nodeId: string;
  due: string; // ISO date string
  stability: number; // S
  difficulty: number; // D (1 to 10)
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: State;
  lastReview?: string; // ISO date string
}

export interface FSRSRecordLog {
  rating: Rating;
  elapsedDays: number;
  scheduledDays: number;
  review: string;
  state: State;
}

export interface FSRSParameters {
  requestRetention: number; // e.g., 0.9 (90%)
  maximumInterval: number; // e.g., 36500 days
  w: number[]; // 19 default weights for FSRS v4
}
