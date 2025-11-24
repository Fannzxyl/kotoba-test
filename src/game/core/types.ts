// --- GAME TYPES ---

// Kita import Card structure kalau perlu, atau definisikan ulang yang simpel buat game
export interface Card {
  id: string;
  word: string;      // Japanese
  romaji: string;
  meaning: string;   // Indonesia
  srsLevel: number;
}

export interface TargetEntity {
  id: string;
  card: Card;
  text: string;     // Text yang muncul di bola
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  isAlive: boolean;
  isCorrect: boolean;
  state: 'normal' | 'hit' | 'wrong';
  scale: number;    // Efek muncul (pop-in)
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

export type GameState = 'MENU' | 'PLAYING' | 'ROUND_TRANSITION' | 'GAME_OVER';