// ============================================================
// FinanceMe — IPC API Wrapper
// Direct alias to the electronAPI exposed via preload.ts
// No HTTP, no Axios — everything goes through Electron IPC.
// ============================================================

import type {
  Transaction,
  Category,
  Budget,
  SavingsGoal,
  InvestmentAllocation,
  DashboardSummary,
  CashflowData,
  CategoryBreakdown,
} from '../../electron/database/types';

import type { SafeUser } from '../store/authStore';

/** Auth response from IPC handlers */
export interface AuthResponse {
  success: boolean;
  user?: SafeUser;
}

/** Type definitions for the electronAPI exposed via contextBridge */
export interface ElectronAPI {
  auth: {
    getUser: () => Promise<SafeUser | null>;
    verifyPin: (pin: string) => Promise<AuthResponse>;
    setPin: (pin: string) => Promise<AuthResponse>;
    createUser: (data: { name: string; monthly_income: number; currency: string; pin: string }) => Promise<AuthResponse>;
    updateProfile: (data: Record<string, unknown>) => Promise<AuthResponse>;
  };
  dashboard: {
    getSummary: (month: number, year: number) => Promise<DashboardSummary>;
    getCashflow: () => Promise<CashflowData[]>;
    getHealthScore: () => Promise<{ score: number; label: string }>;
  };
  transactions: {
    getAll: (filters?: Record<string, unknown>) => Promise<Transaction[]>;
    getRecent: () => Promise<Transaction[]>;
    create: (data: Record<string, unknown>) => Promise<Transaction>;
    update: (id: number, data: Record<string, unknown>) => Promise<Transaction | null>;
    delete: (id: number) => Promise<boolean>;
    exportCSV: () => Promise<string>;
  };
  categories: {
    getAll: () => Promise<Category[]>;
    create: (data: Record<string, unknown>) => Promise<Category>;
    update: (id: number, data: Record<string, unknown>) => Promise<Category | null>;
    delete: (id: number) => Promise<boolean>;
  };
  budgets: {
    getAll: (month: number, year: number) => Promise<Budget[]>;
    getOverview: (month: number, year: number) => Promise<unknown[]>;
    create: (data: Record<string, unknown>) => Promise<Budget>;
    update: (id: number, data: Record<string, unknown>) => Promise<Budget | null>;
    delete: (id: number) => Promise<boolean>;
  };
  savings: {
    getAll: () => Promise<SavingsGoal[]>;
    create: (data: Record<string, unknown>) => Promise<SavingsGoal>;
    update: (id: number, data: Record<string, unknown>) => Promise<SavingsGoal | null>;
    delete: (id: number) => Promise<boolean>;
    deposit: (id: number, amount: number) => Promise<SavingsGoal | null>;
  };
  investments: {
    getAll: () => Promise<InvestmentAllocation[]>;
    getSummary: () => Promise<unknown>;
    create: (data: Record<string, unknown>) => Promise<InvestmentAllocation>;
    update: (id: number, data: Record<string, unknown>) => Promise<InvestmentAllocation | null>;
    delete: (id: number) => Promise<boolean>;
  };
  reports: {
    getMonthly: (month: number, year: number) => Promise<unknown>;
    getCategoryBreakdown: (month: number, year: number) => Promise<CategoryBreakdown[]>;
    getTrends: () => Promise<unknown[]>;
  };
  settings: {
    getDbPath: () => Promise<string>;
    getAppVersion: () => Promise<string>;
    resetData: () => Promise<boolean>;
  };
}

// Extend Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

if (!window.electronAPI) {
  console.error('[IPC ERROR] window.electronAPI is undefined! Preload script failed to load or context isolation is misconfigured.');
}

export const api = window.electronAPI;
