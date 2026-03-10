// ============================================================
// FinanceMe — Categories IPC Handler
// ============================================================

import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { Category, CreateCategoryData } from '../types';

export function registerCategoryHandlers(): void {
  const db = getDb();

  // Get all categories (system + user-defined)
  ipcMain.handle('categories:getAll', (): Category[] => {
    return db.prepare('SELECT * FROM categories ORDER BY type, name').all() as Category[];
  });

  // Create a new category
  ipcMain.handle('categories:create', (_event, data: CreateCategoryData): Category => {
    const result = db.prepare(`
      INSERT INTO categories (user_id, name, type, icon, color)
      VALUES (@user_id, @name, @type, @icon, @color)
    `).run({
      user_id: data.user_id ?? null,
      name: data.name,
      type: data.type,
      icon: data.icon ?? 'circle',
      color: data.color ?? '#6366F1',
    });

    return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category;
  });

  // Update a category
  ipcMain.handle('categories:update', (_event, id: number, data: Partial<CreateCategoryData>): Category | null => {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
    if (!existing) return null;

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
    if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }

    if (fields.length === 0) return existing;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category;
  });

  // Delete a category
  ipcMain.handle('categories:delete', (_event, id: number): boolean => {
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return result.changes > 0;
  });
}
