// ============================================================
// FinanceMe — Transactions IPC Handler
// ============================================================

import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { Transaction, TransactionFilters, CreateTransactionData } from '../types';

export function registerTransactionHandlers(): void {
  const db = getDb();

  // Get all transactions with optional filters
  ipcMain.handle('transactions:getAll', (_event, filters?: TransactionFilters): Transaction[] => {
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters?.month !== undefined) {
      query += " AND CAST(strftime('%m', date) AS INTEGER) = ?";
      params.push(filters.month);
    }
    if (filters?.year !== undefined) {
      query += " AND CAST(strftime('%Y', date) AS INTEGER) = ?";
      params.push(filters.year);
    }
    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters?.category_id !== undefined) {
      query += ' AND category_id = ?';
      params.push(filters.category_id);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    return db.prepare(query).all(...params) as Transaction[];
  });

  // Get recent transactions (last 10)
  ipcMain.handle('transactions:getRecent', (): Transaction[] => {
    return db.prepare(
      'SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 10'
    ).all() as Transaction[];
  });

  // Create a new transaction
  ipcMain.handle('transactions:create', (_event, data: CreateTransactionData): Transaction => {
    const result = db.prepare(`
      INSERT INTO transactions (user_id, type, amount, category_id, description, date, is_recurring, recurring_interval, note)
      VALUES (@user_id, @type, @amount, @category_id, @description, @date, @is_recurring, @recurring_interval, @note)
    `).run({
      user_id: data.user_id,
      type: data.type,
      amount: data.amount,
      category_id: data.category_id ?? null,
      description: data.description ?? null,
      date: data.date,
      is_recurring: data.is_recurring ? 1 : 0,
      recurring_interval: data.recurring_interval ?? null,
      note: data.note ?? null,
    });

    return db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid) as Transaction;
  });

  // Update a transaction
  ipcMain.handle('transactions:update', (_event, id: number, data: Partial<CreateTransactionData>): Transaction | null => {
    const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction | undefined;
    if (!existing) return null;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
    if (data.is_recurring !== undefined) { fields.push('is_recurring = ?'); values.push(data.is_recurring ? 1 : 0); }
    if (data.recurring_interval !== undefined) { fields.push('recurring_interval = ?'); values.push(data.recurring_interval); }
    if (data.note !== undefined) { fields.push('note = ?'); values.push(data.note); }

    if (fields.length === 0) return existing;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction;
  });

  // Delete a transaction
  ipcMain.handle('transactions:delete', (_event, id: number): boolean => {
    const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return result.changes > 0;
  });

  // Export CSV (returns CSV string — frontend handles file save via dialog)
  ipcMain.handle('transactions:exportCSV', (): string => {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC
    `).all() as (Transaction & { category_name: string | null })[];

    const header = 'Date,Type,Amount,Category,Description,Note\n';
    const rows = transactions.map(t =>
      `"${t.date}","${t.type}","${t.amount}","${t.category_name ?? ''}","${t.description ?? ''}","${t.note ?? ''}"`
    ).join('\n');

    return header + rows;
  });
}
