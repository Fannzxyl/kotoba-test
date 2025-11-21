import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getDecks, getCards, createDeck, updateDeck, deleteDeck, restoreDeck, 
  addCards, exportDeckToJSON 
} from '../utils/storage';
import { Deck, Card } from '../types';
import { 
  Search, Plus, MoreVertical, Play, Edit2, Trash2, Download, 
  Upload, X, Layers, RotateCcw, Eye 
} from 'lucide-react';

export const Decks: React.FC = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  
  const [deletedDeck, setDeletedDeck] = useState<{ deck: Deck, cards: Card[] } | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

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

  const refreshData = () => {
    setDecks(getDecks());
    setCards(getCards());
  };

  const handleSaveDeck = (name: string, description: string, tags: string[]) => {
    if (editingDeck) {
      updateDeck(editingDeck.id, { name, description, tags });
    } else {
      createDeck(name, description, tags);
    }
    setIsFormOpen(false);
    setEditingDeck(null);
    refreshData();
  };

  const handleDelete = (id: string) => {
    const deck = decks.find(d => d.id === id);
    if (!deck) return;
    
    const deckCards = cards.filter(c => c.deckId === id);
    
    setDeletedDeck({ deck, cards: deckCards });
    setShowUndo(true);
    
    deleteDeck(id);
    refreshData();
  };

  const handleUndo = () => {
    if (deletedDeck) {
      restoreDeck(deletedDeck.deck, deletedDeck.cards);
      setShowUndo(false);
      setDeletedDeck(null);
      refreshData();
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

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[calc(100vh-10rem)]">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Layers className="text-primary" /> Library
          </h1>
          <p className="text-gray-400 text-sm">Manage your flashcard collections</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <button 
             onClick={() => setIsImportOpen(true)}
             className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors"
           >
             <Upload size={16} /> Import
           </button>
           <button 
             onClick={() => { setEditingDeck(null); setIsFormOpen(true); }}
             className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-violet-600 text-white text-sm font-bold shadow-lg hover:shadow-purple-500/25 transition-all"
           >
             <Plus size={18} /> Create Deck
           </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
           <input 
             type="text" 
             placeholder="Search decks..." 
             className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
           />
         </div>
         {allTags.length > 0 && (
           <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
             <button 
               onClick={() => setSelectedTag('')}
               className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${!selectedTag ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
             >
               All
             </button>
             {allTags.map(tag => (
               <button 
                 key={tag}
                 onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                 className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${tag === selectedTag ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
               >
                 #{tag}
               </button>
             ))}
           </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
         {filteredDecks.length === 0 ? (
           <div className="col-span-full py-16 text-center text-gray-400 border border-dashed border-white/10 rounded-3xl bg-white/5 flex flex-col items-center justify-center">
             <p className="text-lg mb-6">No decks found.</p>
             <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsFormOpen(true)} 
                 className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-violet-600 text-white font-bold transition-all"
               >
                 <Plus size={18} /> Create Deck
               </button>
               <span className="text-sm text-gray-600">or</span>
               <Link 
                 to="/import" 
                 className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all"
               >
                 <Upload size={18} /> Import JSON
               </Link>
             </div>
           </div>
         ) : (
           filteredDecks.map(deck => {
             const deckCardCount = cards.filter(c => c.deckId === deck.id).length;
             const dueCount = cards.filter(c => c.deckId === deck.id && c.reviewMeta.nextReview <= new Date().toISOString()).length;
             
             return (
               <div key={deck.id} className="glass-panel group p-5 rounded-2xl flex flex-col h-full relative hover:border-purple-500/30 transition-colors">
                 <div className="flex justify-between items-start mb-3">
                    <h3 
                      className="font-bold text-lg md:text-xl text-white line-clamp-1 cursor-pointer hover:text-primary transition-colors" 
                      title={deck.name}
                      onClick={() => navigate(`/decks/${deck.id}`)}
                    >
                      {deck.name}
                    </h3>
                    <div className="relative group/menu">
                       <button className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><MoreVertical size={16} /></button>
                       <div className="absolute right-0 top-full mt-1 w-32 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 hidden group-hover/menu:block">
                          <button onClick={() => navigate(`/decks/${deck.id}`)} className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 flex items-center gap-2"><Eye size={12} /> View Cards</button>
                          <button onClick={() => { setEditingDeck(deck); setIsFormOpen(true); }} className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 flex items-center gap-2"><Edit2 size={12} /> Edit Info</button>
                          <button onClick={() => handleExport(deck.id)} className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 flex items-center gap-2"><Download size={12} /> Export</button>
                          <button onClick={() => handleDelete(deck.id)} className="w-full text-left px-4 py-2 text-xs hover:bg-red-500/20 text-red-400 flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                       </div>
                    </div>
                 </div>
                 
                 <p 
                   className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem] cursor-pointer"
                   onClick={() => navigate(`/decks/${deck.id}`)}
                 >
                   {deck.description || "No description"}
                 </p>
                 
                 {deck.tags && deck.tags.length > 0 && (
                   <div className="flex flex-wrap gap-1.5 mb-6">
                     {deck.tags.map(t => (
                       <span key={t} className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-gray-400 border border-white/5">#{t}</span>
                     ))}
                   </div>
                 )}

                 <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                    <button 
                      onClick={() => navigate(`/decks/${deck.id}`)}
                      className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <span className="font-bold text-white">{deckCardCount}</span> cards
                      {dueCount > 0 && <span className="text-primary ml-1">({dueCount} due)</span>}
                    </button>
                    
                    {deckCardCount > 0 ? (
                       <button 
                        onClick={() => navigate(`/study?deckId=${deck.id}`)}
                        className="flex items-center gap-2 bg-white/10 hover:bg-primary hover:text-white text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all"
                       >
                         <Play size={14} /> Study
                       </button>
                    ) : (
                       <button 
                        onClick={() => navigate(`/decks/${deck.id}`)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                       >
                         Add Cards
                       </button>
                    )}
                 </div>
               </div>
             );
           })
         )}
      </div>

      {showUndo && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
          <div className="bg-[#1a1a24] border border-white/20 shadow-2xl p-4 rounded-xl flex items-center gap-4">
            <div className="text-sm">Deck deleted.</div>
            <button 
              onClick={handleUndo}
              className="flex items-center gap-1 text-primary font-bold text-sm hover:underline"
            >
              <RotateCcw size={14} /> Undo
            </button>
            <button onClick={() => setShowUndo(false)} className="text-gray-500 hover:text-white ml-2">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {isFormOpen && (
        <DeckFormModal 
          initialData={editingDeck} 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleSaveDeck} 
        />
      )}

      {isImportOpen && (
        <ImportModal onClose={() => setIsImportOpen(false)} onImportSuccess={refreshData} />
      )}

    </div>
  );
};

const DeckFormModal: React.FC<{ 
  initialData: Deck | null, 
  onClose: () => void, 
  onSave: (name: string, desc: string, tags: string[]) => void 
}> = ({ initialData, onClose, onSave }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [desc, setDesc] = useState(initialData?.description || '');
  const [tagsStr, setTagsStr] = useState(initialData?.tags?.join(', ') || '');

  // Lock scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    onSave(name, desc, tags);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
       <div className="bg-[#1a1a24] border border-white/10 w-full max-w-md rounded-2xl p-4 md:p-6 shadow-2xl animate-fade-in mx-2 md:mx-4 ring-1 ring-white/10">
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg md:text-xl font-bold text-white">{initialData ? 'Edit Deck' : 'Create New Deck'}</h2>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X className="text-gray-400 hover:text-white" size={20} /></button>
         </div>
         <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase font-bold mb-1.5">Deck Title</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none placeholder-gray-600" placeholder="e.g. JLPT N5 Verbs" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase font-bold mb-1.5">Description</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none h-20 md:h-24 resize-none placeholder-gray-600" placeholder="What is this deck about?" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase font-bold mb-1.5">Tags (comma separated)</label>
              <input type="text" value={tagsStr} onChange={e => setTagsStr(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none placeholder-gray-600" placeholder="verb, n5, hard" />
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-white/5">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-white/5 text-gray-300 text-xs md:text-sm font-medium">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary hover:bg-violet-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-purple-500/20">Save Deck</button>
            </div>
         </form>
       </div>
    </div>
  );
};

const ImportModal: React.FC<{ onClose: () => void, onImportSuccess: () => void }> = ({ onClose, onImportSuccess }) => {
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{title: string, count: number} | null>(null);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleValidate = () => {
    try {
      const data = JSON.parse(json);
      if (!data.title || !Array.isArray(data.cards)) throw new Error("Missing title or cards array.");
      setPreview({ title: data.title, count: data.cards.length });
      setError(null);
    } catch (e: any) {
      setError("Invalid JSON: " + e.message);
      setPreview(null);
    }
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(json);
      const newDeck = createDeck(data.title, data.description || '', data.tags || []);
      
      const newCards = data.cards.map((c: any) => ({
        ...c,
        deckId: newDeck.id,
        // Auto generate ID if missing in import
        id: c.id || `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        reviewMeta: c.reviewMeta || { ef: 2.5, interval: 0, repetitions: 0, nextReview: new Date().toISOString() },
        tags: c.tags || [],
        createdAt: new Date().toISOString()
      }));
      
      addCards(newCards);
      onImportSuccess();
      onClose();
    } catch (e) {
      setError("Import failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
       <div className="bg-[#1a1a24] border border-white/10 w-full max-w-2xl rounded-2xl p-4 md:p-6 shadow-2xl animate-fade-in flex flex-col max-h-[90vh] ring-1 ring-white/10">
         <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg md:text-xl font-bold text-white">Import Deck (JSON)</h2>
           <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X className="text-gray-400 hover:text-white" size={20} /></button>
         </div>
         
         <div className="flex-1 overflow-hidden flex flex-col">
            <textarea 
              value={json} 
              onChange={e => setJson(e.target.value)} 
              onBlur={handleValidate}
              className="flex-1 bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300 resize-none focus:border-primary outline-none mb-4" 
              placeholder='Paste JSON here: { "title": "...", "cards": [...] }'
            />
            
            {error && <div className="text-red-400 text-sm mb-4 px-2"><span className="font-bold">Error:</span> {error}</div>}
            
            {preview && (
               <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg mb-4 flex items-center justify-between">
                 <div>
                   <div className="text-green-400 font-bold">Valid Deck Found</div>
                   <div className="text-xs text-gray-400">Title: {preview.title} • Cards: {preview.count}</div>
                 </div>
                 <button onClick={handleImport} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-sm">
                   Confirm Import
                 </button>
               </div>
            )}
         </div>
         
         {!preview && (
           <div className="flex justify-end">
             <button onClick={handleValidate} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm">Validate JSON</button>
           </div>
         )}
       </div>
    </div>
  );
};