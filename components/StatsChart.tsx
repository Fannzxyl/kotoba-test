import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card } from '../types';

interface StatsChartProps {
  cards: Card[];
}

export const StatsChart: React.FC<StatsChartProps> = ({ cards }) => {
  // Calculate stats: Count of cards by next review range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = [
    { name: 'Due', count: 0, color: '#d946ef' },
    { name: 'Tom.', count: 0, color: '#a855f7' }, // Tomorrow
    { name: '7 Days', count: 0, color: '#8b5cf6' },
    { name: 'Later', count: 0, color: '#6366f1' },
  ];

  cards.forEach(card => {
    const review = new Date(card.reviewMeta.nextReview);
    const diffTime = review.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) stats[0].count++;
    else if (diffDays === 1) stats[1].count++;
    else if (diffDays <= 7) stats[2].count++;
    else stats[3].count++;
  });

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={stats}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis dataKey="name" stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} />
          <YAxis stroke="#666" tick={{fill: '#9ca3af', fontSize: 12}} allowDecimals={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1a24', borderColor: '#333', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
            cursor={{fill: 'rgba(255,255,255,0.05)'}}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {stats.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};