import { Tokens } from '@/types';

const TOKEN_KEY = 'teleeye_tokens';
const THEME_KEY = 'teleeye_theme';
const API_URL_KEY = 'teleeye_api_url';

export const DEFAULT_API_URL = '/api';

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

  getApiUrl(): string {
    if (typeof window === 'undefined') return DEFAULT_API_URL;
    return localStorage.getItem(API_URL_KEY) ?? DEFAULT_API_URL;
  },

  setApiUrl(url: string): void {
    if (typeof window === 'undefined') return;
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed === DEFAULT_API_URL) {
      localStorage.removeItem(API_URL_KEY);
    } else {
      localStorage.setItem(API_URL_KEY, trimmed);
    }
  },
};
