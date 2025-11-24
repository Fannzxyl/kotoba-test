import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getCards } from '../modules/decks/api';
import type { Card as DeckCard } from '../modules/decks/model';
import { AlertCircle } from 'lucide-react';

type Side = 'jp' | 'id';

interface Tile {
  id: string;
  cardId: string;
  side: Side;
  primary: string;
  secondary?: string;
  matched: boolean;
}

export const MatchGame: React.FC = () => {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [wrongPair, setWrongPair] = useState<string[] | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  // Load deck & generate tiles
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deckId = params.get('deckId') || undefined;

    const cards: DeckCard[] = getCards(deckId);
    const valid = cards.filter(
      (c) => c.japanese && c.indonesia && c.romaji
    );

    if (valid.length < 3) {
      setError(
        'Not enough cards in this deck to play Match game. Please add at least 3 cards with Japanese, romaji, and meaning.'
      );
      setLoading(false);
      return;
    }

    const maxPairs = Math.min(8, valid.length);
    const picked = [...valid].sort(() => Math.random() - 0.5).slice(0, maxPairs);

    const generatedTiles: Tile[] = [];

    picked.forEach((c) => {
      generatedTiles.push(
        {
          id: `${c.id}-jp`,
          cardId: c.id,
          side: 'jp',
          primary: c.japanese || '',
          secondary: c.romaji || '',
          matched: false,
        },
        {
          id: `${c.id}-id`,
          cardId: c.id,
          side: 'id',
          primary: c.indonesia || '',
          matched: false,
        }
      );
    });

    const shuffled = generatedTiles.sort(() => Math.random() - 0.5);

    setTiles(shuffled);
    setLoading(false);
    setMoves(0);
    setStartTime(Date.now());
    setEndTime(null);
    setCompleted(false);
    setSelected(null);
    setWrongPair(null);
  }, [location.search]);

  const handleTileClick = (tile: Tile) => {
    if (tile.matched) return;

    if (!selected) {
      setSelected(tile);
      setWrongPair(null);
      return;
    }

    if (selected.id === tile.id) return; // klik ubin yang sama

    setMoves((m) => m + 1);

    const first = selected;
    const second = tile;

    if (first.cardId === second.cardId && first.side !== second.side) {
      // Match
      const updated = tiles.map((t) =>
        t.cardId === first.cardId ? { ...t, matched: true } : t
      );
      setTiles(updated);
      setSelected(null);
      setWrongPair(null);

      const allMatched = updated.every((t) => t.matched);
      if (allMatched) {
        setCompleted(true);
        setEndTime(Date.now());
      }
    } else {
      // Salah pasangan → kasih efek merah sebentar
      setWrongPair([first.id, second.id]);
      setTimeout(() => {
        setWrongPair(null);
        setSelected(null);
      }, 500);
    }
  };

  const getElapsedSeconds = () => {
    if (!startTime) return 0;
    const end = endTime ?? Date.now();
    return Math.round((end - startTime) / 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-300">
        Loading matching game...
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
        <Link to={-1 as any} className="hover:text-white">
          &larr; Back
        </Link>
        <div className="flex items-center gap-4">
          <span>Moves: {moves}</span>
          <span>{getElapsedSeconds()} detik</span>
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-300">
        Cocokkan pasangan <span className="font-semibold">Bahasa Jepang</span>{' '}
        dan <span className="font-semibold">artinya</span>. Tap dua kartu yang
        berpasangan. Semua kartu selalu terlihat, jadi fokus ke kecepatan.
      </div>

      {/* Grid tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
        {tiles.map((tile) => {
          const isSelected = selected?.id === tile.id;
          const isWrong = wrongPair?.includes(tile.id) ?? false;
          const isJp = tile.side === 'jp';

          let base =
            'aspect-[3/4] rounded-2xl border text-sm px-2 py-2 flex flex-col justify-center items-center text-center transition-all';
          let style = 'border-white/10 bg-white/5 text-gray-200';

          if (tile.matched) {
            style =
              'border-emerald-500/80 bg-emerald-500/15 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
          } else if (isWrong) {
            style =
              'border-red-500/80 bg-red-500/20 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.4)]';
          } else if (isSelected) {
            style =
              'border-purple-500/80 bg-purple-500/20 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]';
          }

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              className={`${base} ${style}`}
            >
              <div
                className={`${
                  isJp ? 'font-jp text-lg leading-tight' : 'text-base'
                }`}
              >
                {tile.primary}
              </div>
              {tile.secondary && (
                <div className="text-xs text-gray-300 mt-1">{tile.secondary}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {completed && (
        <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
          <div className="text-sm text-gray-400 mb-1">Selesai!</div>
          <div className="text-lg text-white">
            {moves} langkah • {getElapsedSeconds()} detik
          </div>
        </div>
      )}
    </div>
  );
};
