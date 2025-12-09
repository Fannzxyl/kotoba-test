import React, { useState } from 'react';
import { Palette, X, Check } from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext';

export const ThemePicker: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                title="Change Theme"
            >
                <Palette size={20} />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="relative w-full max-w-sm bg-[#1a1a24] border border-white/10 rounded-3xl p-6 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Palette size={20} className="text-primary" />
                                Select Theme
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`
                    group relative p-3 rounded-2xl border transition-all flex items-center gap-3 overflow-hidden
                    ${theme === t.id
                                            ? 'bg-white/5 border-primary ring-1 ring-primary'
                                            : 'bg-[#151520] border-white/5 hover:border-white/20 hover:bg-white/5'}
                  `}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center shrink-0"
                                        style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }}
                                    >
                                        {theme === t.id && <Check size={16} className="text-white drop-shadow-md" />}
                                    </div>
                                    <span className={`font-medium ${theme === t.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                        {t.name}
                                    </span>

                                    {/* Active glow effect */}
                                    {theme === t.id && (
                                        <div
                                            className="absolute inset-0 opacity-10 pointer-events-none"
                                            style={{ background: t.primary }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 flex flex-col gap-3">
                            <p className="text-xs text-center text-gray-500">
                                Theme settings are saved automatically.
                            </p>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 active:scale-95 transition-all text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
