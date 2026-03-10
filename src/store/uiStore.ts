// ============================================================
// FinanceMe — UI Store (Zustand)
// ============================================================

import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  currentPage: string;
  isModalOpen: boolean;
  modalContent: string | null;

  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  openModal: (content: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  currentPage: 'dashboard',
  isModalOpen: false,
  modalContent: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCurrentPage: (currentPage) => set({ currentPage }),
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),
}));
