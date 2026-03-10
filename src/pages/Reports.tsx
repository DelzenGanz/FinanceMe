// ============================================================
// FinanceMe — Reports Page
// 3 tabs: Monthly report, 12-month Trends, Category breakdown.
// ============================================================

import { useEffect, useState } from 'react';
import { api } from '../api/ipc';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, FileText, Percent } from 'lucide-react';

import type { CategoryBreakdown } from '../../electron/database/types';

type TabId = 'monthly' | 'trends' | 'category';

interface MonthlyReport {
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  savings_rate: number;
  top_expense_categories: CategoryBreakdown[];
}

interface TrendItem {
  month: string;
  income: number;
  expense: number;
}

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#8B5CF6', '#F97316', '#A855F7'];

const Reports = () => {
  const { user } = useAuthStore();
  const currency = user?.currency ?? 'IDR';

  const [activeTab, setActiveTab] = useState<TabId>('monthly');
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());

  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);

  useEffect(() => {
    if (activeTab === 'monthly') loadMonthly();
    else if (activeTab === 'trends') loadTrends();
    else if (activeTab === 'category') loadCategories();
  }, [activeTab, month, year]);

  const loadMonthly = async () => {
    try {
      const data = await api.reports.getMonthly(month, year) as MonthlyReport;
      setMonthly(data);
    } catch (err) { console.error(err); }
  };

  const loadTrends = async () => {
    try {
      const data = await api.reports.getTrends() as TrendItem[];
      setTrends(data);
    } catch (err) { console.error(err); }
  };

  const loadCategories = async () => {
    try {
      const data = await api.reports.getCategoryBreakdown(month, year);
      setCategories(data);
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: 'monthly' as TabId, label: 'Bulanan', icon: <FileText size={16} /> },
    { id: 'trends' as TabId, label: 'Tren 12 Bulan', icon: <TrendingUp size={16} /> },
    { id: 'category' as TabId, label: 'Kategori', icon: <Percent size={16} /> },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-2rem)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Analisa dan tren keuangan Anda</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-lg p-1 ring-1 ring-slate-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-500 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Monthly ─────────────────────────── */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          {/* Month/Year selector */}
          <div className="flex gap-3">
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{dayjs().month(i).format('MMMM')}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Array.from({ length: 5 }, (_, i) => { const y = dayjs().year()-2+i; return <option key={y} value={y}>{y}</option>; })}
            </select>
          </div>

          {monthly && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-400" /><span className="text-xs text-slate-400 font-medium">Pemasukan</span></div>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(monthly.total_income, currency)}</p>
                </div>
                <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-red-400" /><span className="text-xs text-slate-400 font-medium">Pengeluaran</span></div>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(monthly.total_expense, currency)}</p>
                </div>
                <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
                  <div className="flex items-center gap-2 mb-2"><Percent size={16} className="text-indigo-400" /><span className="text-xs text-slate-400 font-medium">Savings Rate</span></div>
                  <p className="text-xl font-bold text-indigo-400">{monthly.savings_rate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Top Categories */}
              <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Top 5 Kategori Pengeluaran</h3>
                {(!monthly.top_expense_categories || monthly.top_expense_categories.length === 0) ? (
                  <p className="text-slate-500 text-sm">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {monthly.top_expense_categories.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.category_color || COLORS[i] }} />
                          <span className="text-sm text-slate-300">{cat.category_name}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-200">{formatCurrency(cat.total, currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Trends ──────────────────────────── */}
      {activeTab === 'trends' && (
        <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Tren 12 Bulan — Income vs Expense</h3>
          {trends.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada data tren</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9' }} formatter={(value: number) => formatCurrency(value, currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="income" name="Pemasukan" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 4 }} />
                <Line type="monotone" dataKey="expense" name="Pengeluaran" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Tab: Category Breakdown ──────────────── */}
      {activeTab === 'category' && (
        <div className="space-y-4">
          {/* Month selector */}
          <div className="flex gap-3">
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{dayjs().month(i).format('MMMM')}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Array.from({ length: 5 }, (_, i) => { const y = dayjs().year()-2+i; return <option key={y} value={y}>{y}</option>; })}
            </select>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {/* Donut Chart */}
            <div className="col-span-2 bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Breakdown Pengeluaran</h3>
              {categories.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-slate-500 text-sm">Tidak ada data</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categories} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="total" nameKey="category_name">
                      {categories.map((c, i) => <Cell key={i} fill={c.category_color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9' }} formatter={(value: number) => formatCurrency(value, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category Table */}
            <div className="col-span-3 bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Detail Kategori</h3>
              {categories.length === 0 ? (
                <p className="text-slate-500 text-sm">Tidak ada data</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                      <th className="text-left py-2 px-3">Kategori</th>
                      <th className="text-right py-2 px-3">Jumlah</th>
                      <th className="text-right py-2 px-3">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c, i) => (
                      <tr key={i} className="border-b border-slate-700/50">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.category_color || COLORS[i % COLORS.length] }} />
                            <span className="text-slate-300">{c.category_name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-200">{formatCurrency(c.total, currency)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{c.percentage?.toFixed(1) ?? '0'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
