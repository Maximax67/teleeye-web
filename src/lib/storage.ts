import { Tokens } from '@/types';

const TOKEN_KEY = 'teleeye_tokens';
const THEME_KEY = 'teleeye_theme';

export const storage = {
  getTokens(): Tokens | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(TOKEN_KEY);
    return data ? JSON.parse(data) : null;
  },

  setTokens(tokens: Tokens | null): void {
    if (typeof window === 'undefined') return;
    if (tokens) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  },

  setTheme(theme: 'light' | 'dark'): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(THEME_KEY, theme);
  },
};
