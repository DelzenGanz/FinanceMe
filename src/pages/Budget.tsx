// ============================================================
// FinanceMe — Budget Page
// Grid cards per category with progress bars + add/edit modal.
// ============================================================

import { useEffect, useState } from 'react';
import { api } from '../api/ipc';
import { formatCurrency, formatNumberWithSeparators, parseCurrency } from '../utils/formatCurrency';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/shared/Modal';
import dayjs from 'dayjs';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import type { Category } from '../../electron/database/types';

interface BudgetItem {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  period: string;
  month: number;
  year: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  spent: number;
}

const Budget = () => {
  const { user } = useAuthStore();
  const currency = user?.currency ?? 'IDR';

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);

  // Form
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => { loadData(); }, [month, year]);

  const loadData = async () => {
    try {
      const [budgetData, catData] = await Promise.all([
        api.budgets.getOverview(month, year),
        api.categories.getAll(),
      ]);
      setBudgets(budgetData as BudgetItem[]);
      setCategories(catData.filter(c => c.type === 'expense'));
    } catch (err) { console.error(err); }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  const openCreate = () => {
    setEditingBudget(null);
    setFormCategoryId('');
    setFormAmount('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (b: BudgetItem) => {
    setEditingBudget(b);
    setFormCategoryId(String(b.category_id));
    setFormAmount(formatNumberWithSeparators(b.amount));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formCategoryId) { setFormError('Pilih kategori'); return; }
    const numericAmount = parseCurrency(formAmount);
    if (!formAmount || numericAmount <= 0) { setFormError('Jumlah harus lebih dari 0'); return; }

    try {
      if (editingBudget) {
        await api.budgets.update(editingBudget.id, { amount: numericAmount, category_id: Number(formCategoryId) });
      } else {
        await api.budgets.create({ user_id: user?.id ?? 1, category_id: Number(formCategoryId), amount: numericAmount, month, year });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) { setFormError('Gagal menyimpan'); }
  };

  const handleDelete = async (id: number) => {
    await api.budgets.delete(id);
    loadData();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Budget</h1>
          <p className="text-slate-400 text-sm mt-1">Track budget per kategori pengeluaran</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{dayjs().month(i).format('MMMM')}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {Array.from({ length: 5 }, (_, i) => { const y = dayjs().year()-2+i; return <option key={y} value={y}>{y}</option>; })}
          </select>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Tambah Budget
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex-1 bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-4 py-3">
          <p className="text-xs text-indigo-400 font-medium">Total Budget</p>
          <p className="text-lg font-bold text-indigo-400">{formatCurrency(totalBudget, currency)}</p>
        </div>
        <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
          <p className="text-xs text-red-400 font-medium">Total Spent</p>
          <p className="text-lg font-bold text-red-400">{formatCurrency(totalSpent, currency)}</p>
        </div>
        <div className={`flex-1 border rounded-lg px-4 py-3 ${totalBudget - totalSpent >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <p className={`text-xs font-medium ${totalBudget - totalSpent >= 0 ? 'text-green-400' : 'text-red-400'}`}>Remaining</p>
          <p className={`text-lg font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(totalBudget - totalSpent, currency)}</p>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {budgets.length === 0 ? (
        <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-12 text-center">
          <Wallet size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">Belum ada budget bulan ini.</p>
          <p className="text-slate-500 text-sm mt-1">Klik "Tambah Budget" untuk mulai mengatur anggaran.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(b => {
            const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
            const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500';
            const statusColor = pct > 90 ? 'text-red-400' : pct > 70 ? 'text-amber-400' : 'text-green-400';
            return (
              <div key={b.id} className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5 hover:ring-slate-600 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.category_color }} />
                    <span className="text-sm font-medium text-slate-200">{b.category_name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(b.id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{formatCurrency(b.spent, currency)}</span>
                    <span className="text-slate-400">{formatCurrency(b.amount, currency)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium ${statusColor}`}>{Math.round(pct)}% used</span>
                    <span className="text-xs text-slate-500">Sisa: {formatCurrency(Math.max(0, b.amount - b.spent), currency)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBudget ? 'Edit Budget' : 'Tambah Budget'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Kategori</label>
            <select value={formCategoryId} onChange={e => setFormCategoryId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Pilih kategori</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Limit Budget</label>
            <input
              type="text"
              value={formAmount}
              onChange={e => setFormAmount(formatNumberWithSeparators(e.target.value))}
              placeholder="0"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {formError && <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-red-400 text-sm">{formError}</p></div>}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">Batal</button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">Simpan</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Budget;
