import { Card, TargetEntity } from '../core/types';

export interface RoundData {
  correctCard: Card;
  distractors: Card[];
  promptMode: 'meaning' | 'romaji';
  promptText: string;
  targetCount: number;
}

export class RoundManager {
  private cards: Card[];
  private _currentLevel: number = 1;

  constructor(cards: Card[]) {
    this.cards = cards;
  }

  setCards(cards: Card[]) {
    this.cards = cards;
  }

  /**
   * Generates a new round configuration.
   */
  generateRound(level: number): RoundData {
    this._currentLevel = level;

    // Filter valid cards (must have meaning and romaji/japanese)
    const validCards = this.cards.filter(c => c.word && c.meaning);
    
    // Pick Correct Card
    // (Ideally we would track recent cards to avoid repeats, but random is okay for now)
    const correctCard = validCards[Math.floor(Math.random() * validCards.length)];

    // Pick Distractors
    const otherCards = validCards.filter(c => c.id !== correctCard.id).sort(() => Math.random() - 0.5);
    
    // Number of options: 3 for early levels, up to 5
    const totalTargets = Math.min(5, 3 + Math.floor(level / 5));
    const distractorCount = totalTargets - 1;
    const distractors = otherCards.slice(0, distractorCount);

    // Prompt is always MEANING as per requirement
    // Options are ROMAJI (or Japanese if romaji missing)
    const promptText = correctCard.meaning;
    const promptMode = 'meaning';

    return {
      correctCard,
      distractors,
      promptMode,
      promptText,
      targetCount: totalTargets
    };
  }

  createTargetsFromRound(round: RoundData, canvasWidth: number, _canvasHeight: number): TargetEntity[] {
    const targets: TargetEntity[] = [];
    const allCards = [round.correctCard, ...round.distractors].sort(() => Math.random() - 0.5);

    const padding = 80; // More padding
    const spawnAreaW = canvasWidth - padding * 2;
    const step = spawnAreaW / (allCards.length);
    
    allCards.forEach((card, index) => {
      const isCorrect = card.id === round.correctCard.id;
      
      // Distribute horizontally
      const x = padding + (step * index) + (step / 2) + ((Math.random() - 0.5) * 40);
      const y = 80 + Math.random() * 100; // Spawn near top
      
      targets.push({
        id: `t-${Date.now()}-${index}`,
        card,
        text: card.romaji || card.word, // Show Romaji as bubbles
        x: x,
        y: y,
        radius: 45, 
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.5 + (Math.random() * 0.5), // Fall down slowly
        isAlive: true,
        isCorrect,
        state: 'normal',
        scale: 0, // Animate in
      });
    });

    return targets;
  }
}