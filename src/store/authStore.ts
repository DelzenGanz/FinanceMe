// ============================================================
// FinanceMe — Auth Store (Zustand)
// In-memory only — no persistence. Resets on app restart.
// ============================================================

import { create } from 'zustand';

/** Safe user type — same as what auth handler returns (no PIN hash) */
export interface SafeUser {
  id: number;
  name: string;
  currency: string;
  monthly_income: number;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: SafeUser) => void;
  logout: () => void;
  setLoading: (value: boolean) => void;
  updateUser: (data: Partial<SafeUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  logout: () => set({ user: null, isAuthenticated: false }),
  setLoading: (isLoading) => set({ isLoading }),
  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),
}));
