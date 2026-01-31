import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../types';
import { authApi, getToken, setToken, clearToken, setOnUnauthorized } from '../services/api';

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    setOnUnauthorized(handleUnauthorized);
  }, [handleUnauthorized]);

  const checkStatus = useCallback(async () => {
    try {
      const status = await authApi.getStatus();
      setIsInitialized(status.initialized);

      const token = getToken();
      if (token && status.initialized) {
        if (isTokenExpired(token)) {
          clearToken();
          localStorage.removeItem('pos_auth_user');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        setIsAuthenticated(true);
        const stored = localStorage.getItem('pos_auth_user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            // ignore parse error
          }
        }
      }
    } catch {
      // API not available — assume online later
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    localStorage.setItem('pos_auth_user', JSON.stringify(data.user));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('pos_auth_user');
  }, []);

  const register = useCallback(async (username: string, password: string, confirmPassword: string, displayName: string) => {
    const data = await authApi.register(username, password, confirmPassword, displayName);
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    setIsInitialized(true);
    localStorage.setItem('pos_auth_user', JSON.stringify(data.user));
  }, []);

  return {
    user,
    isAuthenticated,
    isInitialized,
    isLoading,
    login,
    logout,
    register,
  };
}
