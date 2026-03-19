'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('teros-theme') as Theme | null;
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = saved || (preferDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    const channel = new BroadcastChannel('teros_theme_sync');
    channel.onmessage = (e) => {
      if (e.data.theme) {
        setTheme(e.data.theme);
        document.documentElement.setAttribute('data-theme', e.data.theme);
      }
    };

    return () => channel.close();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('teros-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Broadcast to other tabs
    const channel = new BroadcastChannel('teros_theme_sync');
    channel.postMessage({ theme: newTheme });
    channel.close();
  };

  // Prevent flash but still provide context
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
