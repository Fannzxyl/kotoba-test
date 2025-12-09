import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCards, updateCard } from '../modules/decks/api';
import type { Card } from '../modules/decks/model';
import { calculateSM2 } from '../services/sm2';
import { updateStreak, addXp } from '../modules/gamification/streak';
import type { Grade } from '../types';
import { RefreshCw, Check, Keyboard, Gamepad2, ArrowLeft } from 'lucide-react';
import { KataCannonGame } from '../game/KataCannonGame';

// --- HELPER FUNCTIONS ---

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Cek apakah string mengandung karakter Kanji
const hasKanji = (text: string) => {
  return /[\u4e00-\u9faf]/.test(text);
};

// --- MAIN COMPONENT ---

export const Study: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const deckId = params.get('deckId') || undefined;
  const mode = (params.get('mode') as 'flashcards' | 'arcade' | 'writing') || 'flashcards';

  const idsParam = params.get('ids');
  const selectedIds = idsParam ? idsParam.split(',').filter(Boolean) : null;
  const deckIdsParam = params.get('deckIds');
  const multiDeckIds = deckIdsParam ? deckIdsParam.split(',').filter(Boolean) : null;

  const [queue, setQueue] = useState<Card[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [disableFlipAnimation, setDisableFlipAnimation] = useState(false);

  // Typing Mode State
  const [inputAnswer, setInputAnswer] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showAnswer, setShowAnswer] = useState(false);

  // ---- Load queue ----
  useEffect(() => {
    setIsLoading(true);
    setIsFinished(false);
    setIsFinished(false);
    setIsFlipped(false);
    // Reset typing state
    setInputAnswer('');
    setFeedback('idle');
    setShowAnswer(false);

    setCurrentIndex(0);

    let all: Card[] = [];
    if (multiDeckIds && multiDeckIds.length > 0) {
      all = getCards().filter(c => multiDeckIds.includes(c.deckId));
    } else {
      all = getCards(deckId);
    }
    const now = new Date().toISOString();
    let source: Card[] = [];

    if (selectedIds && selectedIds.length > 0) {
      source = all.filter((c) => selectedIds.includes(c.id));
    } else {
      const due = all.filter((c) => c.reviewMeta.nextReview <= now);
      source = due.length > 0 ? due : all;
    }

    const shuffled = shuffle(source);
    setQueue(shuffled);
    setIsLoading(false);
  }, [deckId, location.search, idsParam]);

  useEffect(() => {
    setDisableFlipAnimation(false);
  }, [currentIndex]);

  const currentCard = queue[currentIndex];

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      if (currentIndex < queue.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);

        // Reset typing state
        setInputAnswer('');
        setFeedback('idle');
        setShowAnswer(false);

        setIsTransitioning(false);
      }
    } else {
      setIsFinished(true);
      setIsTransitioning(false);
    }
  }, [currentIndex, queue.length]);

  const handleGrade = useCallback(
    (grade: Grade) => {
      if (!currentCard || isTransitioning) return;
      setIsTransitioning(true);
      setDisableFlipAnimation(true);
      setIsFlipped(false);

      const newMeta = calculateSM2(currentCard.reviewMeta, grade);
      const updatedCard: Card = { ...currentCard, reviewMeta: newMeta };
      updateCard(updatedCard);

      // Trigger Streak Update
      updateStreak();

      // XP Logic: 3+ (Pass) = 15 XP, else 2 XP (Consolation)
      if (grade >= 3) {
        addXp(15);
      } else {
        addXp(2);
      }

      handleNext();
    },
    [currentCard, handleNext, isTransitioning]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'flashcards') return;
      if (isFinished || isLoading || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isFlipped) setIsFlipped(true);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade(1);
        if (e.key === '2') handleGrade(2);
        if (e.key === '3') handleGrade(3);
        if (e.key === '4') handleGrade(5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isFlipped, isFinished, isLoading, currentCard, handleGrade]);

  const setMode = (newMode: 'flashcards' | 'arcade' | 'writing') => {
    const next = new URLSearchParams(location.search);
    if (newMode === 'flashcards') next.delete('mode');
    else next.set('mode', newMode);
    navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: true });
  };

  // Auto-focus input when feedback becomes idle
  useEffect(() => {
    if (mode === 'writing' && feedback === 'idle' && inputRef.current) {
      // Small timeout to ensure DOM is ready
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mode, feedback, currentIndex]);

  const handleRepeat = () => {
    if (queue.length === 0) return;
    const reshuffled = shuffle(queue);
    setQueue(reshuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setIsTransitioning(false);
    setDisableFlipAnimation(false);
    setIsTransitioning(false);
    setDisableFlipAnimation(false);
    // Reset typing
    setInputAnswer('');
    setFeedback('idle');
    setShowAnswer(false);
  };

  const handleCheckAnswer = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentCard || feedback !== 'idle') return;

    const normalizedInput = inputAnswer.trim().toLowerCase();
    const normalizedRomaji = currentCard.romaji.trim().toLowerCase();
    const normalizedKana = currentCard.japanese.trim(); // Optional: exact kana match

    if (normalizedInput === normalizedRomaji || normalizedInput === normalizedKana) {
      setFeedback('correct');
      // Auto advance after delay
      setTimeout(() => {
        addXp(20); // Bonus for Typing
        handleGrade(5); // Treat as Easy/Perfect
      }, 1000);
    } else {
      setFeedback('incorrect');
      setShowAnswer(true);
      // User must manually click next/continue
    }
  };

  // --- RENDERING STATES ---

  if (mode === 'arcade') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-black/40 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setMode('flashcards')}
              className="px-4 py-1 text-xs rounded-full text-gray-400 hover:text-white"
            >
              Flashcards
            </button>
            <button
              onClick={() => setMode('arcade')}
              className="px-4 py-1 text-xs rounded-full bg-white text-black font-semibold flex items-center gap-1"
            >
              <Gamepad2 size={14} /> Arcade
            </button>
            <button
              onClick={() => setMode('writing')}
              className="px-4 py-1 text-xs rounded-full text-gray-400 hover:text-white flex items-center gap-1"
            >
              <Keyboard size={14} /> Write
            </button>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mb-2">Practice this deck in arcade mode.</p>
        <KataCannonGame />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-20 text-purple-300 animate-pulse">
        Loading deck...
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-center">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(52,211,153,0.4)]">
            <Check size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white">No cards yet</h2>
          <Link
            to="/import"
            className="px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform"
          >
            Import Vocabulary
          </Link>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-center">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(236,72,153,0.4)]">
            <RefreshCw size={48} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Session Complete
          </h2>
          <p className="text-gray-400 mb-8">You reviewed {queue.length} cards!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRepeat}
              className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-violet-600 transition-all hover:scale-105 shadow-lg shadow-purple-500/20"
            >
              Review Again
            </button>
            <Link
              to="/decks"
              className="px-8 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/10"
            >
              Back to Decks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return <div className="flex justify-center p-20 text-gray-500">Preparing card...</div>;
  }

  const containsKanji = hasKanji(currentCard.japanese || '');
  const furiganaText = currentCard.furigana;

  return (
    <div className="min-h-screen w-full flex justify-center">
      <div className="w-full max-w-4xl px-4 md:px-8 pt-20 pb-24 md:pb-6 flex flex-col h-full justify-center">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <Link
            to="/decks"
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="inline-flex bg-black/40 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setMode('flashcards')}
              className={`px-4 py-1.5 text-xs rounded-full font-bold shadow-sm transition-colors ${mode === 'flashcards' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Study
            </button>
            <button
              onClick={() => setMode('arcade')}
              className="px-4 py-1.5 text-xs rounded-full text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Gamepad2 size={14} /> Arcade
            </button>
            <button
              onClick={() => setMode('writing')}
              className={`px-4 py-1.5 text-xs rounded-full flex items-center gap-1 transition-colors ${mode === 'writing' ? 'bg-white text-black font-bold shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              <Keyboard size={14} /> Write
            </button>
          </div>
          <div className="text-xs md:text-sm font-medium bg-white/5 px-3 py-1.5 rounded-lg text-gray-300 border border-white/5">
            {currentIndex + 1} / {queue.length}
          </div>
        </div>

        {/* CARD AREA */}
        {mode === 'writing' ? (
          <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full">
            {/* Question Card (Fixed Front) */}
            <div className="w-full bg-[#151520] border border-white/10 rounded-3xl p-6 md:p-12 flex flex-col items-center justify-center min-h-[220px] md:min-h-[300px] mb-4 md:mb-6 shadow-2xl relative overflow-hidden">

              {feedback === 'correct' && (
                <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center animate-fade-in pointer-events-none">
                  <Check size={100} className="text-green-500 opacity-50" />
                </div>
              )}

              <div className="text-xs uppercase tracking-[0.2em] text-purple-400 font-bold mb-6">
                Translate to Japanese (Romaji)
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4 leading-tight">
                {currentCard.indonesia}
              </h1>

              {/* Hint / Example (Optional) */}
              {currentCard.example && (
                <p className="text-gray-500 text-sm mt-4 italic max-w-md text-center">"{currentCard.example}"</p>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleCheckAnswer} className="w-full relative">
              <input
                disabled={feedback !== 'idle'}
                type="text"
                value={inputAnswer}
                onChange={e => setInputAnswer(e.target.value)}
                placeholder="Type the reading..."
                className={`w-full bg-[#1a1a24] border-2 rounded-2xl px-5 py-4 text-lg md:text-2xl text-center outline-none transition-all shadow-lg placeholder-gray-600 ${feedback === 'idle' ? 'border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/20 text-white' :
                  feedback === 'correct' ? 'border-green-500 bg-green-500/10 text-green-400' :
                    'border-red-500 bg-red-500/10 text-red-400'
                  }`}
                ref={inputRef}
                autoFocus
              />

              {/* Feedback Actions */}
              {feedback === 'idle' && (
                <button
                  type="submit"
                  disabled={!inputAnswer.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-primary hover:text-white p-3 rounded-xl text-gray-400 transition-all disabled:opacity-0 disabled:pointer-events-none"
                >
                  <Check size={24} />
                </button>
              )}

              {/* Incorrect State: Show Answer & Continue */}
              {feedback === 'incorrect' && (
                <div className="mt-6 animate-fade-in-up w-full">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-4 text-center">
                    <p className="text-red-300 text-xs uppercase font-bold mb-2">Correct Answer</p>
                    <p className="text-2xl md:text-3xl font-bold text-white mb-1">{currentCard.japanese || '?'}</p>
                    <p className="text-lg text-red-200 font-mono">{currentCard.romaji}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGrade(1)} // Mark as 'Again'
                    className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 transition-all"
                  >
                    Continue (Review Later)
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center mb-6">
            <div
              className="perspective-1000 w-full h-[45vh] md:h-[420px] cursor-pointer group relative"
              onClick={() => !isFlipped && setIsFlipped(true)}
            >
              <div
                className={[
                  'relative w-full h-full preserve-3d',
                  isFlipped ? 'rotate-y-180' : '',
                  disableFlipAnimation
                    ? ''
                    : 'transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)',
                ].join(' ')}
              >
                {/* --- FRONT SIDE (JAPANESE) --- */}
                <div className="absolute w-full h-full backface-hidden glass-panel rounded-[1.75rem] flex flex-col items-center justify-center px-4 py-6 md:px-8 md:py-10 border-t border-white/20 shadow-2xl bg-[#151520]/80 backdrop-blur-xl">
                  <div className="absolute top-4 md:top-6 text-[10px] md:text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">
                    Japanese
                  </div>

                  {/* FURIGANA DISPLAY */}
                  {containsKanji ? (
                    <div className="text-lg md:text-2xl text-pink-300 font-medium mb-1 tracking-wider opacity-90 font-jp">
                      {furiganaText || '...'}
                    </div>
                  ) : (
                    <div className="h-5 md:h-7 mb-1" />
                  )}

                  {/* Teks Utama */}
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-jp text-center text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-2 leading-tight">
                    {currentCard.japanese || '?'}
                  </h1>

                  <div className="absolute bottom-4 md:bottom-6 text-gray-600 text-[11px] md:text-sm flex items-center gap-2 opacity-70">
                    <Keyboard size={12} className="md:w-4 md:h-4" /> Press Space to Flip
                  </div>
                </div>

                {/* --- BACK SIDE (MEANING) --- */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 glass-panel rounded-[1.75rem] flex flex-col items-center justify-center px-4 py-6 md:px-8 md:py-10 border-t border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] bg-[#0f0f16]/95">
                  <div className="absolute top-4 md:top-6 text-[10px] md:text-xs uppercase tracking-[0.2em] text-purple-400 font-bold">
                    Meaning
                  </div>

                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-center mb-4 md:mb-6 text-white leading-tight">
                    {currentCard.indonesia}
                  </h3>

                  <div className="text-gray-500 font-mono mb-4 md:mb-6 text-base md:text-lg">
                    {furiganaText || currentCard.romaji}
                  </div>

                  {currentCard.example && (
                    <div className="bg-white/5 p-3 md:p-5 rounded-2xl w-full max-w-lg text-center border border-white/5">
                      <p className="text-sm md:text-lg text-purple-200 font-jp mb-1">
                        {currentCard.example}
                      </p>
                      <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-bold">
                        Example Sentence
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        )}

        {/* GRADING BUTTONS */}
        <div
          className={`transition-all duration-500 transform ${isFlipped
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
        >
          <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-2xl mx-auto">
            <button
              onClick={() => handleGrade(1)}
              className="group py-3 md:py-4 rounded-2xl bg-[#1a1a24] border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/50 text-red-400 transition-all flex flex-col items-center gap-1 active:scale-95 text-xs md:text-sm"
            >
              <span className="font-bold">Again</span>
              <span className="text-[9px] md:text-[10px] opacity-50 group-hover:opacity-100 uppercase font-mono">
                1m
              </span>
            </button>
            <button
              onClick={() => handleGrade(2)}
              className="group py-3 md:py-4 rounded-2xl bg-[#1a1a24] border border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/50 text-orange-400 transition-all flex flex-col items-center gap-1 active:scale-95 text-xs md:text-sm"
            >
              <span className="font-bold">Hard</span>
              <span className="text-[9px] md:text-[10px] opacity-50 group-hover:opacity-100 uppercase font-mono">
                10m
              </span>
            </button>
            <button
              onClick={() => handleGrade(3)}
              className="group py-3 md:py-4 rounded-2xl bg-[#1a1a24] border border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/50 text-blue-400 transition-all flex flex-col items-center gap-1 active:scale-95 text-xs md:text-sm"
            >
              <span className="font-bold">Good</span>
              <span className="text-[9px] md:text-[10px] opacity-50 group-hover:opacity-100 uppercase font-mono">
                1d
              </span>
            </button>
            <button
              onClick={() => handleGrade(5)}
              className="group py-3 md:py-4 rounded-2xl bg-[#1a1a24] border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-400 transition-all flex flex-col items-center gap-1 active:scale-95 text-xs md:text-sm"
            >
              <span className="font-bold">Easy</span>
              <span className="text-[9px] md:text-[10px] opacity-50 group-hover:opacity-100 uppercase font-mono">
                4d
              </span>
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
    </div>
  );
};
