// ============================================================
// FinanceMe — Settings IPC Handler
// ============================================================

import { ipcMain, app } from 'electron';
import { getDb } from '../db';
import path from 'node:path';

export function registerSettingsHandlers(): void {
  const db = getDb();

  // Get database file path info
  ipcMain.handle('settings:getDbPath', (): string => {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'financement.db');
  });

  // Get app version
  ipcMain.handle('settings:getAppVersion', (): string => {
    return app.getVersion();
  });

  // Reset all data (dangerous — delete all user data)
  ipcMain.handle('settings:resetData', (): boolean => {
    try {
      db.exec('DELETE FROM financial_snapshots');
      db.exec('DELETE FROM investment_allocations');
      db.exec('DELETE FROM savings_goals');
      db.exec('DELETE FROM budgets');
      db.exec('DELETE FROM transactions');
      db.exec("DELETE FROM categories WHERE user_id IS NOT NULL");
      db.exec('DELETE FROM users');
      return true;
    } catch {
      return false;
    }
  });
}
