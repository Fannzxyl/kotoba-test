import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDecks, useCards } from '../modules/decks/hooks';
import { exportDeckToJSON } from '../modules/decks/api';
import { Deck, Card } from '../modules/decks/model';
import { 
  Search, Plus, MoreVertical, Play, Edit2, Trash2, Download, 
  RotateCcw, X, Layers 
} from 'lucide-react';

export const Decks: React.FC = () => {
  const navigate = useNavigate();
  
  // Use Custom Hooks
  const { decks, createDeck, updateDeck, deleteDeck, restoreDeck } = useDecks();
  // We load all cards to count them for each deck, strictly speaking we could optimize this in API
  // but for now client-side filtering is fine for the scale.
  const { cards, refreshCards } = useCards();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  
  const [deletedDeck, setDeletedDeck] = useState<{ deck: Deck, cards: Card[] } | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (showUndo) {
      timeout = setTimeout(() => {
        setShowUndo(false);
        setDeletedDeck(null);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [showUndo]);

  // Refresh all data when component mounts or relevant actions happen
  // const refreshData = () => {
  //   refreshDecks();
  //   refreshCards();
  // };

  const handleSaveDeck = (name: string, description: string, tags: string[]) => {
    if (editingDeck) {
      updateDeck(editingDeck.id, { name, description, tags });
    } else {
      createDeck(name, description, tags);
    }
    setIsFormOpen(false);
    setEditingDeck(null);
  };

  const handleDelete = (id: string) => {
    const deck = decks.find(d => d.id === id);
    if (!deck) return;
    
    const deckCards = cards.filter(c => c.deckId === id);
    
    setDeletedDeck({ deck, cards: deckCards });
    setShowUndo(true);
    
    deleteDeck(id);
    // cards will refresh automatically if we built the hook right, 
    // but our useCards hook doesn't listen to deck changes automatically unless we trigger it
    refreshCards(); 
  };

  const handleUndo = () => {
    if (deletedDeck) {
      restoreDeck(deletedDeck.deck, deletedDeck.cards);
      setShowUndo(false);
      setDeletedDeck(null);
      refreshCards();
    }
  };

  const handleExport = (id: string) => {
    const json = exportDeckToJSON(id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katasensei-deck-${id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredDecks = useMemo(() => {
    return decks.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (d.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? d.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [decks, searchQuery, selectedTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    decks.forEach(d => d.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [decks]);

  const getCardCount = (deckId: string) => cards.filter(c => c.deckId === deckId).length;
  const getDueCount = (deckId: string) => {
    const now = new Date().toISOString();
    return cards.filter(c => c.deckId === deckId && c.reviewMeta.nextReview <= now).length;
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Decks</h1>
          <p className="text-gray-400">Manage and organize your learning collections</p>
        </div>
        <button 
          onClick={() => { setEditingDeck(null); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-violet-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all"
        >
          <Plus size={20} /> Create Deck
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
           <input 
             type="text" 
             placeholder="Search decks..." 
             className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
           />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
           <button 
             onClick={() => setSelectedTag('')}
             className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm font-medium border ${!selectedTag ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-transparent text-gray-400 hover:text-white'}`}
           >
             All
           </button>
           {allTags.map(tag => (
             <button 
               key={tag}
               onClick={() => setSelectedTag(tag)}
               className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all text-sm font-medium border ${selectedTag === tag ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-transparent border-transparent text-gray-400 hover:text-white'}`}
             >
               #{tag}
             </button>
           ))}
        </div>
      </div>

      {/* Undo Toast */}
      {showUndo && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a24] border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-slide-up">
          <span className="text-sm text-white">Deck deleted</span>
          <button onClick={handleUndo} className="flex items-center gap-1 text-primary hover:text-violet-300 font-bold text-sm">
            <RotateCcw size={14} /> Undo
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDecks.map(deck => {
           const cardCount = getCardCount(deck.id);
           const dueCount = getDueCount(deck.id);

           return (
             <div key={deck.id} className="glass-panel rounded-2xl p-6 relative group hover:border-primary/30 transition-all duration-300">
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="dropdown dropdown-end relative">
                     <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                       <MoreVertical size={18} />
                     </button>
                     {/* Simple CSS Dropdown would go here, for now using basic absolute for demo */}
                     <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-32 bg-[#0f0f16] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                        <button onClick={() => { setEditingDeck(deck); setIsFormOpen(true); }} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-gray-300 flex items-center gap-2">
                          <Edit2 size={14} /> Edit
                        </button>
                        <button onClick={() => handleExport(deck.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-gray-300 flex items-center gap-2">
                          <Download size={14} /> Export
                        </button>
                        <button onClick={() => handleDelete(deck.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-red-500/10 text-red-400 flex items-center gap-2">
                          <Trash2 size={14} /> Delete
                        </button>
                     </div>
                  </div>
                </div>

                <div className="mb-4">
                   <div className="flex flex-wrap gap-2 mb-3">
                     {deck.tags?.map(t => (
                       <span key={t} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-white/5 rounded text-gray-400">#{t}</span>
                     ))}
                   </div>
                   <h3 className="text-xl font-bold text-white mb-1">{deck.name}</h3>
                   <p className="text-sm text-gray-400 line-clamp-2 h-10">{deck.description}</p>
                </div>

                <div className="flex items-center gap-4 mb-6">
                   <div className="flex-1 bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-white">{cardCount}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Cards</div>
                   </div>
                   <div className="flex-1 bg-primary/10 rounded-lg p-2 text-center border border-primary/20">
                      <div className="text-lg font-bold text-primary">{dueCount}</div>
                      <div className="text-[10px] text-primary/60 uppercase">Due</div>
                   </div>
                </div>

                <div className="flex gap-2">
                   <button 
                     onClick={() => navigate(`/study?deckId=${deck.id}`)}
                     className="flex-1 bg-primary hover:bg-violet-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                   >
                     <Play size={16} fill="currentColor" /> Study
                   </button>
                   <button 
                     onClick={() => navigate(`/decks/${deck.id}`)}
                     className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white transition-colors"
                     title="View Cards"
                   >
                     <Layers size={18} />
                   </button>
                </div>
             </div>
           );
        })}

        {/* Add New Card Placeholder */}
        <button 
          onClick={() => { setEditingDeck(null); setIsFormOpen(true); }}
          className="rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center p-6 min-h-[250px] group transition-all"
        >
           <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
             <Plus size={32} className="text-gray-500 group-hover:text-primary transition-colors" />
           </div>
           <span className="font-bold text-gray-400 group-hover:text-white">Create New Deck</span>
        </button>
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a24] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-white">{editingDeck ? 'Edit Deck' : 'New Deck'}</h2>
               <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                 <X className="text-gray-400" size={20} />
               </button>
             </div>
             <DeckForm 
               initialData={editingDeck || undefined} 
               onSubmit={handleSaveDeck} 
               onCancel={() => setIsFormOpen(false)}
             />
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for the form to keep main component cleaner
const DeckForm: React.FC<{ 
  initialData?: Deck; 
  onSubmit: (name: string, desc: string, tags: string[]) => void;
  onCancel: () => void;
}> = ({ initialData, onSubmit, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [desc, setDesc] = useState(initialData?.description || '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    onSubmit(name, desc, tagList);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Deck Name</label>
        <input 
          required 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
          placeholder="e.g. JLPT N5 Vocabulary" 
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Description</label>
        <textarea 
          value={desc} 
          onChange={e => setDesc(e.target.value)} 
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none h-24 resize-none" 
          placeholder="What is this deck about?" 
        />
      </div>
      <div>
        <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Tags (comma separated)</label>
        <input 
          type="text" 
          value={tags} 
          onChange={e => setTags(e.target.value)} 
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
          placeholder="e.g. vocab, n5, verbs" 
        />
      </div>
      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-colors">
          Cancel
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-primary hover:bg-violet-600 text-white transition-colors shadow-lg">
          Save Deck
        </button>
      </div>
    </form>
  );
};
