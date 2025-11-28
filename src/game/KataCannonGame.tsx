// src/game/KataCannonGame.tsx

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
    round: 0,
  });

  const engineRef = useRef<GameEngine | null>(null);
  const roundManagerRef = useRef<RoundManager>(new RoundManager([]));

  // Load kartu untuk deck ini (support custom selection via ?ids=id1,id2,...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deckId = params.get('deckId') || undefined;

    const idsParam = params.get('ids'); // contoh: "id1,id2,id3"
    const selectedIds = idsParam
      ? idsParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    let storageCards = getCards(deckId);

    if (selectedIds.length > 0) {
      const selectedSet = new Set(selectedIds);
      storageCards = storageCards.filter((c) => selectedSet.has(c.id));
    }

    const gameCards: GameCard[] = storageCards
      .filter((c) => c.japanese && (c.indonesia || c.romaji))
      .map((c) => ({
        id: c.id,
        word: c.japanese,
        romaji: c.romaji || '?',
        meaning: c.indonesia,
        srsLevel: c.reviewMeta?.repetitions || 0,
      }));

    if (gameCards.length < 4) {
      setError(
        'Not enough cards in this selection to play Arcade. Please pick at least 4 cards with meanings and romaji.'
      );
      setLoading(false);
      return;
    }

    // Randomize order supaya tiap sesi terasa beda
    const shuffledGameCards = [...gameCards].sort(() => Math.random() - 0.5);

    roundManagerRef.current.setCards(shuffledGameCards);
    setLoading(false);
  }, [location.search]);

  const playSound = () => {
    // SFX bisa ditambah nanti
  };

  const startGame = () => {
    if (!engineRef.current) {
      console.error('Engine not ready');
      return;
    }

    setStats({
      score: 0,
      streak: 0,
      maxStreak: 0,
      correctCount: 0,
      wrongCount: 0,
      lives: 3,
      level: 1,
      round: 0,
    });

    setGameState('PLAYING');
    engineRef.current.start();
    nextRound();
  };

  const nextRound = () => {
    if (!engineRef.current) return;

    const rm = roundManagerRef.current;
    setStats((prev) => {
      const newRound = prev.round + 1;
      const currentLevel = Math.floor(newRound / 3) + 1;
      const roundData = rm.generateRound(currentLevel);

      setPrompt(roundData.promptText);
      setPromptMode(roundData.promptMode);

      const targets = rm.createTargetsFromRound(
        roundData,
        engineRef.current!.canvas.width,
        engineRef.current!.canvas.height
      );
      engineRef.current!.setTargets(targets);

      return {
        ...prev,
        round: newRound,
        level: currentLevel,
      };
    });
  };

  const handleTargetHit = () => {
    playSound();
    setStats((prev) => {
      const newStreak = prev.streak + 1;
      return {
        ...prev,
        score: prev.score + 100 * newStreak,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        correctCount: prev.correctCount + 1,
      };
    });

    setTimeout(() => {
      nextRound();
    }, 600);
  };

  const handleWrongTarget = () => {
    playSound();
    setStats((prev) => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        endGame();
      }
      return {
        ...prev,
        streak: 0,
        lives: newLives,
        wrongCount: prev.wrongCount + 1,
      };
    });
  };

  const endGame = () => {
    setGameState('GAME_OVER');
    if (engineRef.current) {
      engineRef.current.stop();
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading Arcade...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-full text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
        <p className="text-gray-400 mb-6 max-w-md">{error}</p>
        <Link
          to="/decks"
          className="px-6 py-3 bg-primary rounded-xl font-bold text-white hover:bg-violet-600"
        >
          Back to Decks
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] md:h-[700px] relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#0f0f16] via-[#131321] to-[#1b1b2f] shadow-2xl">
      <GameCanvas
        onEngineReady={(engine) => {
          engineRef.current = engine;
        }}
        onTargetHit={handleTargetHit}
        onWrongTarget={handleWrongTarget}
      />

      <Hud stats={stats} prompt={prompt} promptMode={promptMode} />

      <Controls
        gameState={gameState}
        stats={stats}
        onStart={startGame}
        onRestart={startGame}
      />
    </div>
  );
};