import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCards } from '../utils/storage';
import { Card } from '../types';
import { Play, TrendingUp, List, Clock, Brain, PlusCircle, Layers } from 'lucide-react';
import { StatsChart } from '../components/StatsChart';

export const Dashboard: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [retentionRate, setRetentionRate] = useState(0);

  useEffect(() => {
    const allCards = getCards();
    setCards(allCards);

    const now = new Date().toISOString();
    const due = allCards.filter(c => c.reviewMeta.nextReview <= now);
    setDueCount(due.length);

    // Calculate Retention: Percentage of cards with EF > 2.5 (arbitrary threshold for "well known") 
    // or interval > 3 days. Let's use Interval > 3.
    const learnedCards = allCards.filter(c => c.reviewMeta.repetitions > 0).length;
    const retainedCards = allCards.filter(c => c.reviewMeta.interval > 3).length;
    const rate = learnedCards > 0 ? Math.round((retainedCards / learnedCards) * 100) : 0;
    setRetentionRate(rate);

  }, []);

  const hasCards = cards.length > 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Greeting */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, Sensei.
        </h1>
        <p className="text-violet-200 text-lg">
          {hasCards 
            ? `You have ${cards.length} cards in your collection.` 
            : "Let's start by building your vocabulary deck."}
        </p>
      </header>

      {/* Hero Section - Dynamic based on state */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main CTA Card */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <Brain size={180} className="text-primary rotate-12" />
          </div>

          {dueCount > 0 ? (
            <>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-bold mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Action Required
                </div>
                <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-md">
                  {dueCount} Cards Due
                </h2>
                <p className="text-violet-200 max-w-md">
                  Your scheduled reviews are ready. Consistency is key to long-term retention.
                </p>
              </div>
              
              <div className="relative z-10 mt-8">
                <Link 
                  to="/study" 
                  className="inline-flex items-center gap-3 bg-primary hover:bg-violet-600 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_50px_rgba(124,58,237,0.6)] hover:scale-105 transition-all duration-300 group"
                >
                  <Play fill="currentColor" size={24} className="group-hover:translate-x-1 transition-transform" />
                  Start Session
                </Link>
              </div>
            </>
          ) : hasCards ? (
            <>
               <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-200 text-sm font-bold mb-4">
                  <CheckIcon /> All Caught Up
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  No cards due right now.
                </h2>
                <p className="text-violet-200 max-w-md">
                  Great job! You can review ahead of schedule to reinforce weak cards or add new material.
                </p>
              </div>
              
              <div className="relative z-10 mt-8 flex flex-wrap gap-4">
                <Link 
                  to="/study?mode=cram" 
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                  <Brain size={20} />
                  Review Ahead (Cram)
                </Link>
                <Link 
                  to="/decks" 
                  className="inline-flex items-center gap-2 bg-transparent hover:bg-white/5 border border-transparent text-violet-300 font-semibold py-3 px-6 rounded-xl transition-all"
                >
                  <PlusCircle size={20} />
                  Manage Decks
                </Link>
              </div>
            </>
          ) : (
            <>
               <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-2">
                  Start your journey.
                </h2>
                <p className="text-violet-200 max-w-md">
                  Import a JSON file or create your first deck to begin learning Japanese efficiently.
                </p>
              </div>
              
              <div className="relative z-10 mt-8">
                <Link 
                  to="/import" 
                  className="inline-flex items-center gap-3 bg-primary hover:bg-violet-600 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <Layers size={24} />
                  Import Vocabulary
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="flex flex-col gap-4">
           <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2 text-violet-300 font-semibold uppercase tracking-wider text-xs">
                <TrendingUp size={16} /> Retention Rate
              </div>
              <div className="text-5xl font-bold text-white tracking-tight">
                {retentionRate}%
              </div>
              <div className="text-sm text-gray-400 mt-1">
                of learned cards recalled
              </div>
           </div>

           <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2 text-violet-300 font-semibold uppercase tracking-wider text-xs">
                <Clock size={16} /> Total Learned
              </div>
              <div className="text-5xl font-bold text-white tracking-tight">
                {cards.filter(c => c.reviewMeta.repetitions > 0).length}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                cards in long-term memory
              </div>
           </div>
        </div>
      </div>

      {/* Detailed Stats Section */}
      <div className="glass-panel p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                  <div className="p-2 bg-violet-500/20 rounded-lg text-violet-300">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-white">Forecast</h3>
                    <p className="text-sm text-gray-400">Upcoming review load</p>
                  </div>
              </div>
          </div>
          <div className="h-64 w-full">
               {cards.length > 0 ? (
                 <StatsChart cards={cards} />
               ) : (
                 <div className="h-full flex items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-xl">
                   <p>Add cards to see your forecast</p>
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
