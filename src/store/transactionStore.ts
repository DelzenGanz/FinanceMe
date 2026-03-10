// ============================================================
// FinanceMe — Transaction Store (Zustand)
// ============================================================

import { create } from 'zustand';
import type { Transaction } from '../../electron/database/types';

interface TransactionState {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  isLoading: boolean;

  setTransactions: (transactions: Transaction[]) => void;
  setRecentTransactions: (transactions: Transaction[]) => void;
  setLoading: (value: boolean) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: number, updated: Transaction) => void;
  removeTransaction: (id: number) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  recentTransactions: [],
  isLoading: false,

  setTransactions: (transactions) => set({ transactions }),
  setRecentTransactions: (recentTransactions) => set({ recentTransactions }),
  setLoading: (isLoading) => set({ isLoading }),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),

  updateTransaction: (id, updated) =>
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? updated : t)),
    })),

  removeTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),
}));
