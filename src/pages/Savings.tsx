// ============================================================
// FinanceMe — Savings Goals Page
// Goal cards with progress, deposit modal, completed section.
// ============================================================

import { useEffect, useState } from 'react';
import { api } from '../api/ipc';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/shared/Modal';
import dayjs from 'dayjs';
import { Plus, PiggyBank, CheckCircle2, Clock, Target } from 'lucide-react';
import type { SavingsGoal } from '../../electron/database/types';

const Savings = () => {
  const { user } = useAuthStore();
  const currency = user?.currency ?? 'IDR';

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Create form
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formColor, setFormColor] = useState('#22C55E');
  const [formError, setFormError] = useState('');

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await api.savings.getAll();
      setGoals(data);
    } catch (err) { console.error(err); }
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  const handleCreate = async () => {
    if (!formName.trim()) { setFormError('Nama wajib diisi'); return; }
    if (!formTarget || Number(formTarget) <= 0) { setFormError('Target harus lebih dari 0'); return; }
    try {
      await api.savings.create({
        user_id: user?.id ?? 1,
        name: formName.trim(),
        target_amount: Number(formTarget),
        deadline: formDeadline || undefined,
        color: formColor,
      });
      setIsCreateOpen(false);
      loadData();
    } catch { setFormError('Gagal membuat goal'); }
  };

  const handleDeposit = async () => {
    if (!selectedGoal || !depositAmount || Number(depositAmount) <= 0) return;
    try {
      await api.savings.deposit(selectedGoal.id, Number(depositAmount));
      setIsDepositOpen(false);
      setDepositAmount('');
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    await api.savings.delete(id);
    loadData();
  };

  const openDeposit = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setDepositAmount('');
    setIsDepositOpen(true);
  };

  const colors = ['#22C55E', '#3B82F6', '#6366F1', '#EC4899', '#F59E0B', '#EF4444', '#14B8A6', '#8B5CF6'];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Savings Goals</h1>
          <p className="text-slate-400 text-sm mt-1">Set dan pantau tujuan tabungan Anda</p>
        </div>
        <button onClick={() => { setFormName(''); setFormTarget(''); setFormDeadline(''); setFormColor('#22C55E'); setFormError(''); setIsCreateOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Tambah Goal
        </button>
      </div>

      {/* Active Goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-12 text-center">
          <PiggyBank size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">Belum ada savings goal.</p>
          <p className="text-slate-500 text-sm mt-1">Mulai buat tujuan tabungan Anda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGoals.map(goal => {
            const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
            const daysLeft = goal.deadline ? dayjs(goal.deadline).diff(dayjs(), 'day') : null;
            return (
              <div key={goal.id} className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5 hover:ring-slate-600 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${goal.color}15` }}>
                      <Target size={16} style={{ color: goal.color }} />
                    </div>
                    <span className="text-sm font-medium text-slate-200">{goal.name}</span>
                  </div>
                  <button onClick={() => handleDelete(goal.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors text-xs">✕</button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{formatCurrency(goal.current_amount, currency)}</span>
                    <span className="text-slate-400">{formatCurrency(goal.target_amount, currency)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium" style={{ color: goal.color }}>{Math.round(pct)}%</span>
                    {daysLeft !== null && (
                      <span className={`text-xs flex items-center gap-1 ${daysLeft > 0 ? 'text-slate-500' : 'text-red-400'}`}>
                        <Clock size={10} /> {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Terlambat'}
                      </span>
                    )}
                  </div>
                </div>

                <button onClick={() => openDeposit(goal)} className="w-full mt-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors font-medium">
                  + Tambah Dana
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-400" /> Goal Tercapai
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map(goal => (
              <div key={goal.id} className="bg-slate-800/60 rounded-xl ring-1 ring-green-500/20 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <span className="text-sm font-medium text-slate-300">{goal.name}</span>
                </div>
                <p className="text-green-400 font-bold">{formatCurrency(goal.target_amount, currency)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Tambah Savings Goal">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama Goal</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Dana Darurat" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Target</label>
            <input type="number" value={formTarget} onChange={e => setFormTarget(e.target.value)} placeholder="0" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Deadline (opsional)</label>
            <input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Warna</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button key={c} onClick={() => setFormColor(c)} className={`w-8 h-8 rounded-full transition-all ${formColor === c ? 'ring-2 ring-white scale-110' : 'ring-1 ring-slate-600'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {formError && <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-red-400 text-sm">{formError}</p></div>}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsCreateOpen(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">Batal</button>
            <button onClick={handleCreate} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">Simpan</button>
          </div>
        </div>
      </Modal>

      {/* Deposit Modal */}
      <Modal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} title={`Tambah Dana — ${selectedGoal?.name ?? ''}`}>
        <div className="space-y-4">
          {selectedGoal && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Saat ini</span>
                <span className="text-slate-200">{formatCurrency(selectedGoal.current_amount, currency)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-400">Target</span>
                <span className="text-slate-200">{formatCurrency(selectedGoal.target_amount, currency)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-400">Kurang</span>
                <span className="text-green-400 font-medium">{formatCurrency(selectedGoal.target_amount - selectedGoal.current_amount, currency)}</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Jumlah Deposit</label>
            <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0" autoFocus className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsDepositOpen(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">Batal</button>
            <button onClick={handleDeposit} className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">Deposit</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Savings;
