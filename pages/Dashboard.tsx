import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCards } from '../utils/storage';
import { Card } from '../types';
import { Play, TrendingUp, List, Clock } from 'lucide-react';
import { StatsChart } from '../components/StatsChart';

export const Dashboard: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    const allCards = getCards();
    setCards(allCards);

    const now = new Date().toISOString();
    const due = allCards.filter(c => c.reviewMeta.nextReview <= now);
    setDueCount(due.length);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Play size={120} />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">Ready to learn?</h2>
            <p className="text-gray-400 mb-6">You have cards waiting for review today.</p>
            
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-5xl font-bold text-white">{dueCount}</span>
              <span className="text-purple-300">cards due</span>
            </div>
          </div>
          
          <Link 
            to="/study" 
            className="bg-white text-black font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <Play fill="currentColor" size={20} />
            Start Session
          </Link>
        </div>

        <div className="glass-panel p-8 rounded-3xl flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-purple-400">
                <TrendingUp size={20} />
                <h3 className="font-semibold uppercase tracking-wider text-sm">Progress Overview</h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
                 {cards.length > 0 ? (
                   <StatsChart cards={cards} />
                 ) : (
                   <div className="text-gray-500 text-center">
                     <p>No data yet.</p>
                     <p className="text-sm mt-2">Import some cards to see stats.</p>
                   </div>
                 )}
            </div>
        </div>
      </div>

      {/* Deck Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Cards" value={cards.length} icon={<List size={16} />} />
        <StatCard label="Learned" value={cards.filter(c => c.reviewMeta.repetitions > 0).length} icon={<TrendingUp size={16} />} />
        <StatCard label="New" value={cards.filter(c => c.reviewMeta.repetitions === 0).length} icon={<ZapIcon size={16} />} />
        <StatCard label="Average Interval" value={Math.round(cards.reduce((acc, c) => acc + c.reviewMeta.interval, 0) / (cards.length || 1)) + 'd'} icon={<Clock size={16} />} />
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="glass-panel p-4 rounded-2xl border-l-4 border-purple-500/50">
    <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">
      {icon} {label}
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

// Helper icon component
const ZapIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);