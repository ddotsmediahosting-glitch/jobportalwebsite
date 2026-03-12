import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, tokenStorage, getApiError } from '../lib/api';
import { UserRole } from '@uaejobs/shared';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  verifiedAt: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
    } catch {
      setUser(null);
      tokenStorage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (token) {
      fetchMe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: userData } = data.data;
    tokenStorage.setAccess(accessToken);
    tokenStorage.setRefresh(refreshToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    const refreshToken = tokenStorage.getRefresh();
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore
    }
    tokenStorage.clear();
    setUser(null);
  };

  const refreshUser = () => fetchMe();

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
