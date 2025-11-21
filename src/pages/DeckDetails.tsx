import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDecks, getCards, deleteCard } from '../utils/storage';
import { Deck, Card } from '../types';
import { ArrowLeft, Search, Trash2, Plus, BookOpen } from 'lucide-react';

export const DeckDetails: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!deckId) return;
    loadData();
  }, [deckId]);

  const loadData = () => {
    const decks = getDecks();
    const foundDeck = decks.find(d => d.id === deckId);
    if (foundDeck) {
      setDeck(foundDeck);
      setCards(getCards(deckId));
    } else {
      navigate('/decks');
    }
  };

  const handleDeleteCard = (cardId: string) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      deleteCard(cardId);
      loadData();
    }
  };

  const filteredCards = useMemo(() => {
    return cards.filter(c => 
      (c.japanese || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.romaji || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.indonesia || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cards, searchQuery]);

  if (!deck) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="flex items-center gap-4">
          <Link to="/decks" className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{deck.name}</h1>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300 whitespace-nowrap">{cards.length} cards</span>
            </div>
            <p className="text-sm md:text-base text-gray-400 line-clamp-2">{deck.description}</p>
          </div>
        </div>
        
        <div className="ml-auto flex gap-2 w-full md:w-auto">
           <Link 
             to={`/study?deckId=${deck.id}`}
             className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-violet-600 text-white font-bold transition-all shadow-lg w-full md:w-auto"
           >
             <BookOpen size={18} /> Study Deck
           </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/20 p-3 md:p-4 rounded-2xl border border-white/5">
         <div className="relative flex-1 w-full sm:max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
           <input 
             type="text" 
             placeholder="Search in deck..." 
             className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
           />
         </div>
         <Link to="/import" className="flex items-center justify-center gap-2 text-sm text-primary hover:text-violet-300 font-semibold px-4 py-2.5 rounded-lg hover:bg-white/5 border border-white/5 sm:border-transparent">
           <Plus size={16} /> Add Cards
         </Link>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
        {filteredCards.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="text-gray-500" />
             </div>
             <h3 className="text-lg font-semibold text-white mb-2">No cards found</h3>
             <p className="text-gray-400 max-w-sm mb-6 text-sm">
               {cards.length === 0 
                 ? "This deck is empty. Import some cards to get started!" 
                 : "No cards match your search criteria."}
             </p>
             {cards.length === 0 && (
                <Link to="/import" className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium">
                  Go to Import
                </Link>
             )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-3 md:p-4 font-medium">Japanese</th>
                  <th className="p-3 md:p-4 font-medium">Romaji</th>
                  <th className="p-3 md:p-4 font-medium">Meaning</th>
                  <th className="p-3 md:p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-3 md:p-4">
                      <div className="font-jp text-base md:text-lg font-bold text-white">{card.japanese}</div>
                      {card.example && <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px] md:max-w-[200px]">{card.example}</div>}
                    </td>
                    <td className="p-3 md:p-4 text-violet-200 font-medium text-sm md:text-base">{card.romaji}</td>
                    <td className="p-3 md:p-4 text-gray-300 text-sm md:text-base">{card.indonesia}</td>
                    <td className="p-3 md:p-4 text-right">
                      <button 
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Card"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};