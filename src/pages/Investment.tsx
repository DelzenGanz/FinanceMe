// ============================================================
// FinanceMe — Investment Page
// PieChart allocation, cards per investment, summary.
// ============================================================

import { useEffect, useState } from 'react';
import { api } from '../api/ipc';
import { formatCurrency, parseCurrency } from '../utils/formatCurrency';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/shared/Modal';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Pencil, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import type { InvestmentAllocation } from '../../electron/database/types';

const TYPE_LABELS: Record<string, string> = {
  reksa_dana: 'Reksa Dana', saham: 'Saham', crypto: 'Crypto',
  emas: 'Emas', deposito: 'Deposito', other: 'Lainnya',
};

const TYPE_TIPS: Record<string, string> = {
  reksa_dana: 'Cocok untuk pemula — dikelola oleh manajer investasi profesional.',
  saham: 'Potensi return tinggi, namun risiko juga tinggi. Pelajari fundamental perusahaan.',
  crypto: 'Sangat volatil. Alokasikan hanya dana yang siap Anda tanggung risikonya.',
  emas: 'Aset safe haven yang baik untuk diversifikasi dan lindung nilai inflasi.',
  deposito: 'Risiko rendah dengan return stabil. Cocok untuk dana darurat.',
  other: 'Pertimbangkan diversifikasi untuk mengurangi risiko keseluruhan.',
};

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#8B5CF6'];

const Investment = () => {
  const { user } = useAuthStore();
  const currency = user?.currency ?? 'IDR';
  const monthlyIncome = user?.monthly_income ?? 0;

  const [allocations, setAllocations] = useState<InvestmentAllocation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<InvestmentAllocation | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('reksa_dana');
  const [formPct, setFormPct] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await api.investments.getAll();
      setAllocations(data);
    } catch (err) { console.error(err); }
  };

  const totalPct = allocations.reduce((s, a) => s + a.allocation_percentage, 0);
  const totalMonthly = allocations.reduce((s, a) => s + (monthlyIncome * a.allocation_percentage / 100), 0);

  const pieData = allocations.map((a, i) => ({
    name: a.name,
    value: a.allocation_percentage,
    fill: COLORS[i % COLORS.length],
  }));

  const openCreate = () => {
    setEditing(null);
    setFormName(''); setFormType('reksa_dana'); setFormPct(''); setFormNotes(''); setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (a: InvestmentAllocation) => {
    setEditing(a);
    setFormName(a.name); setFormType(a.type ?? 'other'); setFormPct(String(a.allocation_percentage)); setFormNotes(a.notes ?? ''); setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const numericPct = parseCurrency(formPct);
    if (!formName.trim()) { setFormError('Nama wajib diisi'); return; }
    if (!formPct || numericPct <= 0) { setFormError('Persentase harus lebih dari 0'); return; }
    try {
      const data = {
        user_id: user?.id ?? 1,
        name: formName.trim(),
        allocation_percentage: numericPct,
        target_monthly: monthlyIncome * numericPct / 100,
        type: formType,
        notes: formNotes || undefined,
      };
      if (editing) { await api.investments.update(editing.id, data); }
      else { await api.investments.create(data); }
      setIsModalOpen(false);
      loadData();
    } catch { setFormError('Gagal menyimpan'); }
  };

  const handleDelete = async (id: number) => {
    await api.investments.delete(id);
    loadData();
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Investment</h1>
          <p className="text-slate-400 text-sm mt-1">Kelola alokasi investasi dari pendapatan Anda</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Tambah Alokasi
        </button>
      </div>

      {/* Warning */}
      {totalPct > 100 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle size={20} className="text-amber-400" />
          <p className="text-amber-400 text-sm">Total alokasi melebihi 100% ({totalPct.toFixed(1)}%). Sesuaikan kembali alokasi Anda.</p>
        </div>
      )}

      {/* Summary + Chart */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pie chart */}
        <div className="col-span-2 bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Alokasi Investasi</h3>
          {allocations.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-slate-500">Belum ada alokasi</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name} (${value}%)`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9' }} formatter={(value: number) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
            <p className="text-xs text-slate-400 font-medium">Total Teralokasi</p>
            <p className={`text-2xl font-bold mt-1 ${totalPct > 100 ? 'text-amber-400' : 'text-indigo-400'}`}>{totalPct.toFixed(1)}%</p>
          </div>
          <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
            <p className="text-xs text-slate-400 font-medium">Target Rp/Bulan</p>
            <p className="text-2xl font-bold mt-1 text-green-400">{formatCurrency(totalMonthly, currency)}</p>
          </div>
          <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
            <p className="text-xs text-slate-400 font-medium">Sisa Belum Dialokasikan</p>
            <p className="text-2xl font-bold mt-1 text-slate-300">{Math.max(0, 100 - totalPct).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Allocation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {allocations.map((a, i) => (
          <div key={a.id} className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5 hover:ring-slate-600 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS[i % COLORS.length]}15` }}>
                  <TrendingUp size={16} style={{ color: COLORS[i % COLORS.length] }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{a.name}</p>
                  <p className="text-xs text-slate-500">{TYPE_LABELS[a.type ?? 'other']}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(a)} className="p-1 text-slate-400 hover:text-indigo-400 transition-colors"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(a.id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-slate-400">Alokasi</span>
              <span className="text-slate-200 font-medium">{a.allocation_percentage}%</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-400">Target/bulan</span>
              <span className="text-green-400 font-medium">{formatCurrency(monthlyIncome * a.allocation_percentage / 100, currency)}</span>
            </div>
            {a.type && TYPE_TIPS[a.type] && (
              <p className="text-xs text-slate-500 mt-3 italic">{TYPE_TIPS[a.type]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Alokasi' : 'Tambah Alokasi'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama Investasi</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: Reksa Dana BCA" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipe</label>
            <select value={formType} onChange={e => setFormType(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">% dari Income Bulanan</label>
            <input type="number" value={formPct} onChange={e => setFormPct(e.target.value)} placeholder="10" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {formPct && monthlyIncome > 0 && (
              <p className="text-xs text-slate-500 mt-1">= {formatCurrency(monthlyIncome * parseCurrency(formPct) / 100, currency)} / bulan</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Catatan (opsional)</label>
            <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Catatan" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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

export default Investment;
