// ============================================================
// FinanceMe — Reports IPC Handler
// ============================================================

import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { CashflowData, CategoryBreakdown } from '../types';

interface MonthlyReport {
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  savings_rate: number;
  top_expense_categories: CategoryBreakdown[];
}

interface TrendData {
  month: string;
  income: number;
  expense: number;
  savings: number;
  health_score: number;
}

export function registerReportHandlers(): void {
  const db = getDb();

  // Dashboard summary for a given month/year
  ipcMain.handle('dashboard:getSummary', (_event, month: number, year: number) => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    console.log(`[Dashboard] Getting summary for ${monthStr}`);

    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'income'
        AND date LIKE ? || '%'
    `).get(monthStr) as { total: number };

    const expense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense'
        AND date LIKE ? || '%'
    `).get(monthStr) as { total: number };

    const totalIncome = income.total;
    const totalExpense = expense.total;
    const balance = totalIncome - totalExpense;

    console.log(`[Dashboard] Income: ${totalIncome}, Expense: ${totalExpense}`);
    
    // "Aman Dipakai" = balance minus total budget remaining
    const budgetTotal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM budgets
      WHERE month = ? AND year = ?
    `).get(month, year) as { total: number };

    const safeToSpend = Math.max(0, balance - (budgetTotal.total - totalExpense));

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      balance,
      safe_to_spend: safeToSpend,
    };
  });

  // Cashflow data — last 6 months
  ipcMain.handle('dashboard:getCashflow', (): CashflowData[] => {
    const data = db.prepare(`
      WITH months AS (
        SELECT
          CAST(strftime('%m', date) AS INTEGER) as month,
          CAST(strftime('%Y', date) AS INTEGER) as year,
          strftime('%Y-%m', date) as label
        FROM transactions
        GROUP BY strftime('%Y-%m', date)
        ORDER BY date DESC
        LIMIT 6
      )
      SELECT
        m.label as month,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount END), 0) as income,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount END), 0) as expense
      FROM months m
      LEFT JOIN transactions t ON strftime('%Y-%m', t.date) = m.label
      GROUP BY m.label
      ORDER BY m.label ASC
    `).all() as CashflowData[];

    return data;
  });

  // Health score calculation
  ipcMain.handle('dashboard:getHealthScore', () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    // 1. Savings & Expense Data
    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions
      WHERE type = 'income' AND date LIKE ? || '%'
    `).get(monthStr) as { total: number };

    const expense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions
      WHERE type = 'expense' AND date LIKE ? || '%'
    `).get(monthStr) as { total: number };

    // 2. Budget Adherence
    const budgets = db.prepare(`
      SELECT amount,
        (SELECT COALESCE(SUM(t.amount), 0) FROM transactions t
         WHERE t.category_id = b.category_id AND t.type = 'expense'
         AND t.date LIKE ? || '%') as spent
      FROM budgets b WHERE month = ? AND year = ?
    `).all(monthStr, month, year) as { amount: number; spent: number }[];

    const onTrackBudgets = budgets.length > 0
      ? budgets.filter(b => b.spent <= b.amount).length
      : 0;
    const budgetAdherence = budgets.length > 0 ? (onTrackBudgets / budgets.length) * 100 : 100;

    // 3. Investment Allocation
    const investment = db.prepare('SELECT COALESCE(SUM(target_monthly), 0) as total FROM investment_allocations').get() as { total: number };
    const investmentRate = income.total > 0 ? (investment.total / income.total) * 100 : 0;

    // -- CALCULATION (Weighted) --
    // Savings Rate (30% weight, ideal >= 20%)
    const savings = income.total - expense.total;
    const savingsRate = income.total > 0 ? (savings / income.total) * 100 : 0;
    const savingsScore = Math.min(100, (Math.max(0, savingsRate) / 20) * 100);

    // Budget Score (25% weight)
    const budgetScore = budgetAdherence;

    // Expense Score (25% weight, ideal <= 70%)
    const expenseRatio = income.total > 0 ? (expense.total / income.total) * 100 : 0;
    const expenseScore = expenseRatio <= 70 ? 100 : Math.max(0, 100 - ((expenseRatio - 70) / 30) * 100);

    // Investment Score (20% weight, ideal >= 10%)
    const investmentScore = Math.min(100, (investmentRate / 10) * 100);

    const score = Math.round(
      savingsScore * 0.30 +
      budgetScore * 0.25 +
      expenseScore * 0.25 +
      investmentScore * 0.20
    );

    let label = 'N/A';
    if (score <= 40) label = 'Kritis';
    else if (score <= 60) label = 'Waspada';
    else if (score <= 80) label = 'Baik';
    else label = 'Excellent';

    return { score, label };
  });

  // Monthly report
  ipcMain.handle('reports:getMonthly', (_event, month: number, year: number): MonthlyReport => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'income'
        AND date LIKE ? || '%'
    `).get(monthStr) as { total: number };

    const expense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'expense'
        AND date LIKE ? || '%'
    `).get(monthStr) as { total: number };

    const savingsRate = income.total > 0
      ? ((income.total - expense.total) / income.total) * 100
      : 0;

    const topCategories = db.prepare(`
      SELECT
        c.name as category_name,
        c.color as category_color,
        SUM(t.amount) as total,
        ROUND(SUM(t.amount) * 100.0 / NULLIF(?, 0), 1) as percentage
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
        AND t.date LIKE ? || '%'
      GROUP BY t.category_id
      ORDER BY total DESC
      LIMIT 5
    `).all(expense.total, monthStr) as CategoryBreakdown[];

    return {
      month,
      year,
      total_income: income.total,
      total_expense: expense.total,
      savings_rate: Math.round(savingsRate * 100) / 100,
      top_expense_categories: topCategories,
    };
  });

  // Category breakdown
  ipcMain.handle('reports:getCategoryBreakdown', (_event, month: number, year: number): CategoryBreakdown[] => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const totalExpense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'expense'
        AND date LIKE ? || '%'
    `).get(monthStr) as { total: number };

    return db.prepare(`
      SELECT
        c.name as category_name,
        c.color as category_color,
        SUM(t.amount) as total,
        ROUND(SUM(t.amount) * 100.0 / NULLIF(?, 0), 1) as percentage
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
        AND t.date LIKE ? || '%'
      GROUP BY t.category_id
      ORDER BY total DESC
    `).all(totalExpense.total, monthStr) as CategoryBreakdown[];
  });

  // Trends — 12-month history
  ipcMain.handle('reports:getTrends', (): TrendData[] => {
    return db.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) -
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as savings,
        0 as health_score
      FROM transactions
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 12
    `).all() as TrendData[];
  });
}
