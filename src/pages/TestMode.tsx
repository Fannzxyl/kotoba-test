import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getCards } from '../modules/decks/api';
import type { Card as DeckCard } from '../modules/decks/model';
import { AlertCircle } from 'lucide-react';

interface QuizOption {
  id: string;
  labelTop: string;
  labelBottom: string;
  isCorrect: boolean;
}

export const TestMode: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allCards, setAllCards] = useState<DeckCard[]>([]);
  const [quizCards, setQuizCards] = useState<DeckCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [options, setOptions] = useState<QuizOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const [totalQuestions, setTotalQuestions] = useState(0);

  // Ambil deckId dari query (?deckId=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deckId = params.get('deckId') || undefined;

    const cards = getCards(deckId);
    const valid = cards.filter(
      (c) => c.japanese && c.indonesia && c.romaji
    );

    if (valid.length < 4) {
      setError(
        'Not enough cards in this deck to play Quiz. Please add at least 4 cards with Japanese, romaji, and meaning.'
      );
      setLoading(false);
      return;
    }

    const shuffled = [...valid].sort(() => Math.random() - 0.5);
    const limit = Math.min(20, shuffled.length); // max 20 soal

    setAllCards(valid);
    setQuizCards(shuffled.slice(0, limit));
    setTotalQuestions(limit);
    setCurrentIndex(0);
    setLoading(false);
  }, [location.search]);

  const currentCard = quizCards[currentIndex];

  // Generate opsi tiap kali pindah soal
  useEffect(() => {
    if (!currentCard || allCards.length === 0) return;

    setSelectedId(null);
    setShowResult(false);

    const others = allCards
      .filter((c) => c.id !== currentCard.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions: QuizOption[] = [
      {
        id: currentCard.id,
        labelTop: currentCard.japanese,
        labelBottom: currentCard.romaji!,
        isCorrect: true,
      },
      ...others.map((c) => ({
        id: c.id,
        labelTop: c.japanese,
        labelBottom: c.romaji!,
        isCorrect: false,
      })),
    ].sort(() => Math.random() - 0.5);

    setOptions(allOptions);
  }, [currentCard, allCards]);

  const handleSelect = (option: QuizOption) => {
    if (showResult) return;
    setSelectedId(option.id);
    setShowResult(true);

    if (option.isCorrect) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Akhir kuis: tetap di soal terakhir, tapi result akan ditampilkan
      }
    }, 900);
  };

  const isFinished = currentIndex >= totalQuestions - 1 && showResult;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-300">
        Loading quiz...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
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

  if (!currentCard) {
    return null;
  }

  const progress = totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <Link to={-1 as any} className="hover:text-white">
          &larr; Back
        </Link>
        <div className="font-mono">
          {currentIndex + 1} / {totalQuestions}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-400">Score: {score}</div>
        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <div className="text-sm text-gray-400">Terjemahkan ke bahasa Jepang</div>
        <div className="text-2xl font-semibold text-white">
          {currentCard.indonesia}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mt-4">
        <div className="text-sm text-gray-400 mb-1">Pilih jawaban yang benar</div>
        {options.map((opt) => {
          const isSelected = selectedId === opt.id;
          const isCorrect = opt.isCorrect;

          let border = 'border-white/10';
          let bg = 'bg-white/5';
          let text = 'text-white';

          if (showResult) {
            if (isCorrect) {
              border = 'border-emerald-500/80';
              bg = 'bg-emerald-500/10';
              text = 'text-emerald-300';
            } else if (isSelected && !isCorrect) {
              border = 'border-red-500/80';
              bg = 'bg-red-500/10';
              text = 'text-red-300';
            }
          } else if (isSelected) {
            border = 'border-purple-500/80';
            bg = 'bg-purple-500/10';
          }

          return (
            <button
              key={opt.id + opt.labelTop}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left rounded-2xl px-4 py-3 border ${border} ${bg} ${text} transition-all`}
            >
              <div className="font-jp text-lg leading-tight">
                {opt.labelTop}
              </div>
              <div className="text-sm text-gray-400 mt-1">{opt.labelBottom}</div>
            </button>
          );
        })}
      </div>

      {/* Result summary */}
      {isFinished && (
        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="text-sm text-gray-400 mb-1">Kuis selesai</div>
          <div className="text-xl font-bold text-white">
            Skor: {score} / {totalQuestions}
          </div>
        </div>
      )}
    </div>
  );
};
