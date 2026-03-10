// ============================================================
// FinanceMe — Savings Goals IPC Handler
// ============================================================

import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { SavingsGoal, CreateSavingsGoalData } from '../types';

export function registerSavingsHandlers(): void {
  const db = getDb();

  // Get all savings goals
  ipcMain.handle('savings:getAll', (): SavingsGoal[] => {
    return db.prepare(
      'SELECT * FROM savings_goals ORDER BY is_completed ASC, created_at DESC'
    ).all() as SavingsGoal[];
  });

  // Create a savings goal
  ipcMain.handle('savings:create', (_event, data: CreateSavingsGoalData): SavingsGoal => {
    const result = db.prepare(`
      INSERT INTO savings_goals (user_id, name, target_amount, deadline, icon, color)
      VALUES (@user_id, @name, @target_amount, @deadline, @icon, @color)
    `).run({
      user_id: data.user_id,
      name: data.name,
      target_amount: data.target_amount,
      deadline: data.deadline ?? null,
      icon: data.icon ?? 'piggy-bank',
      color: data.color ?? '#22C55E',
    });

    return db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(result.lastInsertRowid) as SavingsGoal;
  });

  // Update a savings goal
  ipcMain.handle('savings:update', (_event, id: number, data: Partial<CreateSavingsGoalData>): SavingsGoal | null => {
    const existing = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as SavingsGoal | undefined;
    if (!existing) return null;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.target_amount !== undefined) { fields.push('target_amount = ?'); values.push(data.target_amount); }
    if (data.deadline !== undefined) { fields.push('deadline = ?'); values.push(data.deadline); }
    if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
    if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }

    if (fields.length === 0) return existing;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE savings_goals SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as SavingsGoal;
  });

  // Delete a savings goal
  ipcMain.handle('savings:delete', (_event, id: number): boolean => {
    const result = db.prepare('DELETE FROM savings_goals WHERE id = ?').run(id);
    return result.changes > 0;
  });

  // Deposit into a savings goal
  ipcMain.handle('savings:deposit', (_event, id: number, amount: number): SavingsGoal | null => {
    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as SavingsGoal | undefined;
    if (!goal) return null;

    const newAmount = goal.current_amount + amount;
    const isCompleted = newAmount >= goal.target_amount ? 1 : 0;

    db.prepare(`
      UPDATE savings_goals
      SET current_amount = ?, is_completed = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newAmount, isCompleted, id);

    return db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as SavingsGoal;
  });
}
