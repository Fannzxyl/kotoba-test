
import { Card, Deck, ReviewMeta } from '../types';
import { getInitialReviewMeta } from './sm2';

const CARD_STORAGE_KEY = 'katasensei_deck_v1';
const DECK_STORAGE_KEY = 'katasensei_decks_meta_v1';

const DEFAULT_DECK_ID = 'default-deck';

// Seed data for first run
const SEED_DATA: Card[] = [
  {
    id: "k1",
    deckId: DEFAULT_DECK_ID,
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
    deckId: DEFAULT_DECK_ID,
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
    deckId: DEFAULT_DECK_ID,
    romaji: "neko",
    japanese: "猫",
    indonesia: "Kucing",
    example: "猫がベッドで寝ています。",
    tags: ["hewan"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  }
];

// --- Deck Operations ---

export const getDecks = (): Deck[] => {
  try {
    const stored = localStorage.getItem(DECK_STORAGE_KEY);
    if (!stored) {
      const defaultDeck = { id: DEFAULT_DECK_ID, name: 'Main Deck' };
      saveDecks([defaultDeck]);
      return [defaultDeck];
    }
    return JSON.parse(stored);
  } catch (e) {
    return [{ id: DEFAULT_DECK_ID, name: 'Main Deck' }];
  }
};

export const saveDecks = (decks: Deck[]) => {
  localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(decks));
};

export const createDeck = (name: string) => {
  const decks = getDecks();
  const newDeck: Deck = {
    id: `deck_${Date.now()}`,
    name
  };
  saveDecks([...decks, newDeck]);
  return newDeck;
};

export const deleteDeck = (deckId: string) => {
  const decks = getDecks();
  if (decks.length <= 1) return; // Prevent deleting last deck
  
  const remainingDecks = decks.filter(d => d.id !== deckId);
  saveDecks(remainingDecks);

  // Move cards from deleted deck to the first available deck to prevent data loss
  const fallbackDeckId = remainingDecks[0].id;
  const allCards = getCards();
  const updatedCards = allCards.map(c => 
    c.deckId === deckId ? { ...c, deckId: fallbackDeckId } : c
  );
  saveCards(updatedCards);
};

export const updateDeckName = (deckId: string, name: string) => {
  const decks = getDecks();
  const updated = decks.map(d => d.id === deckId ? { ...d, name } : d);
  saveDecks(updated);
};

// --- Card Operations ---

export const getCards = (): Card[] => {
  try {
    const stored = localStorage.getItem(CARD_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(SEED_DATA));
      // Ensure default deck exists
      getDecks(); 
      return SEED_DATA;
    }
    
    let cards: Card[] = JSON.parse(stored);
    
    // Migration: Ensure all cards have a deckId
    let needsSave = false;
    cards = cards.map(c => {
      if (!c.deckId) {
        needsSave = true;
        return { ...c, deckId: DEFAULT_DECK_ID };
      }
      return c;
    });

    if (needsSave) {
      saveCards(cards);
      // Ensure default deck exists if we just migrated cards to it
      const decks = getDecks();
      if (!decks.find(d => d.id === DEFAULT_DECK_ID)) {
        saveDecks([...decks, { id: DEFAULT_DECK_ID, name: 'Main Deck' }]);
      }
    }

    return cards;
  } catch (e) {
    console.error("Failed to load cards", e);
    return [];
  }
};

export const saveCards = (cards: Card[]) => {
  try {
    localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(cards));
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

export const deleteCard = (cardId: string) => {
  const current = getCards();
  const filtered = current.filter(c => c.id !== cardId);
  saveCards(filtered);
};
