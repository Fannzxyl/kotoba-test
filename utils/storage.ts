import { Card, ReviewMeta } from '../types';
import { getInitialReviewMeta } from './sm2';

const STORAGE_KEY = 'katasensei_deck_v1';

// Seed data for first run
const SEED_DATA: Card[] = [
  {
    id: "k1",
    romaji: "konnichiwa",
    japanese: "こんにちは",
    indonesia: "Selamat siang / Halo",
    example: "こんにちは、元気ですか？",
    tags: ["sapaan", "dasar"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  },
  {
    id: "k2",
    romaji: "arigatou",
    japanese: "ありがとう",
    indonesia: "Terima kasih",
    example: "手伝ってくれてありがとう。",
    tags: ["politeness"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  },
  {
    id: "k3",
    romaji: "neko",
    japanese: "猫",
    indonesia: "Kucing",
    example: "猫がベッドで寝ています。",
    tags: ["hewan"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  }
];

export const getCards = (): Card[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load cards", e);
    return [];
  }
};

export const saveCards = (cards: Card[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error("Failed to save cards", e);
  }
};

export const addCards = (newCards: Card[]) => {
  const current = getCards();
  // Simple deduplication by ID
  const currentIds = new Set(current.map(c => c.id));
  const filteredNew = newCards.filter(c => !currentIds.has(c.id));
  saveCards([...current, ...filteredNew]);
};

export const updateCard = (updatedCard: Card) => {
  const current = getCards();
  const index = current.findIndex(c => c.id === updatedCard.id);
  if (index !== -1) {
    current[index] = updatedCard;
    saveCards(current);
  }
};