// ============================================================
// FinanceMe — Default Category Seeder
// Run once on first launch if categories table is empty.
// All default categories have user_id = NULL (system-level).
// ============================================================

import { getDb } from './db';

interface SeedCategory {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

const defaultExpenseCategories: SeedCategory[] = [
  { name: 'Makanan & Minuman', type: 'expense', icon: 'utensils',        color: '#EF4444' },
  { name: 'Transportasi',      type: 'expense', icon: 'car',             color: '#3B82F6' },
  { name: 'Belanja',           type: 'expense', icon: 'shopping-bag',    color: '#F59E0B' },
  { name: 'Kesehatan',         type: 'expense', icon: 'heart-pulse',     color: '#EC4899' },
  { name: 'Hiburan',           type: 'expense', icon: 'gamepad-2',       color: '#8B5CF6' },
  { name: 'Pendidikan',        type: 'expense', icon: 'graduation-cap',  color: '#14B8A6' },
  { name: 'Tagihan & Utilitas',type: 'expense', icon: 'receipt',         color: '#F97316' },
  { name: 'Investasi',         type: 'expense', icon: 'trending-up',     color: '#6366F1' },
  { name: 'Lainnya',           type: 'expense', icon: 'circle',          color: '#94A3B8' },
];

const defaultIncomeCategories: SeedCategory[] = [
  { name: 'Gaji',              type: 'income', icon: 'banknote',         color: '#22C55E' },
  { name: 'Freelance',         type: 'income', icon: 'laptop',           color: '#3B82F6' },
  { name: 'Bisnis',            type: 'income', icon: 'briefcase',        color: '#F59E0B' },
  { name: 'Investasi Return',  type: 'income', icon: 'trending-up',      color: '#6366F1' },
  { name: 'Hadiah',            type: 'income', icon: 'gift',             color: '#EC4899' },
  { name: 'Lainnya',           type: 'income', icon: 'circle',           color: '#94A3B8' },
];

/**
 * Seed default categories if the categories table is empty.
 */
export function runSeeders(): void {
  const db = getDb();

  const count = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

  if (count.count > 0) {
    console.log('[Seed] Categories already exist — skipping seed.');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO categories (user_id, name, type, icon, color)
    VALUES (NULL, @name, @type, @icon, @color)
  `);

  const seedAll = db.transaction((categories: SeedCategory[]) => {
    for (const cat of categories) {
      insert.run(cat);
    }
  });

  seedAll([...defaultExpenseCategories, ...defaultIncomeCategories]);

  console.log(`[Seed] Inserted ${defaultExpenseCategories.length + defaultIncomeCategories.length} default categories.`);
}
