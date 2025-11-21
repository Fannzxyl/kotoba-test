import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCards, updateCard, getDecks } from '../utils/storage';
import { calculateSM2 } from '../utils/sm2';
import { Card, Grade } from '../types';
import { RefreshCw, Check, Keyboard, Zap, Layers } from 'lucide-react';

export const Study: React.FC = () => {
  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCramming, setIsCramming] = useState(false);
  const [deckName, setDeckName] = useState<string>('All Decks');

  const location = useLocation();
  const navigate = useNavigate();

  // Load cards
  useEffect(() => {
    const loadQueue = () => {
      setIsLoading(true);
      const now = new Date();
      const searchParams = new URLSearchParams(location.search);
      const cramMode = searchParams.get('mode') === 'cram';
      const deckId = searchParams.get('deckId');

      // Fetch filtered cards
      const allCards = getCards(deckId || undefined);
      
      // Get deck name if filtering
      if (deckId) {
        const decks = getDecks();
        const d = decks.find(d => d.id === deckId);
        if (d) setDeckName(d.name);
      } else {
        setDeckName('All Decks');
      }

      setIsCramming(cramMode);
      setIsFinished(false);
      setCurrentIndex(0);
      setIsFlipped(false);

      if (cramMode) {
        // Cram Mode: Random 20 cards from selection
        const cramQueue = [...allCards]
          .sort(() => Math.random() - 0.5)
          .slice(0, 20);
        setQueue(cramQueue);
      } else {
        // Standard SM-2 Mode: Due cards only
        const due = allCards.filter(c => {
          const nr = c.reviewMeta?.nextReview;
          // Treat cards without schedule (or invalid) as due
          if (!nr) return true;
          // Compare as Date objects for safety
          return new Date(nr) <= now;
        });
        setQueue(due.sort(() => Math.random() - 0.5));
      }
      
      setIsLoading(false);
    };

    loadQueue();
  }, [location.search]);

  const currentCard = queue[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, queue.length]);

  const handleGrade = useCallback((grade: Grade) => {
    if (!currentCard) return;

    // Only update SM-2 stats if NOT cramming
    if (!isCramming) {
      const newMeta = calculateSM2(currentCard.reviewMeta, grade);
      const updatedCard = { ...currentCard, reviewMeta: newMeta };
      updateCard(updatedCard);
    }
    // In cram mode, we don't save progress to avoid messing up schedule
    
    handleNext();
  }, [currentCard, handleNext, isCramming]);

  const toggleMode = () => {
    const searchParams = new URLSearchParams(location.search);
    if (isCramming) {
      searchParams.delete('mode');
    } else {
      searchParams.set('mode', 'cram');
    }
    navigate({ search: searchParams.toString() });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || isLoading || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade(1); // Forgot
        if (e.key === '2') handleGrade(2); // Hard
        if (e.key === '3') handleGrade(3); // Good
        if (e.key === '4') handleGrade(4); // Easy (Match UI label 4)
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isFinished, isLoading, currentCard, handleGrade]);

  if (isLoading) return <div className="flex justify-center p-20 text-violet-300">Loading deck...</div>;

  if (queue.length === 0 && !isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in max-w-lg mx-auto px-4">
        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(52,211,153,0.4)]">
          <Check size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2 text-white">All caught up!</h2>
        <p className="text-violet-200 mb-2">{deckName}</p>
        <p className="text-gray-400 mb-8">You have no cards due for review right now.</p>
        
        <div className="flex flex-col gap-3 w-full px-4 md:px-8">
          <button 
            onClick={() => {
               const searchParams = new URLSearchParams(location.search);
               searchParams.set('mode', 'cram');
               navigate({ search: searchParams.toString() });
            }}
            className="py-3 md:py-4 rounded-xl bg-primary hover:bg-violet-600 text-white font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Zap size={20} fill="currentColor" />
            Review Ahead (Cram Mode)
          </button>
          <Link 
            to="/decks" 
            className="py-3 md:py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-violet-200 font-semibold transition-all text-center"
          >
            Back to Decks
          </Link>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="relative flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in px-4">
        {/* Confetti particles */}
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="confetti-piece animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: ['#a855f7', '#d946ef', '#22d3ee'][Math.floor(Math.random() * 3)],
              animationDelay: `${Math.random() * 1}s`,
              '--tx': `${(Math.random() - 0.5) * 200}px`
            } as any}
          />
        ))}

        <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(168,85,247,0.6)] animate-pulse-glow">
          <RefreshCw size={48} className="text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">Session Complete!</h2>
        <p className="text-violet-200 mb-8">You reviewed {queue.length} cards from {deckName}.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
           <Link to="/decks" className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:scale-105 transition-transform text-center">
             Decks
           </Link>
           <Link to="/" className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all text-center">
             Dashboard
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-safe-bottom">
      <div className="flex justify-between items-center mb-4 md:mb-6 text-xs md:text-sm text-violet-300 font-mono">
        <div className="flex items-center gap-2 md:gap-3">
            <span className="bg-white/5 px-2 py-1 md:px-3 rounded-full border border-white/10 flex items-center gap-1 max-w-[120px] md:max-w-none truncate">
              <Layers size={12} /> <span className="truncate">{deckName}</span>
            </span>
            
            <button 
              onClick={toggleMode}
              title={isCramming ? "Switch to Spaced Repetition" : "Switch to Cram Mode"}
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full border transition-all ${isCramming ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
            >
              <Zap size={12} fill={isCramming ? "currentColor" : "none"} /> 
              <span className="font-semibold">{isCramming ? 'Cram' : 'Review'}</span>
            </button>
        </div>
        <span className="flex items-center gap-2">
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      {/* Flashcard Container */}
      {/* Responsive height: h-80 on mobile, h-96 on desktop */}
      <div className="perspective-1000 h-80 md:h-96 cursor-pointer group touch-manipulation" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden glass-panel glass-panel-hover rounded-3xl flex flex-col items-center justify-center p-4 md:p-8 border-t border-white/10 shadow-2xl">
             <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-violet-400 mb-4 md:mb-6 font-semibold">Japanese</div>
             
             {/* Responsive text sizing */}
             <h2 className="text-4xl md:text-6xl font-bold font-jp text-center mb-4 md:mb-6 text-white drop-shadow-lg leading-tight break-words w-full">
               {currentCard.japanese}
             </h2>
             <p className="text-lg md:text-2xl text-violet-200 font-light tracking-wide text-center">{currentCard.romaji}</p>
             
             <div className="absolute bottom-6 text-violet-400/50 text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
               <Keyboard size={12} /> Space / Tap to Flip
             </div>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 glass-panel rounded-3xl flex flex-col items-center justify-center p-4 md:p-8 border-t border-white/10 shadow-[0_0_60px_rgba(168,85,247,0.15)] bg-black/60">
            <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-fuchsia-400 mb-4 md:mb-6 font-semibold">Meaning</div>
            
            <h3 className="text-2xl md:text-4xl font-bold text-center mb-4 md:mb-8 text-white leading-tight break-words w-full">
              {currentCard.indonesia}
            </h3>
            
            {currentCard.example && (
               <div className="bg-white/5 p-3 md:p-6 rounded-2xl w-full text-center border border-white/5 backdrop-blur-sm">
                 <p className="text-sm md:text-lg text-gray-200 font-jp mb-1 md:mb-2">{currentCard.example}</p>
                 <p className="text-[10px] md:text-xs text-violet-400 uppercase tracking-wider font-bold">Example</p>
               </div>
            )}
          </div>

        </div>
      </div>

      {/* Controls */}
      {/* Responsive margin, padding, and font sizes */}
      <div className={`mt-6 md:mt-10 transition-all duration-500 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          <button 
            onClick={(e) => { e.stopPropagation(); handleGrade(1); }}
            className="group py-3 md:py-4 rounded-xl md:rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex flex-col items-center gap-1 md:gap-2 active:scale-95 touch-manipulation"
          >
            <span className="font-bold text-sm md:text-lg">Again</span>
            <span className="text-[9px] md:text-[10px] opacity-60 uppercase tracking-wide font-mono border border-current px-1.5 rounded group-hover:border-white/50 hidden md:inline-block">1</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleGrade(2); }}
            className="group py-3 md:py-4 rounded-xl md:rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all flex flex-col items-center gap-1 md:gap-2 active:scale-95 touch-manipulation"
          >
            <span className="font-bold text-sm md:text-lg">Hard</span>
            <span className="text-[9px] md:text-[10px] opacity-60 uppercase tracking-wide font-mono border border-current px-1.5 rounded group-hover:border-white/50 hidden md:inline-block">2</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleGrade(3); }}
            className="group py-3 md:py-4 rounded-xl md:rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex flex-col items-center gap-1 md:gap-2 active:scale-95 touch-manipulation"
          >
            <span className="font-bold text-sm md:text-lg">Good</span>
            <span className="text-[9px] md:text-[10px] opacity-60 uppercase tracking-wide font-mono border border-current px-1.5 rounded group-hover:border-white/50 hidden md:inline-block">3</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleGrade(4); }}
            className="group py-3 md:py-4 rounded-xl md:rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all flex flex-col items-center gap-1 md:gap-2 active:scale-95 touch-manipulation"
          >
            <span className="font-bold text-sm md:text-lg">Easy</span>
            <span className="text-[9px] md:text-[10px] opacity-60 uppercase tracking-wide font-mono border border-current px-1.5 rounded group-hover:border-white/50 hidden md:inline-block">4</span>
          </button>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom, 20px); }
      `}</style>
    </div>
  );
};