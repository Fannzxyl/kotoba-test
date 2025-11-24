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
  private recentIds: string[] = [];

  constructor(cards: Card[]) {
    this.cards = cards;
  }

  setCards(cards: Card[]) {
    this.cards = cards;
    this.recentIds = [];
  }

  private pickRandomCard(validCards: Card[]): Card {
    if (validCards.length === 0) {
      throw new Error('No cards available');
    }

    const candidates = validCards.filter(
      (c) => !this.recentIds.includes(c.id)
    );
    const pool = candidates.length > 0 ? candidates : validCards;

    const chosen = pool[Math.floor(Math.random() * pool.length)];

    this.recentIds.push(chosen.id);
    if (this.recentIds.length > 10) {
      this.recentIds.shift();
    }

    return chosen;
  }

  /**
   * Generates a new round configuration.
   */
  generateRound(level: number): RoundData {
    // Kartu valid: harus punya meaning
    const validCards = this.cards.filter((c) => c.word && c.meaning);

    const correctCard = this.pickRandomCard(validCards);

    // Distractors
    const otherCards = validCards
      .filter((c) => c.id !== correctCard.id)
      .sort(() => Math.random() - 0.5);

    // Jumlah opsi: mulai 3, naik sampai 5
    const totalTargets = Math.min(5, 3 + Math.floor(level / 5));
    const distractorCount = totalTargets - 1;
    const distractors = otherCards.slice(0, distractorCount);

    // Prompt: JAPAN (word + romaji di HUD), pilihan: meaning (Indonesia)
    const promptText = correctCard.word;
    const promptMode: 'meaning' | 'romaji' = 'meaning';

    return {
      correctCard,
      distractors,
      promptMode,
      promptText,
      targetCount: totalTargets,
    };
  }

  createTargetsFromRound(
    round: RoundData,
    canvasWidth: number,
    _canvasHeight: number
  ): TargetEntity[] {
    const targets: TargetEntity[] = [];
    const allCards = [round.correctCard, ...round.distractors].sort(
      () => Math.random() - 0.5
    );

    const padding = 80;
    const spawnAreaW = canvasWidth - padding * 2;
    const step = spawnAreaW / allCards.length;

    allCards.forEach((card, index) => {
      const isCorrect = card.id === round.correctCard.id;

      const x =
        padding +
        step * index +
        step / 2 +
        (Math.random() - 0.5) * 40;
      const y = 120 + Math.random() * 60;

      targets.push({
        id: `t-${Date.now()}-${index}`,
        card,
        // Bubbles menampilkan arti (Indonesia)
        text: card.meaning,
        x,
        y,
        radius: 48,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.4 + Math.random() * 0.4,
        isAlive: true,
        isCorrect,
        state: 'normal',
        scale: 0,
      });
    });

    return targets;
  }
}
