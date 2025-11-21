
import React, { useState, useEffect } from 'react';
import { getDecks, getCards, createDeck, updateDeckName, deleteDeck, deleteCard, updateCard } from '../utils/storage';
import { Deck, Card } from '../types';
import { Folder, Plus, Trash2, Edit2, MoreVertical, Layers, ArrowRight } from 'lucide-react';

export const Decks: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const d = getDecks();
    setDecks(d);
    setCards(getCards());
    if (!selectedDeckId && d.length > 0) {
      setSelectedDeckId(d[0].id);
    }
  };

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    const newDeck = createDeck(newDeckName);
    setNewDeckName('');
    setIsCreating(false);
    refreshData();
    setSelectedDeckId(newDeck.id);
  };

  const handleDeleteDeck = (id: string) => {
    if (window.confirm('Are you sure? Cards in this deck will be moved to another deck.')) {
      deleteDeck(id);
      refreshData();
      // If we deleted the selected deck, select the first available
      if (selectedDeckId === id) {
        const remaining = getDecks();
        if (remaining.length > 0) setSelectedDeckId(remaining[0].id);
      }
    }
  };

  const handleUpdateDeckName = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDeckId && editingName.trim()) {
      updateDeckName(editingDeckId, editingName);
      setEditingDeckId(null);
      refreshData();
    }
  };

  const handleMoveCard = (card: Card, targetDeckId: string) => {
    updateCard({ ...card, deckId: targetDeckId });
    refreshData();
  };

  const handleDeleteCard = (cardId: string) => {
    if (window.confirm('Delete this card?')) {
      deleteCard(cardId);
      refreshData();
    }
  };

  const filteredCards = cards.filter(c => c.deckId === selectedDeckId);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-fade-in">
      
      {/* Left Sidebar: Deck List */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="text-purple-400" size={20} /> Decks
          </h2>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateDeck} className="mb-2">
            <input 
              autoFocus
              type="text" 
              placeholder="Deck Name..." 
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 text-white"
              value={newDeckName}
              onChange={e => setNewDeckName(e.target.value)}
              onBlur={() => !newDeckName && setIsCreating(false)}
            />
          </form>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {decks.map(deck => (
            <div 
              key={deck.id}
              onClick={() => setSelectedDeckId(deck.id)}
              className={`
                group flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all
                ${selectedDeckId === deck.id 
                  ? 'bg-purple-500/20 border-purple-500/50 text-white' 
                  : 'bg-glass-panel border-transparent hover:bg-white/5 text-gray-400'}
              `}
            >
              {editingDeckId === deck.id ? (
                <form onSubmit={handleUpdateDeckName} className="flex-1 mr-2" onClick={e => e.stopPropagation()}>
                   <input 
                    autoFocus
                    className="w-full bg-transparent border-b border-purple-500 outline-none text-white"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => setEditingDeckId(null)}
                   />
                </form>
              ) : (
                <div className="flex flex-col">
                  <span className="font-medium">{deck.name}</span>
                  <span className="text-xs opacity-60">{cards.filter(c => c.deckId === deck.id).length} cards</span>
                </div>
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingDeckId(deck.id); setEditingName(deck.name); }}
                  className="p-1.5 hover:bg-white/10 rounded-md"
                >
                  <Edit2 size={14} />
                </button>
                {decks.length > 1 && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                    className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content: Deck Details */}
      <div className="flex-1 glass-panel rounded-3xl p-6 flex flex-col overflow-hidden">
        {selectedDeckId && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">
                  {decks.find(d => d.id === selectedDeckId)?.name}
                </h1>
                <p className="text-gray-400 text-sm">Manage cards in this deck</p>
              </div>
              <div className="text-sm text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                {filteredCards.length} Cards
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {filteredCards.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                  <Folder size={48} className="mb-4" />
                  <p>This deck is empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCards.map(card => (
                    <div key={card.id} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between group">
                      <div className="min-w-0 flex-1 mr-4">
                        <div className="flex items-baseline gap-3 mb-1">
                           <h3 className="font-bold text-lg truncate text-white">{card.japanese}</h3>
                           <span className="text-purple-400 text-sm">{card.romaji}</span>
                        </div>
                        <p className="text-gray-400 text-sm truncate">{card.indonesia}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative group/move">
                           <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white" title="Move to...">
                             <ArrowRight size={18} />
                           </button>
                           {/* Dropdown for moving */}
                           <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl p-1 z-50 hidden group-hover/move:block">
                             <div className="text-xs text-gray-500 px-3 py-2 uppercase font-bold">Move to...</div>
                             {decks.filter(d => d.id !== selectedDeckId).map(targetDeck => (
                               <button
                                 key={targetDeck.id}
                                 onClick={() => handleMoveCard(card, targetDeck.id)}
                                 className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg text-gray-300"
                               >
                                 {targetDeck.name}
                               </button>
                             ))}
                             {decks.length <= 1 && <div className="px-3 py-2 text-xs text-gray-600">No other decks</div>}
                           </div>
                        </div>

                        <button 
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Delete Card"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};
