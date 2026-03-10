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
    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'income'
        AND CAST(strftime('%m', date) AS INTEGER) = ?
        AND CAST(strftime('%Y', date) AS INTEGER) = ?
    `).get(month, year) as { total: number };

    const expense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE type = 'expense'
        AND CAST(strftime('%m', date) AS INTEGER) = ?
        AND CAST(strftime('%Y', date) AS INTEGER) = ?
    `).get(month, year) as { total: number };

    const balance = income.total - expense.total;
    // "Aman Dipakai" = balance minus total budget remaining
    const budgetTotal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM budgets
      WHERE month = ? AND year = ?
    `).get(month, year) as { total: number };

    const safeToSpend = Math.max(0, balance - (budgetTotal.total - expense.total));

    return {
      total_income: income.total,
      total_expense: expense.total,
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
    // Placeholder — full logic will be implemented in Part 2/3
    return { score: 0, label: 'N/A' };
  });

  // Monthly report
  ipcMain.handle('reports:getMonthly', (_event, month: number, year: number): MonthlyReport => {
    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'income'
        AND CAST(strftime('%m', date) AS INTEGER) = ?
        AND CAST(strftime('%Y', date) AS INTEGER) = ?
    `).get(month, year) as { total: number };

    const expense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'expense'
        AND CAST(strftime('%m', date) AS INTEGER) = ?
        AND CAST(strftime('%Y', date) AS INTEGER) = ?
    `).get(month, year) as { total: number };

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
        AND CAST(strftime('%m', t.date) AS INTEGER) = ?
        AND CAST(strftime('%Y', t.date) AS INTEGER) = ?
      GROUP BY t.category_id
      ORDER BY total DESC
      LIMIT 5
    `).all(expense.total, month, year) as CategoryBreakdown[];

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
    const totalExpense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions WHERE type = 'expense'
        AND CAST(strftime('%m', date) AS INTEGER) = ?
        AND CAST(strftime('%Y', date) AS INTEGER) = ?
    `).get(month, year) as { total: number };

    return db.prepare(`
      SELECT
        c.name as category_name,
        c.color as category_color,
        SUM(t.amount) as total,
        ROUND(SUM(t.amount) * 100.0 / NULLIF(?, 0), 1) as percentage
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
        AND CAST(strftime('%m', t.date) AS INTEGER) = ?
        AND CAST(strftime('%Y', t.date) AS INTEGER) = ?
      GROUP BY t.category_id
      ORDER BY total DESC
    `).all(totalExpense.total, month, year) as CategoryBreakdown[];
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
