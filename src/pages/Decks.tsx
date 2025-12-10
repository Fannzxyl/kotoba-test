import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDecks, useCards } from '../modules/decks/hooks';
import { exportDeckToJSON } from '../modules/decks/api';
import { Deck, Card } from '../modules/decks/model';
import {
  Search, Plus, MoreVertical, Play, Edit2, Trash2, Download,
  RotateCcw, X, Layers, Zap, Gamepad2, Clock, BookOpen, Tag, Filter, Check
} from 'lucide-react';

export const Decks: React.FC = () => {
  const navigate = useNavigate();
  const { decks, createDeck, updateDeck, deleteDeck, restoreDeck } = useDecks();
  const { cards, refreshCards } = useCards();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCustomStudyOpen, setIsCustomStudyOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deletedDeck, setDeletedDeck] = useState<{ deck: Deck, cards: Card[] } | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  // --- LOGIC SWIPE / DRAG (Bottom Sheet) ---
  const [sheetY, setSheetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    if (isFormOpen) setSheetY(0);
  }, [isFormOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // Logika: 
    // Diff > 0 = Tarik ke bawah (Closing)
    // Diff < 0 = Tarik ke atas (Resistance / Rubber band effect)

    if (diff > 0) {
      setSheetY(diff);
    } else {
      // Efek karet kalau ditarik ke atas (biar berasa mentok)
      setSheetY(diff * 0.2);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Jika ditarik ke bawah lebih dari 100px -> Tutup
    if (sheetY > 100) {
      setIsFormOpen(false);
    }
    // Reset posisi
    setSheetY(0);
  };

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

  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFormOpen]);

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
    <>
      <div className="animate-fade-in max-w-6xl mx-auto pb-24 px-4 md:px-0 relative min-h-screen">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 pt-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
              Your Decks
            </h1>
            <p className="text-gray-400 text-sm md:text-base">Manage and organize your learning collections</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsCustomStudyOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#1a1a24] hover:bg-[#252532] border border-white/10 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 whitespace-nowrap"
            >
              <Filter size={20} /> Custom Study
            </button>
            <button
              onClick={() => { setEditingDeck(null); setIsFormOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-violet-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus size={20} /> Create Deck
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative w-full md:w-72 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search decks..."
              className="w-full bg-[#151520] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTag('')}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-xs md:text-sm font-medium border ${!selectedTag ? 'bg-white text-black border-white' : 'bg-[#151520] border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-xs md:text-sm font-medium border ${selectedTag === tag ? 'bg-primary/20 border-primary text-primary' : 'bg-[#151520] border-white/10 text-gray-400 hover:text-white hover:border-white/30'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {filteredDecks.map(deck => {
            const cardCount = getCardCount(deck.id);
            const dueCount = getDueCount(deck.id);
            return (
              <div key={deck.id} className="group relative bg-[#151520] border border-white/5 hover:border-primary/30 rounded-2xl p-5 transition-all hover:shadow-xl hover:shadow-purple-900/10 flex flex-col h-full animate-fade-in-up">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {deck.tags?.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/5">#{t}</span>
                    ))}
                  </div>
                  <div className="dropdown dropdown-end relative">
                    <button className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                    <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-36 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden ring-1 ring-black/50">
                      <button onClick={() => { setEditingDeck(deck); setIsFormOpen(true); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 text-gray-300 flex items-center gap-2"><Edit2 size={14} /> Edit</button>
                      <button onClick={() => handleExport(deck.id)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 text-gray-300 flex items-center gap-2"><Download size={14} /> Export</button>
                      <div className="h-px bg-white/5 my-1"></div>
                      <button onClick={() => handleDelete(deck.id)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-400 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>
                </div>
                <div className="mb-6 flex-1 cursor-pointer" onClick={() => navigate(`/decks/${deck.id}`)}>
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{deck.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed h-10">{deck.description || "No description provided."}</p>
                </div>
                <div className="flex items-center gap-4 mb-5 text-xs font-medium text-gray-400 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-1.5"><BookOpen size={14} className="text-blue-400" /><span>{cardCount} Cards</span></div>
                  <div className="flex items-center gap-1.5"><Clock size={14} className={dueCount > 0 ? "text-pink-400" : "text-green-400"} /><span className={dueCount > 0 ? "text-pink-100" : ""}>{dueCount} Due</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/study?deckId=${deck.id}`)} className="flex-1 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"><Play size={16} fill="currentColor" /> Study</button>
                  <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                    <button onClick={() => navigate(`/test?deckId=${deck.id}`)} className="p-2 text-gray-400 hover:text-yellow-300 hover:bg-white/10 rounded-lg transition-colors" title="Quiz Mode"><Zap size={18} /></button>
                    <button onClick={() => navigate(`/arcade?deckId=${deck.id}`)} className="p-2 text-gray-400 hover:text-cyan-300 hover:bg-white/10 rounded-lg transition-colors" title="Arcade Game"><Gamepad2 size={18} /></button>
                    <button onClick={() => navigate(`/decks/${deck.id}`)} className="p-2 text-gray-400 hover:text-emerald-300 hover:bg-white/10 rounded-lg transition-colors" title="View Cards"><Layers size={18} /></button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Placeholder New Deck */}
          <button
            onClick={() => { setEditingDeck(null); setIsFormOpen(true); }}
            className="rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center p-5 min-h-[200px] md:min-h-[280px] group transition-all animate-fade-in-up"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
              <Plus size={32} className="text-gray-500 group-hover:text-primary transition-colors" />
            </div>
            <span className="font-bold text-gray-400 group-hover:text-white">Create New Deck</span>
          </button>
        </div>

        {/* Undo Toast */}
        {showUndo && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a24] border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-slide-up">
            <span className="text-sm text-white">Deck deleted</span>
            <button onClick={handleUndo} className="flex items-center gap-1 text-primary hover:text-violet-300 font-bold text-sm"><RotateCcw size={14} /> Undo</button>
          </div>
        )}
      </div>

      {/* 🔥 FIX: BOTTOM SHEET (DRAGGABLE) 🔥 */}
      {
        isFormOpen && (
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center">

            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsFormOpen(false)}
            />

            {/* Modal Panel */}
            <div
              className="relative w-full max-w-md bg-[#1a1a24] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] transition-transform duration-200 ease-out"
              style={{
                transform: `translateY(${Math.max(0, sheetY)}px)`,
                marginBottom: '80px'
              }}
            >
              {/* DRAG HANDLE */}
              <div
                className="w-full flex items-center justify-center py-3 cursor-grab active:cursor-grabbing sm:hidden bg-[#1a1a24] z-20 absolute top-0 left-0 right-0 rounded-t-3xl"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
              >
                <div className={`w-10 h-1 bg-white/25 rounded-full transition-all ${isDragging ? 'w-14 bg-white/40' : ''}`} />
              </div>

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-3 pt-10 sm:pt-3 border-b border-white/5 bg-[#1a1a24]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {editingDeck ? <Edit2 size={20} className="text-primary" /> : <Plus size={20} className="text-primary" />}
                  {editingDeck ? 'Edit Deck' : 'New Deck'}
                </h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Content Scrollable */}
              <div className="p-4 md:p-6 overflow-y-auto flex-1 overscroll-contain">
                <DeckForm
                  initialData={editingDeck || undefined}
                  onSubmit={handleSaveDeck}
                  onCancel={() => setIsFormOpen(false)}
                />
              </div>
            </div>
          </div>
        )
      }

      {/* Custom Study Modal */}
      {
        isCustomStudyOpen && (
          <CustomStudyModal
            decks={decks}
            allTags={allTags}
            onClose={() => setIsCustomStudyOpen(false)}
          />
        )
      }
    </>
  );
};

// Form Component
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
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-5 flex-1">
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold mb-1.5 ml-1 block">Deck Name</label>
          <input
            required
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-gray-600 text-base"
            placeholder="e.g. JLPT N5 Vocabulary"
            autoFocus={window.innerWidth > 768}
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold mb-1.5 ml-1 block">Description</label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none h-24 resize-none transition-all placeholder-gray-600 text-base"
            placeholder="What is this deck about?"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase font-bold mb-1.5 ml-1 flex items-center gap-1">
            <Tag size={12} /> Tags <span className="text-gray-600 font-normal normal-case">(comma separated)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-gray-600 text-base"
            placeholder="e.g. vocab, n5, verbs"
          />
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="flex gap-3 mt-8 pt-4 pb-2 bg-[#1a1a24] sticky bottom-0 z-20 border-t border-white/5">
        <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-xl font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-colors bg-white/5">Cancel</button>
        <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold bg-primary hover:bg-violet-600 text-white transition-all shadow-lg shadow-primary/20">Save Deck</button>
      </div>
    </form>
  );
};

// Custom Study Modal Component
const CustomStudyModal: React.FC<{
  decks: Deck[];
  allTags: string[];
  onClose: () => void;
}> = ({ decks, allTags, onClose }) => {
  const navigate = useNavigate();
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedDecks, setSelectedDecks] = useState<Set<string>>(new Set());

  // Filter decks based on selected tag
  const availableDecks = useMemo(() => {
    if (!selectedTag) return [];
    return decks.filter(d => d.tags?.includes(selectedTag));
  }, [decks, selectedTag]);

  // Handle deck selection toggle
  const toggleDeck = (id: string) => {
    const next = new Set(selectedDecks);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDecks(next);
  };

  // Select/Deselect All
  const toggleAll = () => {
    if (selectedDecks.size === availableDecks.length) {
      setSelectedDecks(new Set());
    } else {
      setSelectedDecks(new Set(availableDecks.map(d => d.id)));
    }
  };

  const handleStart = () => {
    if (selectedDecks.size === 0) return;
    const ids = Array.from(selectedDecks).join(',');
    navigate(`/study?deckIds=${ids}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#1a1a24] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#1a1a24]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Filter size={20} className="text-primary" /> Custom Study Session
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Sidebar: Tag Selection (Responsive: Horizontal scroll on mobile, Vertical on desktop) */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 bg-[#151520] flex flex-col max-h-[160px] md:max-h-none shrink-0">
            <div className="p-3 md:p-4 border-b border-white/5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Tag</h3>
            </div>
            <div className="flex-1 overflow-x-auto md:overflow-y-auto p-2 flex md:block gap-2 space-y-0 md:space-y-1 scrollbar-hide">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => { setSelectedTag(tag); setSelectedDecks(new Set()); }}
                  className={`flex-shrink-0 w-auto md:w-full text-left px-4 py-2 md:py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${selectedTag === tag
                    ? 'bg-primary/20 text-primary border border-primary/20'
                    : 'bg-white/5 md:bg-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  #{tag}
                </button>
              ))}
              {allTags.length === 0 && (
                <div className="text-center p-4 text-gray-500 text-sm w-full">No tags found.</div>
              )}
            </div>
          </div>

          {/* Main Area: Deck Selection */}
          <div className="flex-1 flex flex-col bg-[#1a1a24] min-h-0">
            {selectedTag ? (
              <>
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Decks in <span className="text-primary">#{selectedTag}</span></h3>
                  <button
                    onClick={toggleAll}
                    className="text-xs font-bold text-primary hover:text-white transition-colors"
                  >
                    {selectedDecks.size === availableDecks.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {availableDecks.map(deck => (
                    <div
                      key={deck.id}
                      onClick={() => toggleDeck(deck.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${selectedDecks.has(deck.id)
                        ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                        : 'bg-[#151520] border-white/5 hover:border-white/20'
                        }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedDecks.has(deck.id) ? 'bg-primary border-primary' : 'border-gray-600 bg-transparent'
                        }`}>
                        {selectedDecks.has(deck.id) && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold truncate ${selectedDecks.has(deck.id) ? 'text-white' : 'text-gray-400'}`}>{deck.name}</h4>
                        <p className="text-xs text-gray-500 truncate">{deck.description || 'No description'}</p>
                      </div>
                    </div>
                  ))}
                  {availableDecks.length === 0 && (
                    <div className="text-center text-gray-500 py-10">No decks found with this tag.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500">
                <Tag size={48} className="mb-4 opacity-20" />
                <p>Select a tag from the sidebar to view decks.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#1a1a24] flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            disabled={selectedDecks.size === 0}
            onClick={handleStart}
            className="px-8 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            Start Custom Session ({selectedDecks.size})
          </button>
        </div>
      </div>
    </div>
  );
};