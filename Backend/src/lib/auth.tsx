import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser, AuthResponse, SystemStatus } from '@/types';
import { authApi, setToken, clearToken, getToken, api } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, password: string, confirmPassword: string, displayName: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const status = await authApi<SystemStatus>('/api/auth/status');
      setIsInitialized(status.initialized);

      const token = getToken();
      if (token && status.initialized) {
        try {
          const userInfo = await api<AuthUser>('/api/admin/accounts/me');
          setUser(userInfo);
        } catch {
          clearToken();
          setUser(null);
        }
      }
    } catch {
      // API not available
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await authApi<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const register = useCallback(async (username: string, password: string, confirmPassword: string, displayName: string) => {
    const data = await authApi<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, confirmPassword, displayName }),
    });
    setToken(data.token);
    setUser(data.user);
    setIsInitialized(true);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userInfo = await api<AuthUser>('/api/admin/accounts/me');
      setUser(userInfo);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isInitialized, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
