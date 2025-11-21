
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCards, getDecks, createDeck } from '../utils/storage';
import { getInitialReviewMeta } from '../utils/sm2';
import { ImportData, Card, Deck } from '../types';
import { FileJson, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

export const Import: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const d = getDecks();
    setDecks(d);
    if (d.length > 0) setSelectedDeckId(d[0].id);
  }, []);

  const handleImport = () => {
    setError(null);
    setSuccess(null);

    if (!selectedDeckId) {
      setError("Please select a deck.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      
      if (!Array.isArray(parsed)) {
        throw new Error("Root element must be an array");
      }

      // Basic validation and transformation
      const validCards: Card[] = parsed.map((item: any, index) => {
        if (!item.id || !item.japanese || !item.indonesia) {
           throw new Error(`Item at index ${index} missing required fields (id, japanese, indonesia)`);
        }

        return {
          id: String(item.id),
          deckId: selectedDeckId,
          romaji: String(item.romaji || ''),
          japanese: String(item.japanese),
          indonesia: String(item.indonesia),
          example: String(item.example || ''),
          tags: Array.isArray(item.tags) ? item.tags : [],
          createdAt: new Date().toISOString(),
          reviewMeta: getInitialReviewMeta()
        };
      });

      addCards(validCards);
      setSuccess(`Successfully imported ${validCards.length} cards!`);
      setJsonInput('');
      
      // Redirect after short delay
      setTimeout(() => navigate('/decks'), 1500);

    } catch (err: any) {
      setError(err.message || "Invalid JSON format");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <FileJson className="text-primary" />
        Import Vocabulary
      </h1>

      <div className="glass-panel p-8 rounded-3xl">
        
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
           <label className="text-sm text-gray-400 whitespace-nowrap">Target Deck:</label>
           <div className="relative flex-1">
             <select 
                value={selectedDeckId} 
                onChange={e => setSelectedDeckId(e.target.value)}
                className="w-full appearance-none bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500"
             >
               {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
             </select>
             <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
           </div>
        </div>

        <p className="mb-4 text-gray-400">Paste your JSON array below to add new cards to your deck. IDs must be unique.</p>
        
        <div className="bg-black/30 rounded-xl border border-white/10 p-4 mb-6 font-mono text-xs text-gray-500 overflow-x-auto">
          <pre>{`[
  {
    "id": "unique_id_1",
    "romaji": "ohayou",
    "japanese": "おはよう",
    "indonesia": "Selamat pagi",
    "example": "おはようございます",
    "tags": ["greeting"]
  }
]`}</pre>
        </div>

        <textarea
          className="w-full h-64 bg-black/20 border border-white/10 rounded-xl p-4 text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
          placeholder="Paste JSON here..."
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 animate-bounce-short">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 animate-fade-in">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleImport}
            disabled={!jsonInput}
            className="bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-8 rounded-full hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import JSON
          </button>
        </div>
      </div>
    </div>
  );
};
