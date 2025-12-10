import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCards } from '../modules/decks/api';
import { Card } from '../modules/decks/model';
import { Play, TrendingUp, Clock, Brain, PlusCircle, Layers, Flame, Zap } from 'lucide-react';
import { StatsChart } from '../components/ui/StatsChart';
import SplitText from '../components/ui/SplitText';
import { getUserStats } from '../modules/gamification/streak';
import { UserStats, INITIAL_STATS } from '../modules/gamification/model';

export const Dashboard: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [retentionRate, setRetentionRate] = useState(0);

  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);

  useEffect(() => {
    const allCards = getCards();
    setCards(allCards);

    const now = new Date().toISOString();
    const due = allCards.filter(c => c.reviewMeta.nextReview <= now);
    setDueCount(due.length);

    const learnedCards = allCards.filter(c => c.reviewMeta.repetitions > 0).length;
    const retainedCards = allCards.filter(c => c.reviewMeta.interval > 3).length;
    const rate = learnedCards > 0 ? Math.round((retainedCards / learnedCards) * 100) : 0;
    setRetentionRate(rate);

    const userStats = getUserStats();
    setStats(userStats);
  }, []);

  const hasCards = cards.length > 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in max-w-5xl mx-auto">

      <header className="mb-6 md:mb-8">
        <SplitText
          text="Welcome back, Sensei."
          className="text-3xl md:text-4xl font-bold text-white mb-2"
          delay={50}
          duration={0.8}
        />
        <p className="text-violet-200 text-base md:text-lg">
          {hasCards
            ? `You have ${cards.length} cards in your collection.`
            : "Let's start by building your vocabulary deck."}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        <div className="lg:col-span-2 glass-panel p-4 md:p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[240px] md:min-h-[280px]">
          <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
            <Brain size={100} className="text-primary rotate-12 md:w-[180px] md:h-[180px]" />
          </div>

          {dueCount > 0 ? (
            <>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-200 text-xs md:text-sm font-bold mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Action Required
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-md">
                  {dueCount} Cards Due
                </h2>
                <p className="text-violet-200 max-w-md text-sm md:text-base">
                  Your scheduled reviews are ready. Consistency is key to long-term retention.
                </p>
              </div>

              <div className="relative z-10 mt-6 md:mt-8">
                <Link
                  to="/study"
                  className="inline-flex items-center gap-2 md:gap-3 bg-primary hover:bg-violet-600 text-white text-sm md:text-lg font-bold py-3 px-5 md:py-4 md:px-8 rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_50px_rgba(124,58,237,0.6)] hover:scale-105 transition-all duration-300 group active:scale-95"
                >
                  <Play fill="currentColor" size={20} className="group-hover:translate-x-1 transition-transform md:w-6 md:h-6" />
                  Start Session
                </Link>
              </div>
            </>
          ) : hasCards ? (
            <>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-200 text-xs md:text-sm font-bold mb-4">
                  <CheckIcon /> All Caught Up
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  No cards due right now.
                </h2>
                <p className="text-violet-200 max-w-md text-sm md:text-base">
                  Great job! You can review ahead of schedule to reinforce weak cards or add new material.
                </p>
              </div>

              <div className="relative z-10 mt-6 md:mt-8 flex flex-wrap gap-3 md:gap-4">
                <Link
                  to="/study?mode=cram"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-2.5 px-5 md:py-3 md:px-6 rounded-xl transition-all text-sm md:text-base"
                >
                  <Brain size={18} className="md:w-5 md:h-5" />
                  Review Ahead (Cram)
                </Link>
                <Link
                  to="/decks"
                  className="inline-flex items-center gap-2 bg-transparent hover:bg-white/5 border border-transparent text-violet-300 font-semibold py-2.5 px-5 md:py-3 md:px-6 rounded-xl transition-all text-sm md:text-base"
                >
                  <PlusCircle size={18} className="md:w-5 md:h-5" />
                  Manage Decks
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Start your journey.
                </h2>
                <p className="text-violet-200 max-w-md text-sm md:text-base">
                  Import a JSON file or create your first deck to begin learning Japanese efficiently.
                </p>
              </div>

              <div className="relative z-10 mt-6 md:mt-8">
                <Link
                  to="/import"
                  className="inline-flex items-center gap-3 bg-primary hover:bg-violet-600 text-white text-sm md:text-lg font-bold py-3 px-5 md:py-4 md:px-8 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <Layers size={20} className="md:w-6 md:h-6" />
                  Import Vocabulary
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4 md:gap-4">

          {/* Level Card */}
          <div className="glass-panel p-5 md:p-6 rounded-3xl flex-1 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
              <Zap size={80} className="text-yellow-400 rotate-12" />
            </div>
            <div className="flex items-center gap-3 mb-2 text-violet-300 font-semibold uppercase tracking-wider text-[10px] md:text-xs relative z-10">
              <Zap size={16} className="text-yellow-400" /> Level {stats.level}
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-1">
                <span className="text-2xl font-bold text-white">{stats.currentXp} <span className="text-sm text-gray-400 font-normal">XP</span></span>
                <span className="text-xs text-gray-400">Next: {stats.nextLevelXp} XP</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (stats.currentXp / stats.nextLevelXp) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="glass-panel p-5 md:p-6 rounded-3xl flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-violet-300 font-semibold uppercase tracking-wider text-[10px] md:text-xs">
              <TrendingUp size={16} /> Retention Rate
            </div>
            <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              {retentionRate}%
            </div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">
              of learned cards recalled
            </div>
          </div>

          <div className="glass-panel p-5 md:p-6 rounded-3xl flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-violet-300 font-semibold uppercase tracking-wider text-[10px] md:text-xs">
              <Clock size={16} /> Total Learned
            </div>
            <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              {cards.filter(c => c.reviewMeta.repetitions > 0).length}
            </div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">
              cards in long-term memory
            </div>
          </div>

          <div className="glass-panel p-5 md:p-6 rounded-3xl flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-violet-300 font-semibold uppercase tracking-wider text-[10px] md:text-xs">
              <Flame size={16} className="text-orange-500" /> Daily Streak
            </div>
            <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              {stats.streak}
            </div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">
              days in a row
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 md:p-8 rounded-3xl mb-20 md:mb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-500/20 rounded-lg text-violet-300">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-xl text-white">Jadwal Review</h3>
              <p className="text-xs text-gray-400">Kapan kamu harus review kartu</p>
            </div>
          </div>
        </div>
        <div className="h-56 md:h-64 w-full">
          {cards.length > 0 ? (
            <StatsChart cards={cards} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-xl">
              <p className="text-sm">Tambah kartu untuk melihat jadwal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);