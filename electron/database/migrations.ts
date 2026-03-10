// ============================================================
// FinanceMe — Database Migrations
// All tables use CREATE TABLE IF NOT EXISTS — safe to run on every launch.
// ============================================================

import { getDb } from './db';

/**
 * Run all table migrations.
 * Called once on app launch after initDatabase().
 */
export function runMigrations(): void {
  const db = getDb();

  // ------- users -------
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin TEXT,
      currency TEXT DEFAULT 'IDR',
      monthly_income REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // ------- categories -------
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT DEFAULT 'circle',
      color TEXT DEFAULT '#6366F1',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // ------- transactions -------
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category_id INTEGER,
      description TEXT,
      date TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      recurring_interval TEXT CHECK(recurring_interval IN ('daily','weekly','monthly','yearly')),
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // ------- budgets -------
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      period TEXT DEFAULT 'monthly' CHECK(period IN ('monthly', 'weekly')),
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // ------- savings_goals -------
  db.exec(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      icon TEXT DEFAULT 'piggy-bank',
      color TEXT DEFAULT '#22C55E',
      is_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // ------- investment_allocations -------
  db.exec(`
    CREATE TABLE IF NOT EXISTS investment_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      allocation_percentage REAL NOT NULL,
      target_monthly REAL DEFAULT 0,
      type TEXT CHECK(type IN ('reksa_dana','saham','crypto','emas','deposito','other')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // ------- financial_snapshots -------
  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      total_income REAL DEFAULT 0,
      total_expense REAL DEFAULT 0,
      total_savings REAL DEFAULT 0,
      health_score REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('[DB] Migrations complete — all tables ready.');
}
