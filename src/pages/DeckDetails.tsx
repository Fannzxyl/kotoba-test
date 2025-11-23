import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { getDecks, getCards, deleteCard, addCards } from '../modules/decks/api';
import { getInitialReviewMeta } from '../services/sm2';
import { Deck, Card } from '../modules/decks/model';
import { ArrowLeft, Search, Trash2, Plus, BookOpen, Sparkles, X, Loader2, AlertCircle, Gamepad2 } from 'lucide-react';

export const DeckDetails: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic || !deckId) return;

    setIsGenerating(true);
    setAiError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not set. Please configure it in your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Generate ${aiCount} Japanese vocabulary flashcards about "${aiTopic}".
      Target level: Beginner to Intermediate.
      Include: 
      - Japanese (Kanji/Kana)
      - Romaji
      - Meaning (Indonesian)
      - Example sentence (Japanese only)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                japanese: { type: Type.STRING, description: "Word in Japanese (Kanji/Kana)" },
                romaji: { type: Type.STRING, description: "Reading in Romaji" },
                indonesia: { type: Type.STRING, description: "Meaning in Indonesian" },
                example: { type: Type.STRING, description: "Short example sentence in Japanese" },
              },
              required: ["japanese", "romaji", "indonesia", "example"],
            },
          },
        },
      });

      const generatedData = JSON.parse(response.text || "[]");

      if (!Array.isArray(generatedData) || generatedData.length === 0) {
        throw new Error("AI returned empty or invalid data.");
      }

      const newCards: Card[] = generatedData.map((item: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        deckId: deckId,
        japanese: item.japanese,
        romaji: item.romaji,
        indonesia: item.indonesia,
        example: item.example || "",
        tags: ["ai-generated", aiTopic.split(" ")[0].toLowerCase()],
        createdAt: new Date().toISOString(),
        reviewMeta: getInitialReviewMeta(),
      }));

      addCards(newCards);
      loadData();
      setIsAiModalOpen(false);
      setAiTopic('');
    } catch (err: any) {
      console.error("AI Gen Error:", err);
      setAiError(err.message || "Failed to generate cards. Please try again.");
    } finally {
      setIsGenerating(false);
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
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-violet-600 text-white font-bold transition-all shadow-lg"
           >
             <BookOpen size={18} /> Study Deck
           </Link>
           <Link 
             to={`/arcade?deckId=${deck.id}`}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold transition-all"
           >
             <Gamepad2 size={18} /> Play Arcade
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
         <div className="flex gap-2">
            <button 
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-300 border border-pink-500/30 px-4 py-2.5 rounded-lg transition-all font-semibold flex-1 sm:flex-none"
            >
              <Sparkles size={16} /> AI Generate
            </button>
            <Link to="/import" className="flex items-center justify-center gap-2 text-sm text-primary hover:text-violet-300 font-semibold px-4 py-2.5 rounded-lg hover:bg-white/5 border border-white/5 sm:border-transparent flex-1 sm:flex-none">
              <Plus size={16} /> Add Manual
            </Link>
         </div>
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
                 ? "This deck is empty. Import cards manually or use AI Generation!" 
                 : "No cards match your search criteria."}
             </p>
             {cards.length === 0 && (
                <button 
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Sparkles size={18} /> Try AI Generator
                </button>
             )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="p-2 md:p-4 font-medium">Japanese</th>
                  <th className="p-2 md:p-4 font-medium">Romaji</th>
                  <th className="p-2 md:p-4 font-medium">Meaning</th>
                  <th className="p-2 md:p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-2 md:p-4">
                      <div className="font-jp text-base md:text-lg font-bold text-white">{card.japanese}</div>
                      {card.example && <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px] md:max-w-[200px]">{card.example}</div>}
                    </td>
                    <td className="p-2 md:p-4 text-violet-200 font-medium text-sm md:text-base">{card.romaji}</td>
                    <td className="p-2 md:p-4 text-gray-300 text-sm md:text-base">{card.indonesia}</td>
                    <td className="p-2 md:p-4 text-right">
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

      {/* AI Generation Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508] md:bg-black/90 md:backdrop-blur-sm p-4 transition-all">
          <div className="bg-[#1a1a24] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in mx-2 ring-1 ring-white/10 relative overflow-hidden">
            
            {/* Decorative AI blob */}
            <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-primary rounded-full blur-[60px] opacity-20 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-pink-400" size={20} /> AI Magic Generator
              </h2>
              <button onClick={() => !isGenerating && setIsAiModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="text-gray-400 hover:text-white" size={20} />
              </button>
            </div>

            <form onSubmit={handleAiGenerate} className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-1.5">Topic / Theme</label>
                <input 
                  autoFocus
                  required 
                  type="text" 
                  value={aiTopic} 
                  onChange={e => setAiTopic(e.target.value)} 
                  disabled={isGenerating}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none placeholder-gray-600 transition-all" 
                  placeholder="e.g. Kitchen Utensils, JLPT N4 Adjectives" 
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-1.5">Number of Cards: {aiCount}</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={aiCount} 
                  onChange={e => setAiCount(Number(e.target.value))} 
                  disabled={isGenerating}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

              {aiError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-300 text-sm">
                  <AlertCircle size={16} />
                  {aiError}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isGenerating || !aiTopic}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                  isGenerating 
                    ? 'bg-gray-700 cursor-wait opacity-70' 
                    : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 hover:scale-[1.02] shadow-pink-500/20'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Generate Cards
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};