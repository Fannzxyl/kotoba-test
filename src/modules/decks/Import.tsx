import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addCards,
  getDecks,
  exportAllDataToJSON,
  importAllDataFromJSON
} from './api';
import { getInitialReviewMeta } from '../../services/sm2';
import { Card, Deck } from './model';
import {
  FileJson,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Download,
  Upload,
  Database,
  RefreshCw,
  ScanText,
  Camera,
  ArrowDown
} from 'lucide-react';
import { recognizeText } from '../../services/ocr';

export const Import: React.FC = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);

  // State Import JSON
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State Backup/Restore
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State OCR
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);

  useEffect(() => {
    const d = getDecks();
    setDecks(d);
    if (d.length > 0) setSelectedDeckId(d[0].id);
  }, []);

  // --- HANDLER: FULL BACKUP & RESTORE ---

  const handleDownloadBackup = () => {
    const json = exportAllDataToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katasensei-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTriggerRestore = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("PERINGATAN: Restore akan MENGHAPUS semua data saat ini dan menggantinya dengan data backup. Lanjutkan?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importAllDataFromJSON(content);

      if (ok) {
        alert("Backup berhasil di-restore! Halaman akan dimuat ulang.");
        window.location.reload();
      } else {
        setRestoreError("Format file backup tidak valid atau rusak.");
      }
    };
    reader.onerror = () => setRestoreError("Gagal membaca file.");
    reader.readAsText(file);
    e.target.value = '';
  };

  // --- HANDLER: OCR ---
  const handleOcrImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setOcrResult('');
      setOcrProgress(0);
    }
  };

  const handleStartOcr = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setOcrProgress(0);

    try {
      const result = await recognizeText(selectedImage, (p) => setOcrProgress(p));
      setOcrResult(result.text);
    } catch (err) {
      alert("OCR Failed: " + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- PARSING LOGIC ---
  const parseOcrLine = (line: string) => {
    // Basic cleanup
    const cleanLine = line.trim();
    if (!cleanLine) return null;

    // Tokenize by whitespace
    const tokens = cleanLine.split(/\s+/);

    // 1. Skip leading "index/garbage" tokens
    // Patterns: Digits, "1.", "10)", "1o&", single alphanumeric chars that look like list bullets
    let startIndex = 0;
    const isGarbage = (t: string) => {
      // Matches pure numbers/symbols or numbers followed by garbage (e.g. "1o&")
      if (/^[\d\W]+$/.test(t)) return true;
      if (/^\d+[a-zA-Z&]*$/.test(t)) return true;
      return false;
    };

    while (startIndex < tokens.length && isGarbage(tokens[startIndex])) {
      startIndex++;
    }

    const meaningfulTokens = tokens.slice(startIndex);
    if (meaningfulTokens.length === 0) return null;

    // 2. Identify Japanese Part
    let jpTokens: string[] = [];
    let currentIdx = 0;

    // Helper to check for Japanese script (Kanji, Kana, punctuation)
    // Extended range for common JK symbols
    const hasJapaneseChar = (t: string) => /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/.test(t);

    if (hasJapaneseChar(meaningfulTokens[0])) {
      // Start consuming tokens as long as they contain Japanese
      while (currentIdx < meaningfulTokens.length && hasJapaneseChar(meaningfulTokens[currentIdx])) {
        jpTokens.push(meaningfulTokens[currentIdx]);
        currentIdx++;
      }
    } else {
      // Fallback: If valid token exists but NO japanese char, assume first token is the "Japanese" (Romaji substitute)
      jpTokens.push(meaningfulTokens[0]);
      currentIdx++;
    }

    const japanese = jpTokens.join("");

    // 3. Identify Romaji
    // The next token is likely Romaji if it exists
    let romaji = "";
    if (currentIdx < meaningfulTokens.length) {
      romaji = meaningfulTokens[currentIdx];
      currentIdx++;
    }

    // 4. Identify Indonesian/Definition
    // The rest is the definition.
    const indonesia = meaningfulTokens.slice(currentIdx).join(" ");

    return { japanese, romaji, indonesia };
  };

  const handleCopyToJSON = () => {
    if (!ocrResult) return;

    const lines = ocrResult.split('\n');
    const template = [];

    for (const line of lines) {
      const parsed = parseOcrLine(line);
      if (parsed) {
        template.push({
          japanese: parsed.japanese,
          furigana: "",
          romaji: parsed.romaji,
          indonesia: parsed.indonesia,
          example: ""
        });
      }
    }

    setJsonInput(JSON.stringify(template, null, 2));
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // --- HANDLER: IMPORT CARDS ---

  const handleImportCards = () => {
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

      const validCards: Card[] = parsed.map((item: any, index: number) => {
        if ((!item.japanese && !item.indonesia)) {
          throw new Error(`Item at index ${index} must have at least 'japanese' or 'indonesia' field.`);
        }

        return {
          id: item.id ? String(item.id) : `imported-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          deckId: selectedDeckId,
          romaji: String(item.romaji || ''),
          japanese: String(item.japanese || '?'),
          indonesia: String(item.indonesia || '?'),
          example: String(item.example || ''),
          furigana: String(item.furigana || item.reading || ''),
          tags: Array.isArray(item.tags) ? item.tags : [],
          createdAt: new Date().toISOString(),
          reviewMeta: getInitialReviewMeta()
        };
      });

      addCards(validCards);
      setSuccess(`Successfully imported ${validCards.length} cards!`);
      setJsonInput('');

      setTimeout(() => navigate(`/decks/${selectedDeckId}`), 1500);

    } catch (err: any) {
      setError(err.message || "Invalid JSON format");
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-10 px-4">

      <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 mt-4">
        <Database className="text-primary w-6 h-6 md:w-8 md:h-8" />
        Data Management
      </h1>

      {/* SECTION 1: FULL BACKUP & RESTORE */}
      <div className="glass-panel p-5 md:p-8 rounded-2xl md:rounded-3xl mb-6 border border-purple-500/20">
        <h2 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2 text-white">
          <RefreshCw size={20} className="text-purple-400" />
          Full Backup & Restore
        </h2>

        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          Simpan seluruh database ke file JSON, atau restore dari backup.
          <br />
          <span className="text-red-400 font-medium text-xs md:text-sm block mt-1">
            Warning: Restore akan menimpa seluruh data yang ada.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownloadBackup}
            className="flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 border border-purple-500/50 text-purple-300 font-semibold py-3 px-6 rounded-xl transition-all w-full sm:w-auto active:scale-95"
          >
            <Download size={18} />
            Download Backup
          </button>

          <button
            onClick={handleTriggerRestore}
            className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-300 font-semibold py-3 px-6 rounded-xl transition-all w-full sm:w-auto active:scale-95"
          >
            <Upload size={18} />
            Restore from File
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>

        {restoreError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{restoreError}</span>
          </div>
        )}
      </div>

      {/* SECTION 2: SMART IMPORT (OCR) */}
      <div className="glass-panel p-5 md:p-8 rounded-2xl md:rounded-3xl mb-6 border border-cyan-500/20">
        <h2 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2 text-white">
          <ScanText size={20} className="text-cyan-400" />
          Smart Import (OCR)
        </h2>

        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          Scan japanese text from images or screenshots.
          <br />
          <span className="text-cyan-400 font-medium text-xs md:text-sm block mt-1">
            Powered by Tesseract.js (Offline)
          </span>
        </p>

        <div className="flex flex-col gap-4">
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => document.getElementById('ocr-upload')?.click()}>
            {selectedImage ? (
              <img src={selectedImage} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <Camera size={32} />
                <span className="text-sm">Click to upload or take photo</span>
              </>
            )}
            <input
              id="ocr-upload"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleOcrImageChange}
              className="hidden"
            />
          </div>

          {ocrProgress > 0 && ocrProgress < 100 && (
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
              <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
            </div>
          )}

          {ocrResult && (
            <div className="bg-black/30 rounded-xl border border-white/10 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Detected Text</span>
                <button onClick={handleCopyToJSON} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  <ArrowDown size={14} /> Use in JSON
                </button>
              </div>
              <p className="text-white text-sm whitespace-pre-wrap font-jp">{ocrResult}</p>
            </div>
          )}

          <button
            onClick={handleStartOcr}
            disabled={!selectedImage || isProcessing}
            className="w-full flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
          >
            {isProcessing ? 'Scanning...' : 'Scan Image'}
          </button>
        </div>
      </div>

      {/* SECTION 3: IMPORT CARDS */}
      <div className="glass-panel p-5 md:p-8 rounded-2xl md:rounded-3xl">
        <h2 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2 text-white">
          <FileJson size={20} className="text-green-400" />
          Import Vocabulary (JSON)
        </h2>

        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm text-gray-400">Target Deck:</label>
          <div className="relative w-full">
            <select
              value={selectedDeckId}
              onChange={e => setSelectedDeckId(e.target.value)}
              className="w-full appearance-none bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm"
            >
              {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>

        {/* 🔥 UPDATED EXAMPLE JSON TEMPLATE 🔥 */}
        <div className="bg-black/30 rounded-xl border border-white/10 p-4 mb-4 font-mono text-[10px] md:text-xs text-gray-400 overflow-x-auto">
          <p className="mb-2 text-gray-500 italic">// Copy format ini untuk prompt ke AI lain:</p>
          <pre>{`[
  {
    "japanese": "食べる",
    "furigana": "たべる",
    "romaji": "taberu",
    "indonesia": "Makan",
    "example": "毎日パンを食べます"
  },
  {
    "japanese": "猫",
    "furigana": "ねこ",
    "romaji": "neko",
    "indonesia": "Kucing",
    "example": "猫が好きです"
  }
]`}</pre>
        </div>

        <textarea
          className="w-full h-32 md:h-48 bg-black/20 border border-white/10 rounded-xl p-3 text-white font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none placeholder-gray-600"
          placeholder="Paste JSON array here..."
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm animate-bounce-short">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-sm animate-fade-in">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleImportCards}
            disabled={!jsonInput}
            className="w-full md:w-auto float-right bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-8 rounded-full hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            Import JSON
          </button>
        </div>
      </div>
    </div>
  );
};