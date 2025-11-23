
export interface Card {
  id: string;
  word: string;      // Japanese, e.g. "たべます" (Mapped from Japanese)
  romaji: string;    // e.g. "tabemasu"
  meaning: string;   // e.g. "to eat" (Mapped from Indonesia)
  jlptLevel?: "N5" | "N4" | "N3" | "N2" | "N1";
  srsLevel: number;  // 0+ for spaced repetition (simulated)
}

export interface TargetEntity {
  id: string;
  card: Card;
  text: string; // Text to display on the bubble (romaji or japanese)
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  isAlive: boolean;
  isCorrect: boolean; // To cheat/debug or internal check
  state: 'normal' | 'hit' | 'wrong';
  scale: number; // For pop-in animation
}

export interface CannonState {
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  recoil: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isActive: boolean;
  color: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameConfig {
  baseTargetSpeed: number;
  maxTargetsPerRound: number;
  roundDurationMs: number;
  projectileSpeed: number;
  spawnPadding: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface GameStats {
  score: number;
  streak: number;
  maxStreak: number;
  correctCount: number;
  wrongCount: number;
  lives: number;
  level: number;
  round: number;
}

export interface GameSessionStats extends GameStats {
  totalQuestions: number;
  answeredCards: { cardId: string; correct: boolean; attempts: number }[];
}

export type GameState = 'MENU' | 'PLAYING' | 'ROUND_TRANSITION' | 'GAME_OVER';