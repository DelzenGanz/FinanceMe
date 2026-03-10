// ============================================================
// FinanceMe — Dashboard Page
// Summary cards, cashflow chart, budget progress, recent
// transactions, health score, savings widget.
// ============================================================

import { useEffect, useState } from 'react';
import { api } from '../api/ipc';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, ShieldCheck,
  ArrowUpRight, ArrowDownRight, PiggyBank,
} from 'lucide-react';

interface SummaryData {
  total_income: number;
  total_expense: number;
  balance: number;
  safe_to_spend: number;
}

interface CashflowItem {
  month: string;
  income: number;
  expense: number;
}

interface RecentTx {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  category_name?: string;
}

interface SavingsGoalItem {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  is_completed: number;
}

interface BudgetItem {
  category_name: string;
  category_color: string;
  amount: number;
  spent: number;
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<SummaryData>({ total_income: 0, total_expense: 0, balance: 0, safe_to_spend: 0 });
  const [cashflow, setCashflow] = useState<CashflowItem[]>([]);
  const [recentTx, setRecentTx] = useState<RecentTx[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoalItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [healthScore, setHealthScore] = useState({ score: 0, label: 'N/A' });

  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryData, cashflowData, recent, goals, budgetOverview, health] = await Promise.all([
        api.dashboard.getSummary(currentMonth, currentYear),
        api.dashboard.getCashflow(),
        api.transactions.getRecent(),
        api.savings.getAll(),
        api.budgets.getOverview(currentMonth, currentYear),
        api.dashboard.getHealthScore(),
      ]);
      setSummary(summaryData);
      setCashflow(cashflowData);
      setRecentTx(recent as RecentTx[]);
      setSavingsGoals(goals as SavingsGoalItem[]);
      setBudgets(budgetOverview as BudgetItem[]);
      setHealthScore(health);
    } catch (err) {
      console.error('[Dashboard] Failed to load data:', err);
    }
  };

  const currency = user?.currency ?? 'IDR';

  // Health score color
  const scoreColor = healthScore.score <= 40 ? '#EF4444' : healthScore.score <= 60 ? '#F59E0B' : healthScore.score <= 80 ? '#22C55E' : '#3B82F6';
  const scoreLabel = healthScore.score <= 40 ? 'Kritis' : healthScore.score <= 60 ? 'Waspada' : healthScore.score <= 80 ? 'Baik' : 'Excellent';

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-2rem)]">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Ringkasan keuangan — {dayjs().format('MMMM YYYY')}
        </p>
      </div>

      {/* ── Summary Cards ─────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          title="Total Pemasukan"
          value={formatCurrency(summary.total_income, currency)}
          icon={<TrendingUp size={20} />}
          iconBg="bg-green-500/10"
          iconColor="text-green-400"
          trend={<ArrowUpRight size={14} className="text-green-400" />}
        />
        <SummaryCard
          title="Total Pengeluaran"
          value={formatCurrency(summary.total_expense, currency)}
          icon={<TrendingDown size={20} />}
          iconBg="bg-red-500/10"
          iconColor="text-red-400"
          trend={<ArrowDownRight size={14} className="text-red-400" />}
        />
        <SummaryCard
          title="Sisa Saldo"
          value={formatCurrency(summary.balance, currency)}
          icon={<Wallet size={20} />}
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-400"
        />
        <SummaryCard
          title="Aman Dipakai"
          value={formatCurrency(summary.safe_to_spend, currency)}
          icon={<ShieldCheck size={20} />}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
        />
      </div>

      {/* ── Row 2: Charts ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Cashflow Chart */}
        <div className="col-span-2 bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Cashflow — 6 Bulan Terakhir</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cashflow} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#F1F5F9' }}
                formatter={(value: number) => formatCurrency(value, currency)}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
              <Bar dataKey="income" name="Pemasukan" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Health Score */}
        <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Financial Health</h3>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#334155" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeDasharray={`${(healthScore.score / 100) * 314} 314`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-100">{healthScore.score}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
          </div>
          <span className="mt-3 text-sm font-semibold" style={{ color: scoreColor }}>{scoreLabel}</span>
        </div>
      </div>

      {/* ── Row 3: Budget Progress + Savings ──────────── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Budget Progress */}
        <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Budget Bulan Ini</h3>
          {budgets.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada budget. Buat di halaman Budget.</p>
          ) : (
            <div className="space-y-3">
              {budgets.slice(0, 5).map((b, i) => {
                const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
                const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500';
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{b.category_name}</span>
                      <span className="text-slate-400">
                        {formatCurrency(b.spent, currency)} / {formatCurrency(b.amount, currency)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Savings Goals */}
        <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            <PiggyBank size={16} className="inline mr-2" />
            Savings Goals
          </h3>
          {savingsGoals.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada goal. Buat di halaman Savings.</p>
          ) : (
            <div className="space-y-3">
              {savingsGoals.filter(g => !g.is_completed).slice(0, 4).map((g) => {
                const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0;
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{g.name}</span>
                      <span className="text-slate-400">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                    </div>
                    {g.deadline && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {dayjs(g.deadline).diff(dayjs(), 'day') > 0
                          ? `${dayjs(g.deadline).diff(dayjs(), 'day')} hari lagi`
                          : 'Terlambat'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Recent Transactions ─────────────────── */}
      <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Transaksi Terakhir</h3>
        {recentTx.length === 0 ? (
          <p className="text-slate-500 text-sm">Belum ada transaksi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs uppercase border-b border-slate-700">
                  <th className="text-left py-2 px-3">Tanggal</th>
                  <th className="text-left py-2 px-3">Deskripsi</th>
                  <th className="text-left py-2 px-3">Tipe</th>
                  <th className="text-right py-2 px-3">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{dayjs(tx.date).format('DD MMM YYYY')}</td>
                    <td className="py-2.5 px-3 text-slate-200">{tx.description || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {tx.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 text-right font-medium ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Summary Card Component ──────────────────────────────────
interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: React.ReactNode;
}

function SummaryCard({ title, value, icon, iconBg, iconColor, trend }: SummaryCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-5 hover:ring-slate-600 transition-all duration-150">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        {trend}
      </div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{title}</p>
      <p className="text-xl font-bold text-slate-100 mt-1">{value}</p>
    </div>
  );
}

export default Dashboard;
