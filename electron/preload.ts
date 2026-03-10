// ============================================================
// FinanceMe — Preload Script (Secure Bridge)
// Exposes electronAPI to the renderer via contextBridge.
// ============================================================

import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Auth ──────────────────────────────────────────────────
  auth: {
    getUser: () => ipcRenderer.invoke('auth:getUser'),
    verifyPin: (pin: string) => ipcRenderer.invoke('auth:verifyPin', pin),
    setPin: (pin: string) => ipcRenderer.invoke('auth:setPin', pin),
    createUser: (data: Record<string, unknown>) => ipcRenderer.invoke('auth:createUser', data),
    updateProfile: (data: Record<string, unknown>) => ipcRenderer.invoke('auth:updateProfile', data),
  },

  // ── Dashboard ─────────────────────────────────────────────
  dashboard: {
    getSummary: (month: number, year: number) => ipcRenderer.invoke('dashboard:getSummary', month, year),
    getCashflow: () => ipcRenderer.invoke('dashboard:getCashflow'),
    getHealthScore: () => ipcRenderer.invoke('dashboard:getHealthScore'),
  },

  // ── Transactions ──────────────────────────────────────────
  transactions: {
    getAll: (filters?: Record<string, unknown>) => ipcRenderer.invoke('transactions:getAll', filters),
    getRecent: () => ipcRenderer.invoke('transactions:getRecent'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('transactions:create', data),
    update: (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('transactions:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('transactions:delete', id),
    exportCSV: () => ipcRenderer.invoke('transactions:exportCSV'),
  },

  // ── Categories ────────────────────────────────────────────
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('categories:create', data),
    update: (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('categories:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('categories:delete', id),
  },

  // ── Budgets ───────────────────────────────────────────────
  budgets: {
    getAll: (month: number, year: number) => ipcRenderer.invoke('budgets:getAll', month, year),
    getOverview: (month: number, year: number) => ipcRenderer.invoke('budgets:getOverview', month, year),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('budgets:create', data),
    update: (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('budgets:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('budgets:delete', id),
  },

  // ── Savings ───────────────────────────────────────────────
  savings: {
    getAll: () => ipcRenderer.invoke('savings:getAll'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('savings:create', data),
    update: (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('savings:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('savings:delete', id),
    deposit: (id: number, amount: number) => ipcRenderer.invoke('savings:deposit', id, amount),
  },

  // ── Investments ───────────────────────────────────────────
  investments: {
    getAll: () => ipcRenderer.invoke('investments:getAll'),
    getSummary: () => ipcRenderer.invoke('investments:getSummary'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('investments:create', data),
    update: (id: number, data: Record<string, unknown>) => ipcRenderer.invoke('investments:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('investments:delete', id),
  },

  // ── Reports ───────────────────────────────────────────────
  reports: {
    getMonthly: (month: number, year: number) => ipcRenderer.invoke('reports:getMonthly', month, year),
    getCategoryBreakdown: (month: number, year: number) => ipcRenderer.invoke('reports:getCategoryBreakdown', month, year),
    getTrends: () => ipcRenderer.invoke('reports:getTrends'),
  },

  // ── Settings ──────────────────────────────────────────────
  settings: {
    getDbPath: () => ipcRenderer.invoke('settings:getDbPath'),
    getAppVersion: () => ipcRenderer.invoke('settings:getAppVersion'),
    resetData: () => ipcRenderer.invoke('settings:resetData'),
  },
})
