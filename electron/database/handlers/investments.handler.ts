// ============================================================
// FinanceMe — Investments IPC Handler
// ============================================================

import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { InvestmentAllocation, CreateInvestmentData } from '../types';

interface InvestmentSummary {
  total_allocation: number;
  total_monthly_target: number;
  allocations: InvestmentAllocation[];
}

export function registerInvestmentHandlers(): void {
  const db = getDb();

  // Get all investment allocations
  ipcMain.handle('investments:getAll', (): InvestmentAllocation[] => {
    return db.prepare(
      'SELECT * FROM investment_allocations ORDER BY allocation_percentage DESC'
    ).all() as InvestmentAllocation[];
  });

  // Get investment summary
  ipcMain.handle('investments:getSummary', (): InvestmentSummary => {
    const allocations = db.prepare(
      'SELECT * FROM investment_allocations ORDER BY allocation_percentage DESC'
    ).all() as InvestmentAllocation[];

    const totalAllocation = allocations.reduce((sum, a) => sum + a.allocation_percentage, 0);
    const totalMonthlyTarget = allocations.reduce((sum, a) => sum + a.target_monthly, 0);

    return {
      total_allocation: totalAllocation,
      total_monthly_target: totalMonthlyTarget,
      allocations,
    };
  });

  // Create an investment allocation
  ipcMain.handle('investments:create', (_event, data: CreateInvestmentData): InvestmentAllocation => {
    const result = db.prepare(`
      INSERT INTO investment_allocations (user_id, name, allocation_percentage, target_monthly, type, notes)
      VALUES (@user_id, @name, @allocation_percentage, @target_monthly, @type, @notes)
    `).run({
      user_id: data.user_id,
      name: data.name,
      allocation_percentage: data.allocation_percentage,
      target_monthly: data.target_monthly ?? 0,
      type: data.type ?? null,
      notes: data.notes ?? null,
    });

    return db.prepare('SELECT * FROM investment_allocations WHERE id = ?').get(result.lastInsertRowid) as InvestmentAllocation;
  });

  // Update an investment allocation
  ipcMain.handle('investments:update', (_event, id: number, data: Partial<CreateInvestmentData>): InvestmentAllocation | null => {
    const existing = db.prepare('SELECT * FROM investment_allocations WHERE id = ?').get(id) as InvestmentAllocation | undefined;
    if (!existing) return null;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.allocation_percentage !== undefined) { fields.push('allocation_percentage = ?'); values.push(data.allocation_percentage); }
    if (data.target_monthly !== undefined) { fields.push('target_monthly = ?'); values.push(data.target_monthly); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

    if (fields.length === 0) return existing;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE investment_allocations SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return db.prepare('SELECT * FROM investment_allocations WHERE id = ?').get(id) as InvestmentAllocation;
  });

  // Delete an investment allocation
  ipcMain.handle('investments:delete', (_event, id: number): boolean => {
    const result = db.prepare('DELETE FROM investment_allocations WHERE id = ?').run(id);
    return result.changes > 0;
  });
}
