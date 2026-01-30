/*
 * @Author: Ender-Wiggin
 * @Date: 2025-01-30
 * @Description: Theme context for switching between Silver and Ice accent themes
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

type TTheme = 'silver' | 'ice';

interface IThemeContextValue {
  theme: TTheme;
  setTheme: (theme: TTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<IThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'seti-color-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<TTheme>('silver');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as TTheme | null;
    if (savedTheme && (savedTheme === 'silver' || savedTheme === 'ice')) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Update document class and data attribute
    const html = document.documentElement;
    html.classList.remove('theme-silver', 'theme-ice');
    html.classList.add(`theme-${theme}`);
    html.setAttribute('data-theme', theme);

    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: TTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'silver' ? 'ice' : 'silver'));
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'silver', setTheme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
