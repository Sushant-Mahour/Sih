import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'NIDAN-theme';

const ThemeContext = createContext({
  theme: 'light',
  themeMode: 'light',
  setThemeMode: () => { },
  toggleTheme: () => { }
});

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch (e) {
      console.warn('Failed to read theme preference from localStorage:', e);
    }
    // Default to light theme
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (themeMode === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return themeMode;
  });

  useEffect(() => {
    const root = document.documentElement;

    let active = themeMode;
    if (themeMode === 'system') {
      active = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    setResolvedTheme(active);
    root.setAttribute('data-theme', active);
    root.classList.remove('light', 'dark');
    root.classList.add(active);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(active);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch (e) {
      console.warn('Failed to save theme preference to localStorage:', e);
    }

    // System theme change listener if in system mode
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(newTheme);
        root.setAttribute('data-theme', newTheme);
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(newTheme);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themeMode,
        setThemeMode,
        setTheme: setThemeMode,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
