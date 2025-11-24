import React from 'react';
import { GameStats } from '../core/types';
import { Heart } from 'lucide-react';

interface HudProps {
  stats: GameStats;
  prompt: string;
  promptMode: 'meaning' | 'romaji';
}

export const Hud: React.FC<HudProps> = ({ stats, prompt, promptMode: _promptMode }) => {
  // Pisahkan teks Jepang dan romaji dari prompt "卵 (tamago)"
  const hasRomaji = prompt.includes('(') && prompt.includes(')');
  const mainText = hasRomaji ? prompt.split('(')[0].trim() : prompt;
  const romajiText = hasRomaji
    ? (prompt.match(/\((.*?)\)/)?.[1] ?? '')
    : '';

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        {/* Lives */}
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              size={28}
              className={`${
                i < stats.lives
                  ? 'text-red-500 fill-red-500'
                  : 'text-gray-700'
              } transition-colors`}
            />
          ))}
        </div>

        {/* Score */}
        <div className="text-right">
          <div className="text-3xl font-bold text-white font-mono">
            {stats.score.toString().padStart(5, '0')}
          </div>
          <div className="text-xs text-primary font-bold tracking-widest uppercase">
            Streak x{stats.streak}
          </div>
        </div>
      </div>

      {/* Prompt Area (Center Top) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-md text-center">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 shadow-xl animate-fade-in">
          <div className="text-[10px] text-purple-300 uppercase font-semibold tracking-wider mb-1">
            Pilih artinya
          </div>

          <div className="text-3xl md:text-5xl font-bold text-white mb-1 leading-tight">
            {mainText}
          </div>

          {romajiText && (
            <div className="text-sm md:text-base text-purple-300">
              {romajiText}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info */}
      <div className="text-center text-xs text-gray-500">
        Level {stats.level} • Round {stats.round}
      </div>
    </div>
  );
};
