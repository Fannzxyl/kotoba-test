import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { GameCanvas } from './ui/GameCanvas';
import { Hud } from './ui/Hud';
import { Controls } from './ui/Controls';
import { GameEngine } from './core/engine';
import { RoundManager } from './logic/roundManager';
import { GameState, GameStats, Card as GameCard } from './core/types';
import { getCards } from '../modules/decks/api';
import { AlertCircle } from 'lucide-react';

export const KataCannonGame: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Game State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [prompt, setPrompt] = useState<string>('');
  const [promptMode, setPromptMode] = useState<'meaning' | 'romaji'>('meaning');
  
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    streak: 0,
    maxStreak: 0,
    correctCount: 0,
    wrongCount: 0,
    lives: 3,
    level: 1,
    round: 0
  });

  // Refs
  const engineRef = useRef<GameEngine | null>(null);
  const roundManagerRef = useRef<RoundManager>(new RoundManager([]));
  
  // Initialize Deck Data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deckId = params.get('deckId');
    
    // Fetch Cards from storage
    const storageCards = getCards(deckId || undefined);
    
    // Map storage cards to Game Cards
    const gameCards: GameCard[] = storageCards
      .filter(c => c.japanese && (c.indonesia || c.romaji))
      .map(c => ({
        id: c.id,
        word: c.japanese,
        romaji: c.romaji || '?',
        meaning: c.indonesia,
        srsLevel: c.reviewMeta.repetitions || 0
      }));

    if (gameCards.length < 4) {
      setError("Not enough cards in this deck to play Arcade. Please add at least 4 cards with meanings and romaji.");
      setLoading(false);
      return;
    }

    roundManagerRef.current.setCards(gameCards);
    setLoading(false);
  }, [location.search]);

  // Sound Effects (Mocked)
  const playSound = () => {
    // const audio = new Audio(`/sfx/sound.mp3`);
    // audio.play().catch(() => {});
  };

  const startGame = () => {
    setStats({
      score: 0,
      streak: 0,
      maxStreak: 0,
      correctCount: 0,
      wrongCount: 0,
      lives: 3,
      level: 1,
      round: 0
    });
    setGameState('PLAYING');
    if (engineRef.current) engineRef.current.start();
    nextRound();
  };

  const nextRound = () => {
    if (!engineRef.current) return;

    const rm = roundManagerRef.current;
    // Increase difficulty (number of targets) every 3 rounds
    const currentLevel = Math.floor(stats.round / 3) + 1;
    
    const roundData = rm.generateRound(currentLevel);
    
    // Update UI state
    setPrompt(roundData.promptText);
    setPromptMode(roundData.promptMode);
    setStats(prev => ({ ...prev, round: prev.round + 1, level: currentLevel }));

    // Update Engine
    const targets = rm.createTargetsFromRound(roundData, engineRef.current.canvas.width, engineRef.current.canvas.height);
    engineRef.current.setTargets(targets);
  };

  const handleTargetHit = () => {
    playSound();
    
    setStats(prev => {
      const newStreak = prev.streak + 1;
      return {
        ...prev,
        score: prev.score + (100 * newStreak), // Combo multiplier
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        correctCount: prev.correctCount + 1
      };
    });

    // Short delay before next round
    setTimeout(() => {
       nextRound();
    }, 600);
  };

  const handleWrongTarget = () => {
    playSound();
    
    setStats(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        endGame();
      }
      return {
        ...prev,
        streak: 0,
        lives: newLives,
        wrongCount: prev.wrongCount + 1
      };
    });
  };

  const endGame = () => {
    setGameState('GAME_OVER');
    if (engineRef.current) engineRef.current.stop();
  };

  if (loading) return <div className="text-center p-10">Loading Arcade...</div>;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-full text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
        <p className="text-gray-400 mb-6 max-w-md">{error}</p>
        <Link to="/decks" className="px-6 py-3 bg-primary rounded-xl font-bold text-white hover:bg-violet-600">
          Back to Decks
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] md:h-[700px] relative rounded-3xl overflow-hidden border border-white/10 bg-[#0f0f16] shadow-2xl">
      <GameCanvas 
        onEngineReady={(engine) => engineRef.current = engine}
        onTargetHit={handleTargetHit}
        onWrongTarget={handleWrongTarget}
      />
      
      <Hud 
        stats={stats} 
        prompt={prompt} 
        promptMode={promptMode} 
      />
      
      <Controls 
        gameState={gameState}
        stats={stats}
        onStart={startGame}
        onRestart={startGame}
      />
    </div>
  );
};