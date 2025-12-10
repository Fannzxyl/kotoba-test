import React, { useState } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useStudySettings } from '../context/StudyContext';
import { Palette, BookOpen, Info, Github, Heart, Zap, Layers } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';

export const Settings: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const { showFurigana, setShowFurigana, reverseCards, setReverseCards } = useStudySettings();

    // Demo state for BottomSheet
    const [isDemoSheetOpen, setIsDemoSheetOpen] = useState(false);
    const [currentSnap, setCurrentSnap] = useState(0);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-violet-200">Customize your experience</p>
            </header>

            {/* Theme Section */}
            <section className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-6 text-violet-300 font-semibold uppercase tracking-wider text-xs">
                    <Palette size={18} /> Theme
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {THEMES.map((tItem) => (
                        <button
                            key={tItem.id}
                            onClick={() => setTheme(tItem.id)}
                            className={`
                group relative p-3 rounded-xl border transition-all overflow-hidden text-left
                ${theme === tItem.id
                                    ? 'border-white/40 bg-white/10 shadow-lg'
                                    : 'border-transparent hover:bg-white/5'}
              `}
                        >
                            <div
                                className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30"
                                style={{ background: `linear-gradient(135deg, ${tItem.primary}, ${tItem.secondary})` }}
                            />
                            <div className="relative z-10 flex flex-col gap-2">
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tItem.primary }} />
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tItem.secondary }} />
                                </div>
                                <span className={`text-sm font-medium ${theme === tItem.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                    {tItem.name}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Study Preferences */}
            <section className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 text-violet-300 font-semibold uppercase tracking-wider text-xs">
                    <BookOpen size={18} /> Study Preferences
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setShowFurigana(!showFurigana)}>
                        <div className="flex flex-col">
                            <span className="text-white font-medium">Show Furigana</span>
                            <span className="text-xs text-gray-400">Show reading aids above Kanji</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${showFurigana ? 'bg-primary' : 'bg-white/20'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${showFurigana ? 'left-7' : 'left-1'}`}></div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setReverseCards(!reverseCards)}>
                        <div className="flex flex-col">
                            <span className="text-white font-medium">Reverse Cards</span>
                            <span className="text-xs text-gray-400">Show meaning first, reveal Japanese</span>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${reverseCards ? 'bg-primary' : 'bg-white/20'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${reverseCards ? 'left-7' : 'left-1'}`}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo: Bottom Sheet Component */}
            <section className="glass-panel p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-6 text-violet-300 font-semibold uppercase tracking-wider text-xs">
                    <Layers size={18} /> Demo: Bottom Sheet
                </div>
                <p className="text-gray-400 text-sm mb-4">
                    Coba komponen BottomSheet baru dengan gesture drag dan snap points.
                </p>
                <button
                    onClick={() => setIsDemoSheetOpen(true)}
                    className="w-full py-3 px-6 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-xl text-white font-medium transition-all"
                >
                    Buka Bottom Sheet Demo
                </button>
                {currentSnap >= 0 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Last snap point: {currentSnap === 0 ? '50%' : '90%'}
                    </p>
                )}
            </section>

            {/* About & Credits */}
            <section className="glass-panel p-6 rounded-3xl mb-20 md:mb-0">
                <div className="flex items-center gap-3 mb-6 text-violet-300 font-semibold uppercase tracking-wider text-xs">
                    <Info size={18} /> About
                </div>

                <div className="space-y-4">
                    {/* App Info */}
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                            <Zap size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">KataSensei</h3>
                            <p className="text-gray-400 text-sm">Version 1.0.0</p>
                        </div>
                    </div>

                    {/* GitHub Link */}
                    <a
                        href="https://github.com/Fannzxyl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Github size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                            <div>
                                <span className="text-white font-medium">GitHub</span>
                                <span className="text-xs text-gray-400 block">@Fannzxyl</span>
                            </div>
                        </div>
                        <span className="text-gray-500 group-hover:text-gray-300 text-sm">→</span>
                    </a>

                    {/* Credits */}
                    <div className="text-center pt-4 border-t border-white/10">
                        <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
                            Made with <Heart size={14} className="text-red-500 fill-red-500" /> by <span className="text-white font-medium">Fannzxyl</span>
                        </p>
                        <p className="text-gray-500 text-xs mt-1">© 2024 KataSensei. All rights reserved.</p>
                    </div>
                </div>
            </section>

            {/* Bottom Sheet Demo */}
            <BottomSheet
                isOpen={isDemoSheetOpen}
                onClose={() => setIsDemoSheetOpen(false)}
                snapPoints={[50, 90]}
                initialSnap={0}
                onChange={(index) => setCurrentSnap(index)}
                title="Demo Bottom Sheet"
            >
                <div className="space-y-4">
                    <p className="text-gray-300">
                        Ini adalah contoh komponen <strong>BottomSheet</strong> dengan fitur:
                    </p>
                    <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
                        <li>Drag handle di atas untuk geser naik/turun</li>
                        <li>Snap points: 50% dan 90% tinggi layar</li>
                        <li>Velocity-based snapping (cepat geser = langsung snap)</li>
                        <li>Keyboard accessible (Arrow keys, Escape)</li>
                        <li>Animasi spring yang smooth</li>
                    </ul>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-xs text-gray-500">
                            Coba geser handle ke atas untuk expand ke 90%, atau geser ke bawah untuk tutup.
                        </p>
                    </div>
                </div>
            </BottomSheet>

        </div>
    );
};
