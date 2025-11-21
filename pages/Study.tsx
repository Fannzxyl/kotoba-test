import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCards, updateCard } from '../utils/storage';
import { calculateSM2 } from '../utils/sm2';
import { Card, Grade } from '../types';
import { RefreshCw, Check, X, RotateCcw, ArrowRight, Keyboard } from 'lucide-react';

export const Study: React.FC = () => {
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load due cards
  useEffect(() => {
    const allCards = getCards();
    const now = new Date().toISOString();
    // Filter cards due now or in the past
    const due = allCards.filter(c => c.reviewMeta.nextReview <= now);
    // Sort slightly random to mix it up, or could sort by priority
    setQueue(due.sort(() => Math.random() - 0.5));
    setIsLoading(false);
  }, []);

  const currentCard = queue[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setIsFlipped(false);
      // Small delay to allow flip animation reset if needed, but here we toggle content
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, queue.length]);

  const handleGrade = useCallback((grade: Grade) => {
    if (!currentCard) return;

    const newMeta = calculateSM2(currentCard.reviewMeta, grade);
    const updatedCard = { ...currentCard, reviewMeta: newMeta };
    
    updateCard(updatedCard);
    handleNext();
  }, [currentCard, handleNext]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || isLoading || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isFlipped) setIsFlipped(true);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade(1); // Forgot
        if (e.key === '2') handleGrade(2); // Hard
        if (e.key === '3') handleGrade(3); // Good
        if (e.key === '4') handleGrade(5); // Easy
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, isLoading, currentCard, handleGrade]);

  if (isLoading) return <div className="flex justify-center p-20 text-purple-300">Loading deck...</div>;

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(52,211,153,0.4)]">
          <Check size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">All caught up!</h2>
        <p className="text-gray-400 mb-8 max-w-md">You have no cards due for review right now. Great job keeping your streak alive.</p>
        <Link to="/" className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(236,72,153,0.4)]">
          <RefreshCw size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Session Complete</h2>
        <p className="text-gray-400 mb-8">You reviewed {queue.length} cards.</p>
        <Link to="/" className="px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform">
          Finish
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 text-sm text-gray-400 font-mono">
        <span>Card {currentIndex + 1} / {queue.length}</span>
        <span className="flex items-center gap-1"><Keyboard size={14} /> SPACE to flip</span>
      </div>

      {/* Flashcard Container */}
      <div className="perspective-1000 h-96 cursor-pointer group" onClick={() => !isFlipped && setIsFlipped(true)}>
        <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden glass-panel rounded-3xl flex flex-col items-center justify-center p-8 border-t border-white/20 shadow-2xl">
             <div className="text-xs uppercase tracking-[0.2em] text-purple-400 mb-4">Japanese</div>
             <h2 className="text-5xl md:text-6xl font-bold font-jp text-center mb-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
               {currentCard.japanese}
             </h2>
             <p className="text-xl text-gray-400 font-light">{currentCard.romaji}</p>
             <div className="absolute bottom-8 text-gray-500 text-sm animate-pulse">
               Click or Press Space to Flip
             </div>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 glass-panel rounded-3xl flex flex-col items-center justify-center p-8 border-t border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] bg-black/40">
            <div className="text-xs uppercase tracking-[0.2em] text-fuchsia-400 mb-4">Meaning</div>
            <h3 className="text-3xl md:text-4xl font-bold text-center mb-6 text-white">
              {currentCard.indonesia}
            </h3>
            {currentCard.example && (
               <div className="bg-white/5 p-4 rounded-xl w-full text-center border border-white/5">
                 <p className="text-sm text-gray-300 font-jp">{currentCard.example}</p>
                 <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Example</p>
               </div>
            )}
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className={`mt-8 transition-opacity duration-500 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="grid grid-cols-4 gap-3">
          <button 
            onClick={() => handleGrade(1)}
            className="py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all flex flex-col items-center gap-1"
          >
            <span className="font-bold">Again</span>
            <span className="text-[10px] opacity-60 uppercase tracking-wide font-mono">1</span>
          </button>
          <button 
            onClick={() => handleGrade(2)}
            className="py-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white transition-all flex flex-col items-center gap-1"
          >
            <span className="font-bold">Hard</span>
            <span className="text-[10px] opacity-60 uppercase tracking-wide font-mono">2</span>
          </button>
          <button 
            onClick={() => handleGrade(3)}
            className="py-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex flex-col items-center gap-1"
          >
            <span className="font-bold">Good</span>
            <span className="text-[10px] opacity-60 uppercase tracking-wide font-mono">3</span>
          </button>
          <button 
            onClick={() => handleGrade(5)}
            className="py-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white transition-all flex flex-col items-center gap-1"
          >
            <span className="font-bold">Easy</span>
            <span className="text-[10px] opacity-60 uppercase tracking-wide font-mono">4</span>
          </button>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};