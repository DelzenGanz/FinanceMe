// ============================================================
// FinanceMe — Database Connection (better-sqlite3)
// ============================================================

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

let db: Database.Database | null = null;

/**
 * Initialize the SQLite database connection.
 * Database file stored at: app.getPath('userData') + '/financement.db'
 * On macOS: ~/Library/Application Support/financement/financement.db
 */
export function initDatabase(): void {
  const userDataPath = app.getPath('userData');

  // Ensure the directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'financement.db');

  console.log(`[DB] Using Database at: ${dbPath}`);

  db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');
}

/**
 * Get the active database instance.
 * Throws if database has not been initialized.
 */
export function getDb(): Database.Database {
  if (!db) {
    throw new Error('[DB] Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection gracefully.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Database connection closed.');
  }
}
