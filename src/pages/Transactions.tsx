// ============================================================
// FinanceMe — Transactions Page
// Full CRUD with filters, modal form, CSV export.
// ============================================================

import { useEffect, useState } from 'react';
import { api } from '../api/ipc';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/shared/Modal';
import dayjs from 'dayjs';
import {
  Plus, Search, Download, Pencil, Trash2,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import type { Transaction, Category } from '../../electron/database/types';

const Transactions = () => {
  const { user } = useAuthStore();
  const currency = user?.currency ?? 'IDR';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterMonth, setFilterMonth] = useState(dayjs().month() + 1);
  const [filterYear, setFilterYear] = useState(dayjs().year());
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDate, setFormDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [formDescription, setFormDescription] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formRecurring, setFormRecurring] = useState(false);
  const [formInterval, setFormInterval] = useState('monthly');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, [filterMonth, filterYear, filterType, filterCategory]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [txData, catData] = await Promise.all([
        api.transactions.getAll({
          month: filterMonth,
          year: filterYear,
          ...(filterType ? { type: filterType } : {}),
          ...(filterCategory ? { category_id: Number(filterCategory) } : {}),
        }),
        api.categories.getAll(),
      ]);
      setTransactions(txData);
      setCategories(catData);
    } catch (err) {
      console.error('[Transactions] Failed to load:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTx(null);
    setFormType('expense');
    setFormAmount('');
    setFormCategoryId('');
    setFormDate(dayjs().format('YYYY-MM-DD'));
    setFormDescription('');
    setFormNote('');
    setFormRecurring(false);
    setFormInterval('monthly');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormAmount(String(tx.amount));
    setFormCategoryId(String(tx.category_id ?? ''));
    setFormDate(tx.date);
    setFormDescription(tx.description ?? '');
    setFormNote(tx.note ?? '');
    setFormRecurring(!!tx.is_recurring);
    setFormInterval(tx.recurring_interval ?? 'monthly');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!formAmount || Number(formAmount) <= 0) { setFormError('Jumlah harus lebih dari 0'); return; }
    if (!formDate) { setFormError('Tanggal wajib diisi'); return; }

    const data = {
      user_id: user?.id ?? 1,
      type: formType,
      amount: Number(formAmount),
      category_id: formCategoryId ? Number(formCategoryId) : undefined,
      date: formDate,
      description: formDescription || undefined,
      note: formNote || undefined,
      is_recurring: formRecurring,
      recurring_interval: formRecurring ? formInterval : undefined,
    };

    try {
      if (editingTx) {
        await api.transactions.update(editingTx.id, data);
      } else {
        await api.transactions.create(data);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError('Gagal menyimpan transaksi');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.transactions.delete(id);
      loadData();
    } catch (err) {
      console.error('[Transactions] Delete failed:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = await api.transactions.exportCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financement-transactions-${dayjs().format('YYYY-MM-DD')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Transactions] Export failed:', err);
    }
  };

  const filteredCategories = categories.filter(c =>
    formType ? c.type === formType : true
  );

  const getCategoryName = (catId: number | null) => {
    if (!catId) return '-';
    return categories.find(c => c.id === catId)?.name ?? '-';
  };

  // Totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">Kelola pemasukan dan pengeluaran Anda</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-slate-800 rounded-xl ring-1 ring-slate-700 p-4">
        <Search size={16} className="text-slate-400" />
        <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{dayjs().month(i).format('MMMM')}</option>
          ))}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {Array.from({ length: 5 }, (_, i) => {
            const y = dayjs().year() - 2 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Semua Tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4">
        <div className="flex-1 bg-green-500/5 border border-green-500/20 rounded-lg px-4 py-3">
          <p className="text-xs text-green-400 font-medium">Pemasukan</p>
          <p className="text-lg font-bold text-green-400">{formatCurrency(totalIncome, currency)}</p>
        </div>
        <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
          <p className="text-xs text-red-400 font-medium">Pengeluaran</p>
          <p className="text-lg font-bold text-red-400">{formatCurrency(totalExpense, currency)}</p>
        </div>
        <div className="flex-1 bg-indigo-500/5 border border-indigo-500/20 rounded-lg px-4 py-3">
          <p className="text-xs text-indigo-400 font-medium">Selisih</p>
          <p className="text-lg font-bold text-indigo-400">{formatCurrency(totalIncome - totalExpense, currency)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Tidak ada transaksi di bulan ini.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                <th className="text-left py-3 px-4">Tanggal</th>
                <th className="text-left py-3 px-4">Deskripsi</th>
                <th className="text-left py-3 px-4">Kategori</th>
                <th className="text-left py-3 px-4">Tipe</th>
                <th className="text-right py-3 px-4">Jumlah</th>
                <th className="text-right py-3 px-4 w-24">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 text-slate-400">{dayjs(tx.date).format('DD MMM YYYY')}</td>
                  <td className="py-3 px-4 text-slate-200">{tx.description || '-'}</td>
                  <td className="py-3 px-4 text-slate-300">{getCategoryName(tx.category_id)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {tx.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEditModal(tx)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors ml-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create/Edit Modal ─────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTx ? 'Edit Transaksi' : 'Tambah Transaksi'}
      >
        <div className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setFormType('expense')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                formType === 'expense' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' : 'bg-slate-700 text-slate-400'
              }`}
            >Pengeluaran</button>
            <button
              onClick={() => setFormType('income')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                formType === 'income' ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30' : 'bg-slate-700 text-slate-400'
              }`}
            >Pemasukan</button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Jumlah</label>
            <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Kategori</label>
            <select value={formCategoryId} onChange={e => setFormCategoryId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Pilih kategori</option>
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tanggal</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Deskripsi</label>
            <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Contoh: Makan siang" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Catatan (opsional)</label>
            <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="Catatan tambahan" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formRecurring} onChange={e => setFormRecurring(e.target.checked)} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-indigo-500" />
              <span className="text-sm text-slate-300">Transaksi berulang</span>
            </label>
            {formRecurring && (
              <select value={formInterval} onChange={e => setFormInterval(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            )}
          </div>

          {/* Error */}
          {formError && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{formError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">
              Batal
            </button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
              {editingTx ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Transactions;
