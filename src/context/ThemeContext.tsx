import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'violet' | 'sakura' | 'cyberpunk' | 'samurai' | 'matcha' | 'golden';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEMES: { id: Theme; name: string; primary: string; secondary: string }[] = [
    { id: 'violet', name: 'Default', primary: '#7c3aed', secondary: '#c084fc' },
    { id: 'sakura', name: 'Sakura', primary: '#ec4899', secondary: '#f472b6' },
    { id: 'cyberpunk', name: 'Cyberpunk', primary: '#06b6d4', secondary: '#67e8f9' },
    { id: 'samurai', name: 'Samurai', primary: '#ef4444', secondary: '#f87171' },
    { id: 'matcha', name: 'Matcha', primary: '#10b981', secondary: '#34d399' },
    { id: 'golden', name: 'Golden', primary: '#f59e0b', secondary: '#fbbf24' },
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('violet');

    useEffect(() => {
        // Load theme from local storage
        const savedTheme = localStorage.getItem('katasensei-theme') as Theme;
        if (savedTheme && THEMES.find(t => t.id === savedTheme)) {
            setThemeState(savedTheme);
        }
    }, []);

    useEffect(() => {
        // Apply theme class to body
        const body = document.body;
        THEMES.forEach(t => body.classList.remove(`theme-${t.id}`));

        if (theme !== 'violet') {
            body.classList.add(`theme-${theme}`);
        }

        // Save to local storage
        localStorage.setItem('katasensei-theme', theme);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
