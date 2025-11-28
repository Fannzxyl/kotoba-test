export interface ReviewMeta {
  ef: number;         // Easiness Factor
  interval: number;   // Days until next review
  repetitions: number; // Consecutive correct repetitions
  nextReview: string; // ISO Date string
}

export interface Card {
  id: string;
  deckId: string;
  romaji: string;
  japanese: string;
  indonesia: string;
  example: string;
  // NEW: optional furigana (hiragana / katakana reading)
  furigana?: string;
  tags: string[];
  createdAt: string;
  reviewMeta: ReviewMeta;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// SM-2 Quality Grade: 0-5
export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export interface DeckExport {
  id: string;
  title: string;
  description: string;
  tags: string[];
  cards: Card[];
}

export interface ImportData {
  id: string;
  romaji: string;
  japanese: string;
  indonesia: string;
  example: string;
  // NEW: optional furigana saat import
  furigana?: string;
  tags?: string[];
}
