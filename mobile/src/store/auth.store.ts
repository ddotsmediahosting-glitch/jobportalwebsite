import { create } from 'zustand';
import { AuthUser } from '../types';
import { tokenStorage, authApi } from '../api';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    role: 'SEEKER' | 'EMPLOYER';
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const token = await tokenStorage.getAccess();
      if (!token) {
        set({ isHydrated: true });
        return;
      }
      const res = await authApi.me();
      set({ user: res.data.data, isHydrated: true });
    } catch {
      await tokenStorage.clear();
      set({ user: null, isHydrated: true });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(email, password);
      const { user, accessToken, refreshToken } = res.data.data;
      await tokenStorage.setAccess(accessToken);
      await tokenStorage.setRefresh(refreshToken);
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(data);
      const { user, accessToken, refreshToken } = res.data.data;
      await tokenStorage.setAccess(accessToken);
      await tokenStorage.setRefresh(refreshToken);
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const refreshToken = await tokenStorage.getRefresh();
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch { /* ignore */ }
    }
    await tokenStorage.clear();
    set({ user: null });
  },

  updateUser: (partial) => {
    const current = get().user;
    if (current) set({ user: { ...current, ...partial } });
  },
}));
