import { apiClient } from '@/lib/api';
import { dbCache } from '@/lib/indexeddb';
import { User } from '@/types';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string, isEmail: boolean) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Wire up the client's session-expiry hook so that when a refresh token is
  // rejected (401), the client can clear React state without importing this
  // context (which would create a circular dependency).
  useEffect(() => {
    apiClient.setOnSessionExpired(() => {
      setUser(null);
      // Tokens and IndexedDB cache are already cleared inside the client.
    });
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const tokens = apiClient.getTokens();
      if (tokens) {
        try {
          const userData = await apiClient.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Failed to restore session:', error);
          apiClient.setTokens(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string, isEmail: boolean) => {
    const { user: userData } = await apiClient.login(identifier, password, isEmail);
    setUser(userData);
  };

  const register = async (email: string, username: string, password: string) => {
    const { user: userData } = await apiClient.register(email, username, password);
    setUser(userData);
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
    dbCache.clear();
  };

  const logoutAll = async () => {
    await apiClient.logoutAll();
    setUser(null);
    dbCache.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, logoutAll }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
