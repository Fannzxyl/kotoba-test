import { Card, ReviewMeta } from '../types';
import { getInitialReviewMeta } from './sm2';

const STORAGE_KEY = 'katasensei_deck_v1';
const DECK_STORAGE_KEY = 'katasensei_decks_v1'; // Key baru untuk menyimpan daftar Deck

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

// --- Card Functions ---

export const getCards = (deckId?: string): Card[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let cards: Card[] = [];

    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      cards = SEED_DATA;
    } else {
      cards = JSON.parse(stored);
    }

    // Jika ada parameter deckId, filter kartunya
    // (Asumsi: jika deckId tidak ada di kartu, anggap kartu itu global atau abaikan logic ini sesuai kebutuhanmu)
    if (deckId) {
      // Cek apakah interface Card kamu punya properti deckId. 
      // Jika belum, logic ini akan mengembalikan semua kartu atau perlu disesuaikan.
      return cards.filter((c: any) => c.deckId === deckId);
    }

    return cards;
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

// --- Deck Functions (YANG HILANG SEBELUMNYA) ---

export const getDecks = () => {
  try {
    const stored = localStorage.getItem(DECK_STORAGE_KEY);
    if (!stored) {
      // Default deck jika belum ada
      const defaultDecks = [{ id: 'default', name: 'Main Deck' }];
      localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(defaultDecks));
      return defaultDecks;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load decks", e);
    return [];
  }
};

// Opsional: Tambahkan ini jika nanti butuh create deck
export const saveDecks = (decks: any[]) => {
  try {
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(decks));
  } catch (e) {
    console.error("Failed to save decks", e);
  }
};