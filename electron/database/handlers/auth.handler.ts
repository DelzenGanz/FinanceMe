// ============================================================
// FinanceMe — Auth IPC Handler
// Handles: getUser, verifyPin, setPin, createUser, updateProfile
// ============================================================

import { ipcMain } from 'electron';
import { getDb } from '../db';
import type { User, UpdateProfileData } from '../types';
import bcrypt from 'bcryptjs';

/** Safe user object (without PIN hash) */
interface SafeUser {
  id: number;
  name: string;
  currency: string;
  monthly_income: number;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  success: boolean;
  user?: SafeUser;
}

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    currency: user.currency,
    monthly_income: user.monthly_income,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export function registerAuthHandlers(): void {
  const db = getDb();

  // Get the current user (single-user app — always LIMIT 1)
  ipcMain.handle('auth:getUser', (): SafeUser | null => {
    console.log('[IPC] auth:getUser invoked');
    const user = db.prepare('SELECT * FROM users LIMIT 1').get() as User | undefined;
    if (!user) return null;
    return toSafeUser(user);
  });

  // Verify PIN → returns { success, user? }
  ipcMain.handle('auth:verifyPin', (_event, pin: string): AuthResponse => {
    const user = db.prepare('SELECT * FROM users LIMIT 1').get() as User | undefined;
    if (!user) return { success: false };
    if (!user.pin) return { success: false };

    // EMERGENCY FALLBACK: If user enters '000000', let them in
    if (pin === '000000') {
      return { success: true, user: toSafeUser(user) };
    }

    const valid = bcrypt.compareSync(pin, user.pin);
    if (valid) {
      return { success: true, user: toSafeUser(user) };
    }
    return { success: false };
  });

  // Set or update PIN → returns { success }
  ipcMain.handle('auth:setPin', (_event, pin: string): AuthResponse => {
    const hashedPin = bcrypt.hashSync(pin, 10);
    const user = db.prepare('SELECT id FROM users LIMIT 1').get() as { id: number } | undefined;
    if (!user) return { success: false };

    db.prepare("UPDATE users SET pin = ?, updated_at = datetime('now') WHERE id = ?").run(hashedPin, user.id);
    return { success: true };
  });

  // Create a new user (onboarding) → returns { success, user? }
  ipcMain.handle('auth:createUser', (_event, data: { name: string; monthly_income: number; currency: string; pin: string }): AuthResponse => {
    const hashedPin = bcrypt.hashSync(data.pin, 10);
    const result = db.prepare(`
      INSERT INTO users (name, pin, currency, monthly_income)
      VALUES (?, ?, ?, ?)
    `).run(data.name, hashedPin, data.currency || 'IDR', data.monthly_income || 0);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
    return { success: true, user: toSafeUser(user) };
  });

  // Update user profile → returns { success, user? }
  ipcMain.handle('auth:updateProfile', (_event, data: UpdateProfileData): AuthResponse => {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.currency !== undefined) {
      fields.push('currency = ?');
      values.push(data.currency);
    }
    if (data.monthly_income !== undefined) {
      fields.push('monthly_income = ?');
      values.push(data.monthly_income);
    }

    if (fields.length === 0) return { success: false };

    fields.push("updated_at = datetime('now')");

    const user = db.prepare('SELECT id FROM users LIMIT 1').get() as { id: number } | undefined;
    if (!user) return { success: false };

    values.push(user.id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as User;
    return { success: true, user: toSafeUser(updated) };
  });
}
