// ============================================================
// FinanceMe — Database Model Interfaces
// ============================================================

export interface User {
  id: number;
  name: string;
  pin: string | null;
  currency: string;
  monthly_income: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category_id: number | null;
  description: string | null;
  date: string;
  is_recurring: number;
  recurring_interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  user_id: number | null;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  color: string;
  is_default?: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  period: 'monthly' | 'weekly';
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  is_completed: number;
  created_at: string;
  updated_at: string;
}

export interface InvestmentAllocation {
  id: number;
  user_id: number;
  name: string;
  allocation_percentage: number;
  target_monthly: number;
  type: 'reksa_dana' | 'saham' | 'crypto' | 'emas' | 'deposito' | 'other' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialSnapshot {
  id: number;
  user_id: number;
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  total_savings: number;
  health_score: number;
  created_at: string;
}

// ============================================================
// IPC Request/Response Types
// ============================================================

export interface TransactionFilters {
  month?: number;
  year?: number;
  type?: 'income' | 'expense';
  category_id?: number;
}

export interface CreateTransactionData {
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category_id?: number;
  description?: string;
  date: string;
  is_recurring?: boolean;
  recurring_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  note?: string;
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {}

export interface CreateCategoryData {
  user_id?: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface CreateBudgetData {
  user_id: number;
  category_id: number;
  amount: number;
  period?: 'monthly' | 'weekly';
  month: number;
  year: number;
}

export interface CreateSavingsGoalData {
  user_id: number;
  name: string;
  target_amount: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

export interface CreateInvestmentData {
  user_id: number;
  name: string;
  allocation_percentage: number;
  target_monthly?: number;
  type?: 'reksa_dana' | 'saham' | 'crypto' | 'emas' | 'deposito' | 'other';
  notes?: string;
}

export interface UpdateProfileData {
  name?: string;
  currency?: string;
  monthly_income?: number;
}

export interface DashboardSummary {
  total_income: number;
  total_expense: number;
  balance: number;
  safe_to_spend: number;
}

export interface CashflowData {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  category_name: string;
  category_color: string;
  total: number;
  percentage: number;
}
