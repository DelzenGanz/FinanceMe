// ============================================================
// FinanceMe — Budgets IPC Handler
// ============================================================

import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { Budget, CreateBudgetData } from '../types';

interface BudgetOverviewItem extends Budget {
  category_name: string;
  category_color: string;
  category_icon: string;
  spent: number;
}

export function registerBudgetHandlers(): void {
  const db = getDb();

  // Get all budgets for a given month/year
  ipcMain.handle('budgets:getAll', (_event, month: number, year: number): Budget[] => {
    return db.prepare(
      'SELECT * FROM budgets WHERE month = ? AND year = ? ORDER BY created_at DESC'
    ).all(month, year) as Budget[];
  });

  // Get budget overview with spent amounts
  ipcMain.handle('budgets:getOverview', (_event, month: number, year: number): BudgetOverviewItem[] => {
    return db.prepare(`
      SELECT
        b.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        COALESCE(
          (SELECT SUM(t.amount)
           FROM transactions t
           WHERE t.category_id = b.category_id
             AND t.type = 'expense'
             AND CAST(strftime('%m', t.date) AS INTEGER) = b.month
             AND CAST(strftime('%Y', t.date) AS INTEGER) = b.year
          ), 0
        ) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.month = ? AND b.year = ?
      ORDER BY b.created_at DESC
    `).all(month, year) as BudgetOverviewItem[];
  });

  // Create a budget
  ipcMain.handle('budgets:create', (_event, data: CreateBudgetData): Budget => {
    const result = db.prepare(`
      INSERT INTO budgets (user_id, category_id, amount, period, month, year)
      VALUES (@user_id, @category_id, @amount, @period, @month, @year)
    `).run({
      user_id: data.user_id,
      category_id: data.category_id,
      amount: data.amount,
      period: data.period ?? 'monthly',
      month: data.month,
      year: data.year,
    });

    return db.prepare('SELECT * FROM budgets WHERE id = ?').get(result.lastInsertRowid) as Budget;
  });

  // Update a budget
  ipcMain.handle('budgets:update', (_event, id: number, data: Partial<CreateBudgetData>): Budget | null => {
    const existing = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id) as Budget | undefined;
    if (!existing) return null;

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
    if (data.period !== undefined) { fields.push('period = ?'); values.push(data.period); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }

    if (fields.length === 0) return existing;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return db.prepare('SELECT * FROM budgets WHERE id = ?').get(id) as Budget;
  });

  // Delete a budget
  ipcMain.handle('budgets:delete', (_event, id: number): boolean => {
    const result = db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
    return result.changes > 0;
  });
}
