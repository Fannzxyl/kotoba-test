import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCards, updateCard } from '../modules/decks/api';
import type { Card } from '../modules/decks/model';
import { calculateSM2 } from '../services/sm2';
import type { Grade } from '../types';
import { RefreshCw, Check, Keyboard, Gamepad2, Volume2, ArrowLeft } from 'lucide-react';
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
  const mode = (params.get('mode') as 'flashcards' | 'arcade') || 'flashcards';

  const idsParam = params.get('ids');
  const selectedIds = idsParam ? idsParam.split(',').filter(Boolean) : null;

  const [queue, setQueue] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [disableFlipAnimation, setDisableFlipAnimation] = useState(false);

  // State untuk menyimpan list suara yang tersedia
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // ---- Load queue ----
  useEffect(() => {
    setIsLoading(true);
    setIsFinished(false);
    setIsFlipped(false);
    setCurrentIndex(0);

    const all = getCards(deckId);
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

  // 🔥 1. FORCE LOAD VOICES
  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    updateVoices();
    
    // Chrome butuh event listener ini
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // 🔥 2. FUNGSI AUDIO (SPEED FIXED 0.9) 🔥
  const playAudio = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;

    // Stop suara sebelumnya
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    
    // 🔥 PERBAIKAN: SPEED JADI 0.9 (Normal / Natural) 🔥
    // 1.0 = Default, 0.9 = Agak santai tapi wajar, 0.5 = Siput
    utterance.rate = 0.9; 
    utterance.volume = 1;
    utterance.pitch = 1;

    // Cari suara Jepang TERBAIK (Google > Microsoft > Any)
    let bestVoice = availableVoices.find(v => v.lang === 'ja-JP' && v.name.includes('Google'));
    
    if (!bestVoice) {
      bestVoice = availableVoices.find(v => v.lang === 'ja-JP' && v.name.includes('Microsoft'));
    }
    
    if (!bestVoice) {
      bestVoice = availableVoices.find(v => v.lang === 'ja-JP');
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    // Delay super kecil agar tidak "keselek" di awal (tetap dibutuhkan)
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 10);

  }, [availableVoices]);

  const currentCard = queue[currentIndex];

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setIsTransitioning(false);
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

  const setMode = (newMode: 'flashcards' | 'arcade') => {
    const next = new URLSearchParams(location.search);
    if (newMode === 'flashcards') next.delete('mode');
    else next.set('mode', 'arcade');
    navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: true });
  };

  const handleRepeat = () => {
    if (queue.length === 0) return;
    const reshuffled = shuffle(queue);
    setQueue(reshuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setIsTransitioning(false);
    setDisableFlipAnimation(false);
  };

  // --- RENDERING STATES ---

  if (mode === 'arcade') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-black/40 border border-white/10 rounded-full p-1">
            <button onClick={() => setMode('flashcards')} className="px-4 py-1 text-xs rounded-full text-gray-400 hover:text-white">Flashcards</button>
            <button onClick={() => setMode('arcade')} className="px-4 py-1 text-xs rounded-full bg-white text-black font-semibold flex items-center gap-1"><Gamepad2 size={14} /> Arcade</button>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mb-2">Practice this deck in arcade mode.</p>
        <KataCannonGame />
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center p-20 text-purple-300 animate-pulse">Loading deck...</div>;

  if (queue.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-center">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(52,211,153,0.4)]">
            <Check size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white">No cards yet</h2>
          <Link to="/import" className="px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform">Import Vocabulary</Link>
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
          <h2 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Session Complete</h2>
          <p className="text-gray-400 mb-8">You reviewed {queue.length} cards!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleRepeat} className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-violet-600 transition-all hover:scale-105 shadow-lg shadow-purple-500/20">Review Again</button>
            <Link to="/decks" className="px-8 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all border border-white/10">Back to Decks</Link>
          </div>
        </div>
      </div>
    );
  }

  const containsKanji = hasKanji(currentCard.japanese);
  const furiganaText = currentCard.furigana; 

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col h-[90vh]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
         <Link to="/decks" className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20}/>
         </Link>
         <div className="inline-flex bg-black/40 border border-white/10 rounded-full p-1">
            <button onClick={() => setMode('flashcards')} className="px-4 py-1.5 text-xs rounded-full bg-white text-black font-bold shadow-sm">Study</button>
            <button onClick={() => setMode('arcade')} className="px-4 py-1.5 text-xs rounded-full text-gray-400 hover:text-white flex items-center gap-1 transition-colors"><Gamepad2 size={14} /> Arcade</button>
         </div>
         <div className="text-sm font-medium bg-white/5 px-3 py-1.5 rounded-lg text-gray-300 border border-white/5">
            {currentIndex + 1} / {queue.length}
         </div>
      </div>

      {/* CARD AREA */}
      <div className="flex-1 flex flex-col justify-center relative mb-8">
        <div
          className="perspective-1000 w-full aspect-[4/3] md:aspect-[16/9] cursor-pointer group relative"
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <div className={['relative w-full h-full preserve-3d', isFlipped ? 'rotate-y-180' : '', disableFlipAnimation ? '' : 'transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)'].join(' ')}>
            
            {/* --- FRONT SIDE (JAPANESE) --- */}
            <div className="absolute w-full h-full backface-hidden glass-panel rounded-[2rem] flex flex-col items-center justify-center p-6 md:p-12 border-t border-white/20 shadow-2xl bg-[#151520]/80 backdrop-blur-xl">
              <div className="absolute top-6 text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Japanese</div>

              {/* FURIGANA DISPLAY */}
              {containsKanji ? (
                 <div className="text-xl md:text-3xl text-pink-300 font-medium mb-1 tracking-wider opacity-90 animate-fade-in-up font-jp">
                    {furiganaText || "..."}
                 </div>
              ) : (
                 <div className="h-8 md:h-10 mb-1"></div>
              )}

              {/* Teks Utama */}
              <h1 className="text-5xl md:text-8xl font-bold font-jp text-center text-white drop-shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-2">
                {currentCard.japanese}
              </h1>

              {/* Tombol Audio Aktif */}
              <button 
                 onClick={(e) => { 
                   e.stopPropagation(); 
                   playAudio(currentCard.japanese); 
                 }} 
                 className="mt-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-500 hover:text-primary transition-colors hover:scale-110 active:scale-95 group"
                 title="Play Audio"
              >
                 <Volume2 size={24} className="group-active:animate-ping" />
              </button>

              <div className="absolute bottom-8 text-gray-600 text-sm flex items-center gap-2 opacity-70">
                 <Keyboard size={14}/> Press Space to Flip
              </div>
            </div>

            {/* --- BACK SIDE (MEANING) --- */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 glass-panel rounded-[2rem] flex flex-col items-center justify-center p-6 md:p-12 border-t border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] bg-[#0f0f16]/95">
              <div className="absolute top-6 text-xs uppercase tracking-[0.2em] text-purple-400 font-bold">Meaning</div>
              
              <h3 className="text-3xl md:text-6xl font-bold text-center mb-6 text-white leading-tight">
                {currentCard.indonesia}
              </h3>

              <div className="text-gray-500 font-mono mb-6 text-lg">
                  {furiganaText || currentCard.romaji}
              </div>

              {currentCard.example && (
                <div className="bg-white/5 p-4 md:p-6 rounded-2xl w-full max-w-lg text-center border border-white/5">
                  <p className="text-lg md:text-xl text-purple-200 font-jp mb-1">{currentCard.example}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Example Sentence</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GRADING BUTTONS */}
      <div className={`transition-all duration-500 transform ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-2xl mx-auto">
          <button onClick={() => handleGrade(1)} className="group py-3 md:py-4 rounded-2xl bg-[#1a1a24] border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/50 text-red-400 transition-all flex flex-col items-center gap-1 active:scale-95">
            <span className="font-bold text-sm md:text-base">Again</span>
            <span className="text-[10px] opacity-50 group-hover:opacity-100 uppercase font-mono">1m</span>
          </button>
          <button onClick={() => handleGrade(2)} className="group py-3 md:py-4 rounded-2xl bg-[#1a1a24] border border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/50 text-orange-400 transition-all flex flex-col items-center gap-1 active:scale-95">
            <span className="font-bold text-sm md:text-base">Hard</span>
            <span className="text-[10px] opacity-50 group-hover:opacity-100 uppercase font-mono">10m</span>
          </button>
          <button onClick={() => handleGrade(3)} className="group py-3 md:py-4 rounded-2xl bg-[#1a1a24] border border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/50 text-blue-400 transition-all flex flex-col items-center gap-1 active:scale-95">
            <span className="font-bold text-sm md:text-base">Good</span>
            <span className="text-[10px] opacity-50 group-hover:opacity-100 uppercase font-mono">1d</span>
          </button>
          <button onClick={() => handleGrade(5)} className="group py-3 md:py-4 rounded-2xl bg-[#1a1a24] border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-emerald-400 transition-all flex flex-col items-center gap-1 active:scale-95">
            <span className="font-bold text-sm md:text-base">Easy</span>
            <span className="text-[10px] opacity-50 group-hover:opacity-100 uppercase font-mono">4d</span>
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