
import { Card, Deck, ReviewMeta, DeckExport } from '../types';
import { getInitialReviewMeta } from './sm2';

const CARD_STORAGE_KEY = 'katasensei_cards_v1';
const DECK_STORAGE_KEY = 'katasensei_decks_v1';

const DEFAULT_DECK_ID = 'deck-makanan';

// Seed data matching the prompt requirements
const SEED_DECKS: Deck[] = [
  {
    id: 'deck-makanan',
    name: 'Makanan',
    description: 'Kosakata tentang makanan dan minuman',
    tags: ['vocab', 'makanan'],
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'deck-minuman',
    name: 'Minuman',
    description: 'Jenis-jenis minuman dalam bahasa Jepang',
    tags: ['vocab', 'minuman'],
    createdAt: new Date('2025-01-01').toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'deck-basics',
    name: 'Greetings & Basics',
    description: 'Essential phrases for daily conversation',
    tags: ['basics', 'sapaan'],
    createdAt: new Date('2025-01-02').toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const SEED_CARDS: Card[] = [
  // Makanan Deck
  {
    id: "m1",
    deckId: "deck-makanan",
    romaji: "tamago",
    japanese: "卵",
    indonesia: "Telur",
    example: "卵を割る。",
    tags: ["makanan"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  },
  {
    id: "m2",
    deckId: "deck-makanan",
    romaji: "sushi",
    japanese: "寿司",
    indonesia: "Sushi",
    example: "寿司は美味しい。",
    tags: ["makanan"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  },
  {
    id: "m3",
    deckId: "deck-makanan",
    romaji: "tempura",
    japanese: "天ぷら",
    indonesia: "Tempura",
    example: "天ぷらを食べる。",
    tags: ["makanan"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  },
  // Minuman Deck
  {
    id: "d1",
    deckId: "deck-minuman",
    romaji: "juusu",
    japanese: "ジュース",
    indonesia: "Jus",
    example: "ジュースを飲む。",
    tags: ["minuman"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  },
  {
    id: "d2",
    deckId: "deck-minuman",
    romaji: "ocha",
    japanese: "お茶",
    indonesia: "Teh",
    example: "お茶を飲む。",
    tags: ["minuman"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  },
  // Basics (Legacy/Extra)
  {
    id: "k1",
    deckId: "deck-basics",
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
    deckId: "deck-basics",
    romaji: "arigatou",
    japanese: "ありがとう",
    indonesia: "Terima kasih",
    example: "手伝ってくれてありがとう。",
    tags: ["politeness"],
    createdAt: new Date().toISOString(),
    reviewMeta: getInitialReviewMeta()
  }
];

// --- Deck Operations ---

export const getDecks = (): Deck[] => {
  try {
    const stored = localStorage.getItem(DECK_STORAGE_KEY);
    if (!stored) {
      saveDecks(SEED_DECKS);
      // Ensure cards are seeded if decks are seeded
      const cardStored = localStorage.getItem(CARD_STORAGE_KEY);
      if (!cardStored) saveCards(SEED_CARDS);
      return SEED_DECKS;
    }
    return JSON.parse(stored);
  } catch (e) {
    return SEED_DECKS;
  }
};

export const saveDecks = (decks: Deck[]) => {
  localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(decks));
};

export const createDeck = (name: string, description: string = '', tags: string[] = []) => {
  const decks = getDecks();
  const newDeck: Deck = {
    id: `deck_${Date.now()}`,
    name,
    description,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveDecks([...decks, newDeck]);
  return newDeck;
};

export const updateDeck = (id: string, updates: Partial<Omit<Deck, 'id' | 'createdAt'>>) => {
  const decks = getDecks();
  const updated = decks.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
  saveDecks(updated);
};

export const deleteDeck = (deckId: string) => {
  const decks = getDecks();
  const remainingDecks = decks.filter(d => d.id !== deckId);
  saveDecks(remainingDecks);

  // Also delete associated cards (or we could orphan them, but cleaner to delete)
  const cards = getCards();
  const remainingCards = cards.filter(c => c.deckId !== deckId);
  saveCards(remainingCards);
};

export const restoreDeck = (deck: Deck, cards: Card[]) => {
  const currentDecks = getDecks();
  const currentCards = getCards();
  
  // Avoid duplicates if clicked twice
  if (!currentDecks.find(d => d.id === deck.id)) {
    saveDecks([...currentDecks, deck]);
  }
  
  // Add back cards that don't exist
  const existingCardIds = new Set(currentCards.map(c => c.id));
  const cardsRestored = cards.filter(c => !existingCardIds.has(c.id));
  saveCards([...currentCards, ...cardsRestored]);
};

// --- Card Operations ---

export const getCards = (deckIdFilter?: string): Card[] => {
  try {
    const stored = localStorage.getItem(CARD_STORAGE_KEY);
    let cards: Card[] = stored ? JSON.parse(stored) : [];
    
    if (cards.length === 0 && !stored) {
      cards = SEED_CARDS;
      saveCards(cards);
    }

    if (deckIdFilter) {
      return cards.filter(c => c.deckId === deckIdFilter);
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

// --- Import/Export ---

export const exportDeckToJSON = (deckId: string): string => {
  const decks = getDecks();
  const cards = getCards(deckId);
  const deck = decks.find(d => d.id === deckId);

  if (!deck) return '';

  const exportData: DeckExport = {
    id: deck.id,
    title: deck.name,
    description: deck.description || '',
    tags: deck.tags || [],
    cards: cards
  };

  return JSON.stringify(exportData, null, 2);
};
