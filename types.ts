export interface ReviewMeta {
  ef: number;         // Easiness Factor
  interval: number;   // Days until next review
  repetitions: number; // Consecutive correct repetitions
  nextReview: string; // ISO Date string
}

export interface Card {
  id: string;
  romaji: string;
  japanese: string;
  indonesia: string;
  example: string;
  tags: string[];
  createdAt: string;
  reviewMeta: ReviewMeta;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
}

// SM-2 Quality Grade: 0-5
// 0: Total blackout, 5: Perfect recall
export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export interface ImportData {
  id: string;
  romaji: string;
  japanese: string;
  indonesia: string;
  example: string;
  tags?: string[];
}